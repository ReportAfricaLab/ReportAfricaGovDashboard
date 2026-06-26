import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('notification_preferences')
export class NotificationPreferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  @Index()
  userId: string;

  @Column({ name: 'min_severity', default: 'low' })
  minSeverity: string; // low, medium, high, critical

  @Column({ type: 'jsonb', default: '[]' })
  categories: string[]; // empty = all categories

  @Column({ name: 'quiet_hours_start', default: 23 })
  quietHoursStart: number; // 23 = 11pm

  @Column({ name: 'quiet_hours_end', default: 6 })
  quietHoursEnd: number; // 6 = 6am

  @Column({ name: 'max_per_hour', default: 5 })
  maxPerHour: number;

  @Column({ name: 'last_sent_count', default: 0 })
  lastSentCount: number;

  @Column({ name: 'last_sent_hour', nullable: true })
  lastSentHour: string;
}
