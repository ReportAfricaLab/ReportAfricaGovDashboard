import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../common/guards/admin.guard';
import { IsString, IsNumber, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { CoursesService } from './courses.service';

class CreateCourseDto {
  @IsString() title: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() icon?: string;
  @IsNumber() usdPrice: number;
  @IsString() @IsOptional() thumbnailUrl?: string;
  @IsBoolean() @IsOptional() isPublished?: boolean;
  @IsInt() @IsOptional() sortOrder?: number;
}

class CreateLessonDto {
  @IsString() title: string;
  @IsString() @IsOptional() videoUrl?: string;
  @IsString() @IsOptional() duration?: string;
  @IsInt() @IsOptional() sortOrder?: number;
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  // === PUBLIC ===
  @Get()
  getPublished() {
    return this.service.getPublishedCourses();
  }

  @Get('my-enrollments')
  @UseGuards(AuthGuard('jwt'))
  getMyEnrollments(@Request() req: any) {
    return this.service.getMyEnrollments(req.user.id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getCourseById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':courseId/enroll')
  enroll(@Request() req: any, @Param('courseId') courseId: string) {
    return this.service.enroll(req.user.id, courseId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':courseId/lessons/:lessonId/complete')
  completeLesson(@Request() req: any, @Param('courseId') courseId: string, @Param('lessonId') lessonId: string) {
    return this.service.completeLesson(req.user.id, courseId, lessonId);
  }

  @Get('certificates/verify/:certificateId')
  verifyCertificate(@Param('certificateId') certificateId: string) {
    return this.service.verifyCertificate(certificateId);
  }
}

@Controller('admin/courses')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminCoursesController {
  constructor(private readonly service: CoursesService) {}

  @Get()
  getAll() {
    return this.service.getAllCourses();
  }

  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.service.createCourse(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateCourse(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.deleteCourse(id);
  }

  @Post(':id/lessons')
  addLesson(@Param('id') id: string, @Body() dto: CreateLessonDto) {
    return this.service.addLesson(id, dto);
  }

  @Patch('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) {
    return this.service.deleteLesson(id);
  }
}
