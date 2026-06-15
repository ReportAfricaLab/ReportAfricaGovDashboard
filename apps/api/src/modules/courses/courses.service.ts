import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity, LessonEntity, EnrollmentEntity } from '../../database/entities';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonRepo: Repository<LessonEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepo: Repository<EnrollmentEntity>,
  ) {}

  // === PUBLIC ===

  async getPublishedCourses() {
    return this.courseRepo.find({
      where: { isPublished: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      relations: ['lessons'],
    });
  }

  async getCourseById(id: string) {
    const course = await this.courseRepo.findOne({ where: { id }, relations: ['lessons'] });
    if (!course) throw new NotFoundException('Course not found');
    if (course.lessons) course.lessons.sort((a, b) => a.sortOrder - b.sortOrder);
    return course;
  }

  // === ADMIN ===

  async getAllCourses() {
    return this.courseRepo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' }, relations: ['lessons'] });
  }

  async createCourse(dto: { title: string; description?: string; icon?: string; usdPrice: number; thumbnailUrl?: string; isPublished?: boolean; sortOrder?: number }) {
    const course = this.courseRepo.create(dto);
    return this.courseRepo.save(course);
  }

  async updateCourse(id: string, dto: Partial<{ title: string; description: string; icon: string; usdPrice: number; thumbnailUrl: string; isPublished: boolean; sortOrder: number }>) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    Object.assign(course, dto);
    return this.courseRepo.save(course);
  }

  async deleteCourse(id: string) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    await this.courseRepo.remove(course);
    return { deleted: true };
  }

  // === LESSONS ===

  async addLesson(courseId: string, dto: { title: string; videoUrl?: string; duration?: string; sortOrder?: number }) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const lesson = this.lessonRepo.create({ ...dto, courseId });
    return this.lessonRepo.save(lesson);
  }

  async updateLesson(id: string, dto: Partial<{ title: string; videoUrl: string; duration: string; sortOrder: number }>) {
    const lesson = await this.lessonRepo.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    Object.assign(lesson, dto);
    return this.lessonRepo.save(lesson);
  }

  async deleteLesson(id: string) {
    const lesson = await this.lessonRepo.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonRepo.remove(lesson);
    return { deleted: true };
  }

  // === ENROLLMENTS & CERTIFICATES ===

  private generateCertId(): string {
    return 'RA-CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  async enroll(userId: string, courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const existing = await this.enrollmentRepo.findOne({ where: { userId, courseId } });
    if (existing) return existing;
    const enrollment = this.enrollmentRepo.create({ userId, courseId, completedLessons: [] });
    return this.enrollmentRepo.save(enrollment);
  }

  async completeLesson(userId: string, courseId: string, lessonId: string) {
    let enrollment = await this.enrollmentRepo.findOne({ where: { userId, courseId } });
    if (!enrollment) {
      enrollment = this.enrollmentRepo.create({ userId, courseId, completedLessons: [] });
    }
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons = [...enrollment.completedLessons, lessonId];
    }
    // Check if all lessons done
    const course = await this.courseRepo.findOne({ where: { id: courseId }, relations: ['lessons'] });
    if (course && course.lessons.length > 0 && enrollment.completedLessons.length >= course.lessons.length) {
      if (!enrollment.completedAt) {
        enrollment.completedAt = new Date();
        enrollment.certificateId = this.generateCertId();
        // Check master certificate
        await this.checkMasterCertificate(userId);
      }
    }
    return this.enrollmentRepo.save(enrollment);
  }

  private async checkMasterCertificate(userId: string) {
    const allCourses = await this.courseRepo.find({ where: { isPublished: true } });
    const enrollments = await this.enrollmentRepo.find({ where: { userId } });
    const completedCourseIds = enrollments.filter(e => e.completedAt && e.courseId !== 'master').map(e => e.courseId);
    if (allCourses.length > 0 && allCourses.every(c => completedCourseIds.includes(c.id))) {
      const existing = await this.enrollmentRepo.findOne({ where: { userId, courseId: 'master' } });
      if (!existing) {
        const master = this.enrollmentRepo.create({
          userId, courseId: 'master', completedLessons: [],
          completedAt: new Date(),
          certificateId: 'RA-MASTER-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        });
        await this.enrollmentRepo.save(master);
      }
    }
  }

  async getMyEnrollments(userId: string) {
    return this.enrollmentRepo.find({ where: { userId }, relations: ['course'], order: { createdAt: 'DESC' } });
  }

  async verifyCertificate(certificateId: string) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { certificateId }, relations: ['user', 'course'] });
    if (!enrollment) return { valid: false };
    return {
      valid: true,
      userName: enrollment.user?.displayName || enrollment.user?.username || 'Student',
      courseTitle: enrollment.courseId === 'master' ? 'Certified Citizen Journalist — Complete Program' : enrollment.course?.title,
      completedAt: enrollment.completedAt,
      certificateId: enrollment.certificateId,
    };
  }
}
