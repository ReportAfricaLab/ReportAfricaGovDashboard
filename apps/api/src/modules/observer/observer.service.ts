import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObserverEntity } from '../../database/entities/observer.entity';

const TIER_CONFIG: Record<string, { price: number; seats: number }> = {
  individual: { price: 500, seats: 1 },
  organization: { price: 2000, seats: 5 },
  enterprise: { price: 10000, seats: 20 },
};

@Injectable()
export class ObserverService {
  constructor(
    @InjectRepository(ObserverEntity)
    private readonly observerRepo: Repository<ObserverEntity>,
  ) {}

  async register(userId: string, dto: { orgName?: string; country: string; tier: string; accreditationUrl: string }) {
    const existing = await this.observerRepo.findOne({ where: { userId, country: dto.country } });
    if (existing) throw new BadRequestException('Already registered for this country');

    const tier = TIER_CONFIG[dto.tier] ? dto.tier : 'individual';
    const observer = this.observerRepo.create({
      userId,
      orgName: dto.orgName,
      country: dto.country,
      tier,
      accreditationUrl: dto.accreditationUrl,
      seats: TIER_CONFIG[tier].seats,
      status: 'observer_pending',
    });

    return this.observerRepo.save(observer);
  }

  async getMyProfile(userId: string) {
    const observers = await this.observerRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return observers;
  }

  async getMySubscription(userId: string, country: string) {
    const observer = await this.observerRepo.findOne({ where: { userId, country } });
    if (!observer) return null;

    // Check expiry
    if (observer.status === 'observer_active' && observer.expiresAt && new Date() > observer.expiresAt) {
      observer.status = 'observer_expired';
      await this.observerRepo.save(observer);
    }

    return observer;
  }

  async initPayment(userId: string, country: string, email: string) {
    const observer = await this.observerRepo.findOne({ where: { userId, country } });
    if (!observer) throw new BadRequestException('No registration found');
    if (observer.status !== 'observer_approved') throw new ForbiddenException('Not yet approved');

    const amount = TIER_CONFIG[observer.tier]?.price || 500;
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const reference = `obs_${observer.id}_${Date.now()}`;

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${paystackSecretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: amount * 100, // kobo/cents
        currency: 'USD',
        reference,
        metadata: { observerId: observer.id, tier: observer.tier, country },
      }),
    });

    const data = await res.json();
    if (!data.status) throw new BadRequestException('Payment initialization failed');

    observer.paystackReference = reference;
    await this.observerRepo.save(observer);

    return { authorizationUrl: data.data.authorization_url, reference };
  }

  async verifyPayment(reference: string) {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackSecretKey}` },
    });
    const data = await res.json();

    if (data.data?.status !== 'success') throw new BadRequestException('Payment not confirmed');

    const observer = await this.observerRepo.findOne({ where: { paystackReference: reference } });
    if (!observer) throw new BadRequestException('Observer not found');

    observer.status = 'observer_active';
    observer.paidAt = new Date();
    observer.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    await this.observerRepo.save(observer);

    return observer;
  }

  async inviteSeat(ownerId: string, country: string, inviteeUserId: string) {
    const owner = await this.observerRepo.findOne({ where: { userId: ownerId, country, status: 'observer_active' } });
    if (!owner) throw new ForbiddenException('No active subscription');

    const usedSeats = await this.observerRepo.count({ where: { invitedBy: ownerId, country } });
    if (usedSeats + 1 >= owner.seats) throw new BadRequestException('All seats used');

    const seat = this.observerRepo.create({
      userId: inviteeUserId,
      country,
      tier: owner.tier,
      orgName: owner.orgName,
      status: 'observer_active',
      paidAt: owner.paidAt,
      expiresAt: owner.expiresAt,
      invitedBy: ownerId,
      seats: 0,
    });

    return this.observerRepo.save(seat);
  }

  async getSeats(ownerId: string, country: string) {
    return this.observerRepo.find({ where: { invitedBy: ownerId, country } });
  }

  // Admin methods
  async getPending() {
    return this.observerRepo.find({ where: { status: 'observer_pending' }, relations: ['user'], order: { createdAt: 'DESC' } });
  }

  async approve(observerId: string) {
    const observer = await this.observerRepo.findOne({ where: { id: observerId } });
    if (!observer) throw new BadRequestException('Not found');
    observer.status = 'observer_approved';
    return this.observerRepo.save(observer);
  }

  async reject(observerId: string) {
    const observer = await this.observerRepo.findOne({ where: { id: observerId } });
    if (!observer) throw new BadRequestException('Not found');
    observer.status = 'observer_rejected';
    return this.observerRepo.save(observer);
  }

  async activate(observerId: string) {
    const observer = await this.observerRepo.findOne({ where: { id: observerId } });
    if (!observer) throw new BadRequestException('Not found');
    observer.status = 'observer_active';
    observer.paidAt = new Date();
    observer.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    return this.observerRepo.save(observer);
  }

  async getAllActive() {
    return this.observerRepo.find({ where: { status: 'observer_active' }, relations: ['user'], order: { createdAt: 'DESC' } });
  }
}
