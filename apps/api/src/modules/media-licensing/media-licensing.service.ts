import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaLicenseEntity, ReportEntity } from '../../database/entities';

@Injectable()
export class MediaLicensingService {
  constructor(
    @InjectRepository(MediaLicenseEntity)
    private readonly licenseRepo: Repository<MediaLicenseEntity>,
    @InjectRepository(ReportEntity)
    private readonly reportRepo: Repository<ReportEntity>,
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
}
