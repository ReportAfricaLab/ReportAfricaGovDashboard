import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovController } from './gov.controller';
import { GovService } from './gov.service';
import { UserEntity, ReportEntity, ElectionReportEntity, CampaignEntity } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ReportEntity, ElectionReportEntity, CampaignEntity])],
  controllers: [GovController],
  providers: [GovService],
  exports: [GovService],
})
export class GovModule {}
