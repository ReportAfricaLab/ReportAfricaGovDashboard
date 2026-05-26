import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaLicenseEntity, ReportEntity } from '../../database/entities';
import { MediaLicensingService } from './media-licensing.service';
import { MediaLicensingController } from './media-licensing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MediaLicenseEntity, ReportEntity])],
  controllers: [MediaLicensingController],
  providers: [MediaLicensingService],
})
export class MediaLicensingModule {}
