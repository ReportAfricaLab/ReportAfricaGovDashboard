import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity, LessonEntity, EnrollmentEntity, UserEntity, ModuleEntity } from '../../database/entities';
import { CoursesController, AdminCoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseEntity, LessonEntity, EnrollmentEntity, UserEntity, ModuleEntity])],
  controllers: [CoursesController, AdminCoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
