import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BusinessEntity } from './business.entity';

@Entity('business_responses')
export class BusinessResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  @Index()
  businessId: string;

  @ManyToOne(() => BusinessEntity)
  @JoinColumn({ name: 'business_id' })
  business: BusinessEntity;

  @Column({ name: 'report_id' })
  @Index()
  reportId: string;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
