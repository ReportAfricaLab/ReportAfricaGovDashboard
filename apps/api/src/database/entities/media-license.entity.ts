import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ReportEntity } from './report.entity';

@Entity('media_licenses')
export class MediaLicenseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id' })
  @Index()
  reportId: string;

  @ManyToOne(() => ReportEntity)
  @JoinColumn({ name: 'report_id' })
  report: ReportEntity;

  @Column({ name: 'requester_id' })
  @Index()
  requesterId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'requester_id' })
  requester: UserEntity;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @Column({ name: 'organization_name' })
  organizationName: string;

  @Column({ name: 'organization_type' })
  organizationType: string; // tv_station, newspaper, blog, news_agency

  @Column({ type: 'text' })
  purpose: string;

  @Column({ default: 'pending' })
  @Index()
  status: string; // pending, approved, rejected, expired

  @Column({ name: 'offered_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  offeredAmount: number;

  @Column({ length: 3, nullable: true })
  currency: string;

  @Column({ name: 'license_type', default: 'one_time' })
  licenseType: string; // one_time, exclusive, non_exclusive

  @Column({ name: 'valid_until', nullable: true })
  validUntil: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
