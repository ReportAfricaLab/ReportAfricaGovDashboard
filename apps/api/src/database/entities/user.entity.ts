import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ unique: true })
  @Index()
  username: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ length: 2 })
  @Index()
  country: string;

  @Column({ default: 'citizen' })
  role: string;

  @Column({ name: 'trust_level', default: 'new_reporter' })
  trustLevel: string;

  @Column({ name: 'trust_score', type: 'int', default: 0 })
  trustScore: number;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_anonymous_default', default: false })
  isAnonymousDefault: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'password_reset_token', nullable: true, select: false })
  passwordResetToken: string;

  @Column({ name: 'password_reset_expires', nullable: true, select: false })
  passwordResetExpires: Date;

  @Column({ name: 'fcm_token', nullable: true })
  fcmToken: string;

  @Column({ name: 'bank_code', nullable: true })
  bankCode: string;

  @Column({ name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ name: 'bank_account_number', nullable: true })
  bankAccountNumber: string;

  @Column({ name: 'bank_account_name', nullable: true })
  bankAccountName: string;

  @Column({ name: 'tip_balance', type: 'int', default: 0 })
  tipBalance: number;

  @Column({ name: 'tip_currency', length: 3, nullable: true })
  tipCurrency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
