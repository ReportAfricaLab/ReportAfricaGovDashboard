import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity, ReportEntity, CampaignEntity, MediaLicenseEntity, EarningsEntity, BusinessEntity, LivestreamEntity, ElectionReportEntity, TipEntity } from '../../database/entities';
import { ChallengeEntity } from '../../database/entities/challenge.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from '../../common/guards/admin.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChallengesModule } from '../challenges/challenges.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ReportEntity, CampaignEntity, MediaLicenseEntity, EarningsEntity, BusinessEntity, LivestreamEntity, ElectionReportEntity, TipEntity, ChallengeEntity]),
    NotificationsModule,
    ChallengesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
