import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CourseEntity } from './course.entity';
import { ModuleEntity } from './module.entity';

@Entity('lessons')
export class LessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id' })
  @Index()
  courseId: string;

  @ManyToOne(() => CourseEntity, (course) => course.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @Column({ name: 'module_id', nullable: true })
  @Index()
  moduleId: string;

  @ManyToOne(() => ModuleEntity, (module) => module.lessons, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'module_id' })
  module: ModuleEntity;

  @Column()
  title: string;

  @Column({ default: 'video' })
  type: string; // video | text | pdf

  @Column({ name: 'video_url', default: '' })
  videoUrl: string;

  @Column({ type: 'text', nullable: true })
  content: string; // Rich text/markdown for type=text

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl: string; // S3 URL for type=pdf

  @Column({ default: '' })
  duration: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
