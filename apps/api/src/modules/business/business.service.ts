import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEntity, BusinessResponseEntity, ReportEntity } from '../../database/entities';
import { PaystackService } from '../donations/paystack.service';

const TIERS = {
  basic: { usd: 6.7, label: 'Basic' },
  pro: { usd: 23.3, label: 'Pro' },
  enterprise: { usd: 50, label: 'Enterprise' },
};

const COUNTRY_CURRENCY: Record<string, string> = {
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', UG: 'UGX', RW: 'RWF',
  TZ: 'TZS', ET: 'ETB', SN: 'XOF', CM: 'XAF', EG: 'EGP', MA: 'MAD',
};

const CURRENCY_RATES: Record<string, number> = {
  NGN: 1500, GHS: 14, KES: 150, ZAR: 18, UGX: 3700, RWF: 1300,
  TZS: 2600, ETB: 57, XOF: 600, XAF: 600, EGP: 48, MAD: 10, USD: 1,
};

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepo: Repository<BusinessEntity>,
    @InjectRepository(BusinessResponseEntity)
    private readonly responseRepo: Repository<BusinessResponseEntity>,
    @InjectRepository(ReportEntity)
    private readonly reportRepo: Repository<ReportEntity>,
    private readonly paystackService: PaystackService,
  ) {}

  async register(ownerId: string, country: string, dto: { name: string; description?: string; category: string; state?: string; city?: string; address?: string; latitude?: number; longitude?: number; phone?: string; email?: string; website?: string; logoUrl?: string }) {
    const existing = await this.businessRepo.findOne({ where: { ownerId, name: dto.name } });
    if (existing) throw new BadRequestException('Business already registered');

    const business = this.businessRepo.create({ ...dto, ownerId, country });
    return this.businessRepo.save(business);
  }

  async subscribe(businessId: string, ownerId: string, tier: string, email: string) {
    const business = await this.businessRepo.findOne({ where: { id: businessId, ownerId } });
    if (!business) throw new NotFoundException('Business not found');
    if (!TIERS[tier as keyof typeof TIERS]) throw new BadRequestException('Invalid tier');

    const currency = COUNTRY_CURRENCY[business.country] || 'USD';
    const rate = CURRENCY_RATES[currency] || 1;
    const amount = Math.round(TIERS[tier as keyof typeof TIERS].usd * rate);
    const reference = this.paystackService.generateReference();

    const payment = await this.paystackService.initializePayment({
      email,
      amount: amount * 100,
      currency,
      reference,
      metadata: { type: 'business_subscription', businessId, tier, ownerId },
    });

    return { paymentUrl: payment.data?.authorization_url, reference, tier, amount, currency };
  }

  async activateSubscription(businessId: string, tier: string) {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    await this.businessRepo.update(businessId, { subscriptionTier: tier, subscriptionExpires: expires, isVerified: true });
  }

  async getMyBusinesses(ownerId: string) {
    return this.businessRepo.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
  }

  async getVerifiedNearby(country: string, lat?: number, lng?: number, page = 1, limit = 20) {
    const qb = this.businessRepo.createQueryBuilder('b')
      .where('b.country = :country', { country })
      .andWhere('b.isVerified = true')
      .andWhere('b.isActive = true')
      .orderBy('b.subscriptionTier', 'DESC')
      .addOrderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (lat && lng) {
      const radius = 10 / 111;
      qb.andWhere('b.latitude BETWEEN :minLat AND :maxLat', { minLat: lat - radius, maxLat: lat + radius })
        .andWhere('b.longitude BETWEEN :minLng AND :maxLng', { minLng: lng - radius, maxLng: lng + radius });
    }

    return qb.getMany();
  }

  async getById(id: string) {
    return this.businessRepo.findOne({ where: { id }, relations: ['owner'] });
  }

  getPlans(country: string) {
    const currency = COUNTRY_CURRENCY[country] || 'USD';
    const rate = CURRENCY_RATES[currency] || 1;
    return Object.entries(TIERS).map(([key, tier]) => ({
      tier: key,
      label: tier.label,
      price: Math.round(tier.usd * rate),
      currency,
    }));
  }

  async handleWebhook(reference: string, metadata: any) {
    if (metadata?.type !== 'business_subscription') return;
    await this.activateSubscription(metadata.businessId, metadata.tier);
  }

  async respond(businessId: string, ownerId: string, reportId: string, text: string) {
    const business = await this.businessRepo.findOne({ where: { id: businessId, ownerId } });
    if (!business) throw new NotFoundException('Business not found');
    if (!business.isVerified) throw new ForbiddenException('Business must be subscribed to respond');
    const existing = await this.responseRepo.findOne({ where: { businessId, reportId } });
    if (existing) throw new BadRequestException('Already responded to this report');
    const response = this.responseRepo.create({ businessId, reportId, text });
    return this.responseRepo.save(response);
  }

  async getResponse(reportId: string) {
    return this.responseRepo.find({ where: { reportId }, relations: ['business'] });
  }

  async getAnalytics(businessId: string, ownerId: string) {
    const business = await this.businessRepo.findOne({ where: { id: businessId, ownerId } });
    if (!business) throw new NotFoundException('Business not found');
    if (business.subscriptionTier === 'none' || business.subscriptionTier === 'basic') {
      throw new ForbiddenException('Analytics requires Pro or Enterprise plan');
    }

    const radius = 5 / 111; // ~5km
    let nearbyReports = 0;
    let totalViews = 0;

    if (business.latitude && business.longitude) {
      const result = await this.reportRepo.createQueryBuilder('r')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(r.view_count), 0)', 'views')
        .where('r.latitude BETWEEN :minLat AND :maxLat', { minLat: business.latitude - radius, maxLat: Number(business.latitude) + radius })
        .andWhere('r.longitude BETWEEN :minLng AND :maxLng', { minLng: business.longitude - radius, maxLng: Number(business.longitude) + radius })
        .getRawOne();
      nearbyReports = Number(result?.count) || 0;
      totalViews = Number(result?.views) || 0;
    }

    const responses = await this.responseRepo.count({ where: { businessId } });

    return { nearbyReports, totalViews, responsesPosted: responses, tier: business.subscriptionTier };
  }

  async getPromotedBusinesses(country: string, lat?: number, lng?: number, limit = 3) {
    const qb = this.businessRepo.createQueryBuilder('b')
      .where('b.country = :country', { country })
      .andWhere('b.isVerified = true')
      .andWhere('b.isActive = true')
      .andWhere('b.subscriptionTier IN (:...tiers)', { tiers: ['pro', 'enterprise'] })
      .orderBy('RANDOM()')
      .take(limit);

    if (lat && lng) {
      const radius = 10 / 111;
      qb.andWhere('b.latitude BETWEEN :minLat AND :maxLat', { minLat: lat - radius, maxLat: lat + radius })
        .andWhere('b.longitude BETWEEN :minLng AND :maxLng', { minLng: lng - radius, maxLng: lng + radius });
    }

    return qb.getMany();
  }
}
