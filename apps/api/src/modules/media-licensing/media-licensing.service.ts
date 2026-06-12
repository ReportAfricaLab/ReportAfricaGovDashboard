import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaLicenseEntity, ReportEntity, UserEntity } from '../../database/entities';
import { KoraPayService } from '../payments/korapay.service';
import { EarningsService } from '../earnings/earnings.service';

@Injectable()
export class MediaLicensingService {
  constructor(
    @InjectRepository(MediaLicenseEntity)
    private readonly licenseRepo: Repository<MediaLicenseEntity>,
    @InjectRepository(ReportEntity)
    private readonly reportRepo: Repository<ReportEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly koraPayService: KoraPayService,
    private readonly earningsService: EarningsService,
  ) {}

  async requestLicense(requesterId: string, dto: {
    reportId: string;
    organizationName: string;
    organizationType: string;
    purpose: string;
    offeredAmount?: number;
    currency?: string;
    licenseType?: string;
  }) {
    const report = await this.reportRepo.findOne({ where: { id: dto.reportId } });
    if (!report) throw new NotFoundException('Report not found');
    if (!report.authorId) throw new BadRequestException('Cannot license anonymous reports');

    const license = this.licenseRepo.create({
      ...dto,
      requesterId,
      reporterId: report.authorId,
      status: 'pending',
      licenseType: dto.licenseType || 'one_time',
    });
    return this.licenseRepo.save(license);
  }

  async getMyRequests(requesterId: string, page = 1, limit = 20) {
    return this.licenseRepo.find({
      where: { requesterId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['report'],
    });
  }

  async getIncomingRequests(reporterId: string, page = 1, limit = 20) {
    return this.licenseRepo.find({
      where: { reporterId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['report', 'requester'],
    });
  }

  async respondToRequest(licenseId: string, reporterId: string, action: 'approved' | 'rejected') {
    const license = await this.licenseRepo.findOne({ where: { id: licenseId } });
    if (!license) throw new NotFoundException('License request not found');
    if (license.reporterId !== reporterId) throw new ForbiddenException('Not your report');

    license.status = action;
    if (action === 'approved') {
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 6);
      license.validUntil = validUntil;
    }
    return this.licenseRepo.save(license);
  }

  async initiatePayment(licenseId: string, payerEmail: string, payerName: string) {
    const license = await this.licenseRepo.findOne({ where: { id: licenseId }, relations: ['report'] });
    if (!license) throw new NotFoundException('License not found');
    if (license.status !== 'approved') throw new BadRequestException('License must be approved before payment');
    if (!license.offeredAmount) throw new BadRequestException('No amount set for this license');

    const reporter = await this.userRepo.findOne({ where: { id: license.reporterId } });
    if (!reporter?.bankAccountNumber || !reporter?.bankCode) {
      throw new BadRequestException('Reporter has not set up bank details');
    }

    const reference = this.koraPayService.generateReference();

    const result = await this.koraPayService.initializeSplitPayment({
      amount: license.offeredAmount,
      currency: license.currency || 'NGN',
      customerEmail: payerEmail,
      customerName: payerName,
      reference,
      reporterBankAccount: {
        bankCode: reporter.bankCode,
        accountNumber: reporter.bankAccountNumber,
        accountName: reporter.bankAccountName,
      },
      platformSplitPercent: 50,
      metadata: { licenseId, reporterId: license.reporterId, reportId: license.reportId },
    });

    return { paymentUrl: result.data?.checkout_url, reference };
  }

  async handlePaymentWebhook(reference: string, event: string) {
    if (event !== 'charge.success') return;

    const verification = await this.koraPayService.verifyTransaction(reference);
    if (!verification.status || verification.data?.status !== 'success') return;

    const metadata = verification.data?.metadata;
    if (!metadata?.licenseId) return;

    const license = await this.licenseRepo.findOne({ where: { id: metadata.licenseId } });
    if (!license) return;

    // Record reporter earnings (50% of total)
    const reporterAmount = license.offeredAmount * 0.5;
    await this.earningsService.recordEarning({
      reporterId: license.reporterId,
      amount: reporterAmount,
      currency: license.currency || 'NGN',
      source: 'media_license',
      sourceId: license.id,
      description: `License payment from ${license.organizationName}`,
      paymentReference: reference,
      payerName: license.organizationName,
    });
  }
}
