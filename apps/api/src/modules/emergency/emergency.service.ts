import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportEntity } from '../../database/entities';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { LivestreamService } from '../livestream/livestream.service';

interface SOSPayload {
  latitude: number;
  longitude: number;
  type: string;
  description?: string;
  broadcast?: boolean; // auto-start livestream
}

@Injectable()
export class EmergencyService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportRepo: Repository<ReportEntity>,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeGateway,
    private readonly livestreamService: LivestreamService,
  ) {}

  async triggerSOS(userId: string, country: string, payload: SOSPayload) {
    // 1. Create emergency report automatically
    const report = this.reportRepo.create({
      title: `🚨 SOS: ${this.getTypeLabel(payload.type)}`,
      description: payload.description || `Emergency ${payload.type} reported. Location shared automatically.`,
      category: 'emergency',
      severity: 'critical',
      latitude: payload.latitude,
      longitude: payload.longitude,
      country,
      authorId: userId,
      isLive: true,
      verificationLevel: 'unverified',
      media: [],
    });
    const saved = await this.reportRepo.save(report);

    // 2. Send push notifications to nearby users (5km radius)
    await this.notifications.sendNearbyAlert(payload.latitude, payload.longitude, 5, {
      title: '🚨 Emergency Alert Nearby',
      body: `${this.getTypeLabel(payload.type)} reported ${this.getDistanceText()} from you`,
      data: { reportId: saved.id, type: 'emergency' },
    });

    // 3. Broadcast via Socket.IO
    this.realtime.emitEmergencyAlert(country, {
      id: saved.id,
      type: payload.type,
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp: new Date().toISOString(),
    });

    // 4. Auto-start emergency broadcast if requested
    let stream: any = null;
    if (payload.broadcast) {
      try {
        stream = await this.livestreamService.createStream(userId, country, {
          title: `🚨 EMERGENCY: ${this.getTypeLabel(payload.type)}`,
          description: payload.description || 'Emergency broadcast',
          category: 'emergency',
          latitude: payload.latitude,
          longitude: payload.longitude,
        });
        await this.livestreamService.goLive(stream.id, userId);
      } catch {}
    }

    return { report: saved, alertsSent: true, stream };
  }

  async getActiveEmergencies(country: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.reportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.author', 'author')
      .where('report.country = :country', { country })
      .andWhere('report.category = :category', { category: 'emergency' })
      .andWhere('report.severity = :severity', { severity: 'critical' })
      .andWhere('report."created_at" > :oneHourAgo', { oneHourAgo })
      .orderBy('report."created_at"', 'DESC')
      .take(20)
      .getMany();
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      fire: 'Fire Outbreak',
      violence: 'Violence/Attack',
      accident: 'Accident',
      flood: 'Flooding',
      security_threat: 'Security Threat',
      building_collapse: 'Building Collapse',
      medical: 'Medical Emergency',
    };
    return labels[type] || 'Emergency';
  }

  private getDistanceText(): string {
    return 'nearby'; // In production, calculate actual distance
  }
}
