import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportEntity, UserEntity, CampaignEntity, DonationEntity } from '../../database/entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ReportEntity) private readonly reportRepo: Repository<ReportEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(CampaignEntity) private readonly campaignRepo: Repository<CampaignEntity>,
    @InjectRepository(DonationEntity) private readonly donationRepo: Repository<DonationEntity>,
  ) {}

  async getCountryDashboard(country: string) {
    const [totalReports, totalUsers, activeReports, emergencyReports] = await Promise.all([
      this.reportRepo.count({ where: { country } }),
      this.userRepo.count({ where: { country } }),
      this.reportRepo.count({ where: { country } }),
      this.reportRepo.count({ where: { country, severity: 'critical' } }),
    ]);

    const categoryBreakdown = await this.reportRepo
      .createQueryBuilder('report')
      .select('report.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('report.country = :country', { country })
      .groupBy('report.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    const recentReports = await this.reportRepo.find({
      where: { country },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return { totalReports, totalUsers, activeReports, emergencyReports, categoryBreakdown, recentReports };
  }

  async getIncidentHotspots(country: string, category?: string) {
    const query = this.reportRepo
      .createQueryBuilder('report')
      .select('report.city', 'city')
      .addSelect('report.state', 'state')
      .addSelect('COUNT(*)', 'incidentCount')
      .addSelect('AVG(report.latitude)', 'latitude')
      .addSelect('AVG(report.longitude)', 'longitude')
      .where('report.country = :country', { country })
      .groupBy('report.city')
      .addGroupBy('report.state')
      .orderBy('incidentCount', 'DESC')
      .limit(20);

    if (category) query.andWhere('report.category = :category', { category });

    return query.getRawMany();
  }

  async getTrending(country: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.reportRepo
      .createQueryBuilder('report')
      .where('report.country = :country', { country })
      .andWhere('report.createdAt > :since', { since })
      .orderBy('report.upvotes + report.commentCount', 'DESC')
      .take(20)
      .getMany();
  }

  async getDonationStats(country: string) {
    const totalCampaigns = await this.campaignRepo.count({ where: { country } });
    const activeCampaigns = await this.campaignRepo.count({ where: { country, isActive: true } });

    const totalRaised = await this.campaignRepo
      .createQueryBuilder('campaign')
      .select('SUM(campaign.raisedAmount)', 'total')
      .where('campaign.country = :country', { country })
      .getRawOne();

    const totalDonors = await this.donationRepo
      .createQueryBuilder('donation')
      .innerJoin('donation.campaign', 'campaign')
      .where('campaign.country = :country', { country })
      .andWhere('donation.status = :status', { status: 'success' })
      .select('COUNT(DISTINCT donation.donorId)', 'count')
      .getRawOne();

    return {
      totalCampaigns,
      activeCampaigns,
      totalRaised: Number(totalRaised?.total || 0),
      totalDonors: Number(totalDonors?.count || 0),
    };
  }
}
