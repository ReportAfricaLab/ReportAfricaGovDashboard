import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { CourseEntity } from './course.entity';

@Entity('enrollments')
@Unique(['userId', 'courseId'])
export class EnrollmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'course_id' })
  @Index()
  courseId: string;

  @ManyToOne(() => CourseEntity)
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @Column({ name: 'completed_lessons', type: 'jsonb', default: '[]' })
  completedLessons: string[];

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'certificate_id', nullable: true, unique: true })
  @Index()
  certificateId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
