import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectionReportEntity } from '../../database/entities';
import { ElectionService } from './election.service';
import { ElectionController } from './election.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ElectionReportEntity])],
  controllers: [ElectionController],
  providers: [ElectionService],
})
export class ElectionModule {}
