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

@Entity('challenges')
export class ChallengeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  @Index()
  businessId: string;

  @Column({ name: 'creator_id' })
  @Index()
  creatorId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'product_image_url', nullable: true })
  productImageUrl: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'pot_amount' })
  potAmount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ length: 2 })
  @Index()
  country: string;

  @Column({ name: 'deadline' })
  deadline: Date;

  @Column({ default: 'pending_payment' })
  @Index()
  status: string; // pending_payment, active, ended, paid_out

  @Column({ name: 'payment_reference', nullable: true })
  paymentReference: string;

  @Column({ name: 'entry_count', default: 0 })
  entryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('challenge_entries')
export class ChallengeEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'challenge_id' })
  @Index()
  challengeId: string;

  @ManyToOne(() => ChallengeEntity)
  @JoinColumn({ name: 'challenge_id' })
  challenge: ChallengeEntity;

  @Column({ name: 'reporter_id' })
  @Index()
  reporterId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reporter_id' })
  reporter: UserEntity;

  @Column({ name: 'report_id' })
  reportId: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ nullable: true })
  rank: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'payout_amount', default: 0 })
  payoutAmount: number;

  @Column({ name: 'paid_out', default: false })
  paidOut: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
