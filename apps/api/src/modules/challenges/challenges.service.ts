import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In, Not, IsNull } from 'typeorm';
import { ChallengeEntity, ChallengeEntryEntity } from '../../database/entities/challenge.entity';
import { ReportEntity } from '../../database/entities/report.entity';
import { EnrollmentEntity } from '../../database/entities/enrollment.entity';
import { CourseEntity } from '../../database/entities/course.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { PaystackService } from '../donations/paystack.service';

const PLATFORM_CUT = 0.30;
const PAYOUT_SPLITS = [0.34, 0.24, 0.19, 0.13, 0.10]; // top 5
const MIN_DEADLINE_DAYS = 14;
const MIN_POT_USD = 200;

const COUNTRY_CURRENCY: Record<string, string> = {
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', UG: 'UGX', RW: 'RWF',
  TZ: 'TZS', ET: 'ETB', SN: 'XOF', CM: 'XAF', EG: 'EGP', MA: 'MAD',
};

const CURRENCY_RATES: Record<string, number> = {
  NGN: 1500, GHS: 14, KES: 150, ZAR: 18, UGX: 3700, RWF: 1300,
  TZS: 2600, ETB: 57, XOF: 600, XAF: 600, EGP: 48, MAD: 10, USD: 1,
};

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(ChallengeEntity)
    private readonly challengeRepo: Repository<ChallengeEntity>,
    @InjectRepository(ChallengeEntryEntity)
    private readonly entryRepo: Repository<ChallengeEntryEntity>,
    @InjectRepository(ReportEntity)
    private readonly reportRepo: Repository<ReportEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepo: Repository<EnrollmentEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly paystackService: PaystackService,
  ) {}

  async create(userId: string, country: string, dto: {
    businessId: string;
    title: string;
    description: string;
    productName: string;
    productImageUrl?: string;
    potAmount: number;
    deadline: string;
    email: string;
  }) {
    const deadlineDate = new Date(dto.deadline);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + MIN_DEADLINE_DAYS);
    if (deadlineDate < minDate) throw new BadRequestException(`Deadline must be at least ${MIN_DEADLINE_DAYS} days from now`);

    const currency = COUNTRY_CURRENCY[country] || 'NGN';
    const rate = CURRENCY_RATES[currency] || 1;
    const minAmount = MIN_POT_USD * rate;
    if (dto.potAmount < minAmount) throw new BadRequestException(`Minimum pot amount is ${currency} ${minAmount.toLocaleString()} (≈$${MIN_POT_USD})`);

    const reference = this.paystackService.generateReference();

    const challenge = this.challengeRepo.create({
      businessId: dto.businessId,
      creatorId: userId,
      title: dto.title,
      description: dto.description,
      productName: dto.productName,
      productImageUrl: dto.productImageUrl,
      potAmount: dto.potAmount,
      currency,
      country,
      deadline: deadlineDate,
      status: 'pending_payment',
      paymentReference: reference,
    });
    await this.challengeRepo.save(challenge);

    const payment = await this.paystackService.initializePayment({
      email: dto.email,
      amount: dto.potAmount * 100,
      currency,
      reference,
      metadata: { type: 'challenge_pot', challengeId: challenge.id, userId },
    });

    return { challenge, paymentUrl: payment.data?.authorization_url, reference };
  }

  async handlePaymentWebhook(reference: string, metadata: any) {
    if (metadata?.type !== 'challenge_pot') return;
    await this.challengeRepo.update(
      { id: metadata.challengeId, status: 'pending_payment' },
      { status: 'active' },
    );
  }

  async getFeed(country: string, page = 1, limit = 20) {
    return this.challengeRepo.find({
      where: { country, status: 'active' },
      order: { deadline: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['creator'],
    });
  }

  async getById(id: string) {
    const challenge = await this.challengeRepo.findOne({ where: { id }, relations: ['creator'] });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async enter(userId: string, challengeId: string, reportId: string) {
    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.status !== 'active') throw new BadRequestException('Challenge is not active');
    if (new Date() > challenge.deadline) throw new BadRequestException('Challenge deadline passed');

    // Check eligibility: courses 1, 2, 3 completed
    await this.checkEligibility(userId);

    // Check report belongs to user and has video
    const report = await this.reportRepo.findOne({ where: { id: reportId, authorId: userId } });
    if (!report) throw new BadRequestException('Report not found or not yours');
    const hasVideo = report.media?.some((m: any) => m.type?.startsWith('video'));
    if (!hasVideo) throw new BadRequestException('Report must have a video');

    // Check not already entered
    const existing = await this.entryRepo.findOne({ where: { challengeId, reporterId: userId } });
    if (existing) throw new BadRequestException('Already entered this challenge');

    const entry = this.entryRepo.create({ challengeId, reporterId: userId, reportId });
    await this.entryRepo.save(entry);
    await this.challengeRepo.increment({ id: challengeId }, 'entryCount', 1);

    return entry;
  }

  async getLeaderboard(challengeId: string) {
    // Sync view counts from reports table
    const entries = await this.entryRepo.find({
      where: { challengeId },
      relations: ['reporter'],
    });

    for (const entry of entries) {
      const report = await this.reportRepo.findOne({ where: { id: entry.reportId }, select: ['id', 'viewCount'] });
      if (report && report.viewCount !== entry.viewCount) {
        entry.viewCount = report.viewCount || 0;
        await this.entryRepo.save(entry);
      }
    }

    return entries.sort((a, b) => b.viewCount - a.viewCount).slice(0, 20);
  }

  async incrementViews(reportId: string) {
    await this.entryRepo.increment({ reportId }, 'viewCount', 1);
  }

  async closeExpired() {
    const expired = await this.challengeRepo.find({
      where: { status: 'active', deadline: LessThanOrEqual(new Date()) },
    });

    for (const challenge of expired) {
      await this.closeAndPayout(challenge);
    }
    return { closed: expired.length };
  }

  async closeAndPayout(challenge: ChallengeEntity) {
    const entries = await this.entryRepo.find({
      where: { challengeId: challenge.id },
      order: { viewCount: 'DESC' },
      take: 5,
    });

    const pool = Number(challenge.potAmount) * (1 - PLATFORM_CUT);

    for (let i = 0; i < entries.length && i < PAYOUT_SPLITS.length; i++) {
      const payout = Math.round(pool * PAYOUT_SPLITS[i]);
      entries[i].rank = i + 1;
      entries[i].payoutAmount = payout;
      entries[i].paidOut = true;
      await this.entryRepo.save(entries[i]);

      // Credit reporter tip balance
      await this.userRepo.increment({ id: entries[i].reporterId }, 'tipBalance', payout);
    }

    await this.challengeRepo.update(challenge.id, { status: 'paid_out' });
  }

  async getMyEntries(userId: string) {
    return this.entryRepo.find({
      where: { reporterId: userId },
      order: { createdAt: 'DESC' },
      relations: ['challenge'],
    });
  }

  private async checkEligibility(userId: string) {
    const requiredCourses = await this.courseRepo.find({
      where: { sortOrder: In([1, 2, 3]) },
      select: ['id'],
    });
    const courseIds = requiredCourses.map(c => c.id);

    const completed = await this.enrollmentRepo.count({
      where: { userId, courseId: In(courseIds), completedAt: Not(IsNull()) },
    });

    if (completed < 3) {
      throw new ForbiddenException('You must complete Academy courses 1, 2, and 3 to participate in challenges');
    }
  }
}

