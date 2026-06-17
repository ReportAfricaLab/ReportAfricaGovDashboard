import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities';
import { PaystackService } from '../donations/paystack.service';

const TIERS = {
  pro: { usd: 3.3, label: 'Reporter Pro' },
  elite: { usd: 10, label: 'Reporter Elite' },
  legend: { usd: 23.3, label: 'Reporter Legend' },
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
export class SubscriptionService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly paystackService: PaystackService,
  ) {}

  getPlans(country: string) {
    const currency = COUNTRY_CURRENCY[country] || 'USD';
    const rate = CURRENCY_RATES[currency] || 1;
    return Object.entries(TIERS).map(([key, tier]) => ({
      tier: key,
      label: tier.label,
      price: Math.round(tier.usd * rate),
      currency,
      features: this.getFeatures(key),
    }));
  }

  private getFeatures(tier: string): string[] {
    const base = ['✓ Verified badge', '✓ Priority feed ranking', '✓ Safe Route Navigation'];
    if (tier === 'elite' || tier === 'legend') base.push('✓ Academy: MoJo Basics course FREE');
    if (tier === 'legend') base.push('✓ Academy: Safety Reporting course FREE');
    return base;
  }

  async subscribe(userId: string, tier: string, email: string) {
    if (!TIERS[tier as keyof typeof TIERS]) throw new BadRequestException('Invalid tier');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const currency = COUNTRY_CURRENCY[user.country] || 'USD';
    const rate = CURRENCY_RATES[currency] || 1;
    const amount = Math.round(TIERS[tier as keyof typeof TIERS].usd * rate);
    const reference = this.paystackService.generateReference();

    const payment = await this.paystackService.initializePayment({
      email,
      amount: amount * 100,
      currency,
      reference,
      metadata: { type: 'reporter_subscription', userId, tier },
    });

    return { paymentUrl: payment.data?.authorization_url, reference, tier, amount, currency };
  }

  async activateSubscription(userId: string, tier: string) {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    await this.userRepo.update(userId, { subscriptionTier: tier, subscriptionExpires: expires });

    // Auto-enroll in academy courses based on tier
    if (tier === 'elite' || tier === 'legend') {
      // Enroll in first published course (MoJo Basics)
      const courses = await this.userRepo.manager.getRepository('CourseEntity').find({ where: { isPublished: true }, order: { sortOrder: 'ASC' } }) as any[];
      if (courses.length > 0) {
        await this.userRepo.manager.getRepository('EnrollmentEntity').save({ userId, courseId: courses[0].id, completedLessons: [] }).catch(() => {});
      }
      if (tier === 'legend' && courses.length > 1) {
        // Also enroll in second course (Safety Reporting)
        await this.userRepo.manager.getRepository('EnrollmentEntity').save({ userId, courseId: courses[1].id, completedLessons: [] }).catch(() => {});
      }
    }
  }

  async getMySubscription(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'subscriptionTier', 'subscriptionExpires'] });
    if (!user) throw new NotFoundException('User not found');
    const isActive = user.subscriptionExpires && new Date(user.subscriptionExpires) > new Date();
    return { tier: isActive ? user.subscriptionTier : 'free', expires: user.subscriptionExpires, active: !!isActive };
  }

  async handleWebhook(metadata: any) {
    if (metadata?.type !== 'reporter_subscription') return;
    await this.activateSubscription(metadata.userId, metadata.tier);
  }
}
