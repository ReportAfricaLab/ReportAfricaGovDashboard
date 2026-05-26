import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity, UserEntity } from '../../database/entities';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReportEntity, UserEntity])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
