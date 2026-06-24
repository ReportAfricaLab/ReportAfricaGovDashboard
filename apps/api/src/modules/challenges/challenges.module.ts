import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { ChallengeEntity, ChallengeEntryEntity } from '../../database/entities/challenge.entity';
import { ReportEntity } from '../../database/entities/report.entity';
import { EnrollmentEntity } from '../../database/entities/enrollment.entity';
import { CourseEntity } from '../../database/entities/course.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { PaystackService } from '../donations/paystack.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChallengeEntity,
      ChallengeEntryEntity,
      ReportEntity,
      EnrollmentEntity,
      CourseEntity,
      UserEntity,
    ]),
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService, PaystackService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
