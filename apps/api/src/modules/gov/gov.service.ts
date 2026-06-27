import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { UserEntity, ReportEntity, ElectionReportEntity, CampaignEntity } from '../../database/entities';

const GOV_TIERS: Record<string, { historyDays: number; canExport: boolean; label: string }> = {
  free: { historyDays: 7, canExport: false, label: 'Free' },
  basic: { historyDays: 90, canExport: true, label: 'Agency Basic' },
  pro: { historyDays: 365, canExport: true, label: 'Agency Pro' },
  enterprise: { historyDays: 9999, canExport: true, label: 'Enterprise' },
};

@Injectable()
export class GovService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ReportEntity) private readonly reportRepo: Repository<ReportEntity>,
    @InjectRepository(ElectionReportEntity) private readonly electionRepo: Repository<ElectionReportEntity>,
    @InjectRepository(CampaignEntity) private readonly campaignRepo: Repository<CampaignEntity>,
  ) {}

  getTierForUser(user: any): { historyDays: number; canExport: boolean; label: string } {
    const tier = user?.subscriptionTier || 'free';
    return GOV_TIERS[tier] || GOV_TIERS.free;
  }

  async register(userId: string, dto: { agencyName: string; jurisdiction: string; contactEmail: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'gov_agency') throw new BadRequestException('Already registered as agency');

    await this.userRepo.update(userId, { role: 'gov_pending' });
    return { registered: true, status: 'pending_approval', message: 'Your agency registration is pending admin approval.' };
  }

  async getGovMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isGov = ['gov_agency', 'super_admin', 'admin'].includes(user.role);
    const isPending = user.role === 'gov_pending';
    const trialActive = user.govTrialEnd ? new Date(user.govTrialEnd) > new Date() : false;
    const trialDaysLeft = user.govTrialEnd ? Math.max(0, Math.ceil((new Date(user.govTrialEnd).getTime() - Date.now()) / 86400000)) : 0;

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isGov,
      isPending,
      trialActive,
      trialDaysLeft,
      jurisdiction: { country: user.govJurisdictionCountry, state: user.govJurisdictionState },
    };
  }

  async getReportDetail(id: string) {
    const report = await this.reportRepo.findOne({ where: { id }, relations: ['author'] });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async getElections(country: string) {
    const feed = await this.electionRepo.find({ where: { country }, order: { createdAt: 'DESC' }, take: 50, relations: ['user'] });
    const incidents = feed.filter(r => ['violence', 'vote_buying', 'intimidation', 'ballot_snatching'].includes(r.type));
    const results = feed.filter(r => r.type === 'result_upload');
    return { feed, incidents, results, total: feed.length };
  }

  async exportCSV(country: string, category?: string, severity?: string, state?: string, dateFrom?: string, userId?: string) {
    // Jurisdiction lock
    const user = userId ? await this.userRepo.findOne({ where: { id: userId } }) : null;
    const lockedCountry = user?.govJurisdictionCountry || country;
    const lockedState = user?.govJurisdictionState || state;

    // Trial check
    if (user?.role === 'gov_agency' && user.govTrialEnd && new Date(user.govTrialEnd) < new Date()) {
      throw new BadRequestException('Trial expired. Please subscribe to continue.');
    }

    const qb = this.reportRepo.createQueryBuilder('r')
      .where('r.country = :country', { country: lockedCountry })
      .andWhere('r.verificationLevel != :deleted', { deleted: 'deleted' })
      .orderBy('r.createdAt', 'DESC')
      .take(500);

    if (category) qb.andWhere('r.category = :category', { category });
    if (severity) qb.andWhere('r.severity = :severity', { severity });
    if (lockedState) qb.andWhere('r.state = :state', { state: lockedState });
    if (dateFrom) qb.andWhere('r.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });

    return qb.getMany();
  }

  async getSOSLive(country: string, userId?: string) {
    const user = userId ? await this.userRepo.findOne({ where: { id: userId } }) : null;
    const lockedCountry = user?.govJurisdictionCountry || country;

    if (user?.role === 'gov_agency' && user.govTrialEnd && new Date(user.govTrialEnd) < new Date()) {
      throw new BadRequestException('Trial expired. Please subscribe to continue.');
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.reportRepo.find({
      where: { country: lockedCountry, category: 'emergency', severity: 'critical', createdAt: MoreThanOrEqual(oneHourAgo) },
      order: { createdAt: 'DESC' },
      take: 20,
      relations: ['author'],
    });
  }

  async getElections(country: string, userId?: string) {
    const user = userId ? await this.userRepo.findOne({ where: { id: userId } }) : null;
    const lockedCountry = user?.govJurisdictionCountry || country;

    if (user?.role === 'gov_agency' && user.govTrialEnd && new Date(user.govTrialEnd) < new Date()) {
      throw new BadRequestException('Trial expired. Please subscribe to continue.');
    }

    const feed = await this.electionRepo.find({ where: { country: lockedCountry }, order: { createdAt: 'DESC' }, take: 50, relations: ['user'] });
    const incidents = feed.filter(r => ['violence', 'vote_buying', 'intimidation', 'ballot_snatching'].includes(r.type));
    const results = feed.filter(r => r.type === 'result_upload');
    return { feed, incidents, results, total: feed.length };
  }

  async getCampaigns(country: string, userId?: string) {
    const user = userId ? await this.userRepo.findOne({ where: { id: userId } }) : null;
    const lockedCountry = user?.govJurisdictionCountry || country;

    if (user?.role === 'gov_agency' && user.govTrialEnd && new Date(user.govTrialEnd) < new Date()) {
      throw new BadRequestException('Trial expired. Please subscribe to continue.');
    }

    const campaigns = await this.campaignRepo.find({ where: { country: lockedCountry, isActive: true }, order: { createdAt: 'DESC' }, take: 20 });
    return { campaigns };
  }

  // Admin methods for managing gov agencies
  async getPendingAgencies() {
    return this.userRepo.find({ where: { role: 'gov_pending' as any }, select: ['id', 'email', 'username', 'displayName', 'createdAt'] });
  }

  async approveAgency(userId: string, country?: string, state?: string) {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);
    await this.userRepo.update(userId, {
      role: 'gov_agency',
      govTrialStart: new Date(),
      govTrialEnd: trialEnd,
      govJurisdictionCountry: country || 'NG',
      govJurisdictionState: state || null,
    } as any);
    return { approved: true, trialEnd };
  }

  async rejectAgency(userId: string) {
    await this.userRepo.update(userId, { role: 'citizen' });
    return { rejected: true };
  }

  async getAllAgencies() {
    return this.userRepo.find({ where: { role: 'gov_agency' as any }, select: ['id', 'email', 'username', 'displayName', 'createdAt'] });
  }
}
