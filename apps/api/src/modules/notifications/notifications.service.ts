import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, NotificationEntity } from '../../database/entities';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly projectId: string;
  private readonly clientEmail: string;
  private readonly privateKey: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {
    this.projectId = this.config.get('FIREBASE_PROJECT_ID', '');
    this.clientEmail = this.config.get('FIREBASE_CLIENT_EMAIL', '');
    this.privateKey = (this.config.get('FIREBASE_PRIVATE_KEY', '') || '').replace(/\\n/g, '\n');
  }

  async sendToUser(userId: string, payload: NotificationPayload) {
    await this.notificationRepo.save(this.notificationRepo.create({
      userId,
      title: payload.title,
      body: payload.body,
      type: payload.data?.type || 'general',
      data: payload.data || {},
    }));

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.fcmToken) return;
    return this.sendToToken(user.fcmToken, payload);
  }

  async sendToCountry(country: string, payload: NotificationPayload) {
    const users = await this.userRepo.find({ where: { country }, select: ['fcmToken'] });
    const tokens = users.map((u) => u.fcmToken).filter(Boolean);
    if (tokens.length === 0) return;
    for (const token of tokens) {
      await this.sendToToken(token, payload);
    }
  }

  async sendNearbyAlert(latitude: number, longitude: number, radiusKm: number, payload: NotificationPayload) {
    const radiusDegrees = radiusKm / 111;
    const users = await this.userRepo
      .createQueryBuilder('user')
      .where('user.latitude BETWEEN :minLat AND :maxLat', { minLat: latitude - radiusDegrees, maxLat: latitude + radiusDegrees })
      .andWhere('user.longitude BETWEEN :minLng AND :maxLng', { minLng: longitude - radiusDegrees, maxLng: longitude + radiusDegrees })
      .andWhere('user.fcmToken IS NOT NULL')
      .getMany();

    for (const user of users) {
      await this.sendToToken(user.fcmToken, payload);
    }
  }

  // === HISTORY ===
  async getHistory(userId: string, page = 1, limit = 30) {
    const [data, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const unreadCount = await this.notificationRepo.count({ where: { userId, isRead: false } });
    return { data, unreadCount, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.notificationRepo.update({ id: notificationId, userId }, { isRead: true });
    return { read: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
    return { read: true };
  }

  // === Firebase V1 API ===
  private async sendToToken(token: string, payload: NotificationPayload) {
    if (!this.projectId || !this.clientEmail || !this.privateKey) return;

    try {
      const accessToken = await this.getAccessToken();
      await fetch(`https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: payload.title, body: payload.body },
            data: payload.data || {},
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
          },
        }),
      });
    } catch (error) {
      this.logger.error('FCM V1 send failed', error);
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) return this.accessToken;

    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: this.clientEmail,
      sub: this.clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    })).toString('base64url');

    const crypto = require('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${payload}`);
    const signature = sign.sign(this.privateKey, 'base64url');

    const jwt = `${header}.${payload}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken!;
  }
}
