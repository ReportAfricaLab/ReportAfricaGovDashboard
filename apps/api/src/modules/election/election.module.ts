import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectionReportEntity, LivestreamEntity } from '../../database/entities';
import { ElectionService } from './election.service';
import { ElectionController } from './election.controller';
import { LivestreamService } from '../livestream/livestream.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([ElectionReportEntity, LivestreamEntity]),
    ConfigModule,
  ],
  controllers: [ElectionController],
  providers: [ElectionService, LivestreamService],
})
export class ElectionModule {}
