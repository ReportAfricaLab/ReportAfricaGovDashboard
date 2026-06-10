import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LivestreamEntity } from '../../database/entities';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

@Injectable()
export class LivestreamService {
  private readonly logger = new Logger(LivestreamService.name);
  private readonly livekitHost: string;
  private readonly livekitApiKey: string;
  private readonly livekitApiSecret: string;
  private readonly roomService: RoomServiceClient | null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(LivestreamEntity)
    private readonly streamRepo: Repository<LivestreamEntity>,
  ) {
    this.livekitHost = this.config.get('LIVEKIT_HOST', 'wss://reportafrica-project-0ankto27.livekit.cloud');
    this.livekitApiKey = this.config.get('LIVEKIT_API_KEY', '');
    this.livekitApiSecret = this.config.get('LIVEKIT_API_SECRET', '');

    if (this.livekitApiKey && this.livekitApiSecret) {
      this.roomService = new RoomServiceClient(this.livekitHost, this.livekitApiKey, this.livekitApiSecret);
    } else {
      this.roomService = null;
    }
  }

  async createStream(userId: string, country: string, dto: { title: string; description?: string; category?: string; latitude?: number; longitude?: number; electionName?: string; electionState?: string; electionPollingUnit?: string }) {
    const roomName = `stream_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const isElection = !!dto.electionName;

    // Create LiveKit room
    if (this.roomService) {
      try {
        await this.roomService.createRoom({ name: roomName, emptyTimeout: 300, maxParticipants: 1000 });
      } catch (err) {
        this.logger.error('Failed to create LiveKit room', err);
      }
    }

    // Generate broadcaster token
    const broadcasterToken = await this.generateToken(roomName, userId, true);

    const stream = this.streamRepo.create({
      userId,
      country,
      title: dto.title,
      description: dto.description || '',
      category: isElection ? 'election' : (dto.category || 'general'),
      latitude: dto.latitude,
      longitude: dto.longitude,
      channelArn: roomName, // Store room name here
      streamKeyValue: broadcasterToken, // Store broadcaster token
      ingestEndpoint: this.livekitHost, // LiveKit WebSocket URL
      playbackUrl: roomName, // Viewers use room name to join
      status: 'ready',
      electionName: dto.electionName,
      electionState: dto.electionState,
      electionPollingUnit: dto.electionPollingUnit,
    });

    return this.streamRepo.save(stream);
  }

  async goLive(streamId: string, userId: string) {
    const stream = await this.streamRepo.findOne({ where: { id: streamId, userId } });
    if (!stream) throw new NotFoundException('Stream not found');

    stream.status = 'live';
    stream.startedAt = new Date();
    return this.streamRepo.save(stream);
  }

  async endStream(streamId: string, userId: string) {
    const stream = await this.streamRepo.findOne({ where: { id: streamId, userId } });
    if (!stream) throw new NotFoundException('Stream not found');

    stream.status = 'ended';
    stream.endedAt = new Date();

    // Delete LiveKit room
    if (this.roomService) {
      try { await this.roomService.deleteRoom(stream.channelArn); } catch {}
    }

    return this.streamRepo.save(stream);
  }

  // Generate viewer token for watching a stream
  async getViewerToken(streamId: string, viewerId: string, viewerName: string) {
    const stream = await this.streamRepo.findOne({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('Stream not found');

    const token = await this.generateToken(stream.channelArn, viewerId, false, viewerName);
    return { token, wsUrl: this.livekitHost, roomName: stream.channelArn };
  }

  async getLiveStreams(country: string, page = 1, limit = 20) {
    return this.streamRepo.find({
      where: { country, status: 'live' },
      order: { startedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
  }

  async getStreamById(id: string) {
    return this.streamRepo.findOne({ where: { id }, relations: ['user'] });
  }

  async getRecordings(country: string, page = 1, limit = 20) {
    return this.streamRepo.find({
      where: { country, status: 'ended' },
      order: { endedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
  }

  async getUserStreams(userId: string, page = 1, limit = 20) {
    return this.streamRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getElectionLiveStreams(country: string, electionName?: string) {
    const qb = this.streamRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'user')
      .where('s.country = :country', { country })
      .andWhere('s.category = :category', { category: 'election' })
      .andWhere('s.status = :status', { status: 'live' });

    if (electionName) qb.andWhere('s.electionName = :electionName', { electionName });

    return qb.orderBy('s.startedAt', 'DESC').getMany();
  }

  private async generateToken(roomName: string, identity: string, isPublisher: boolean, name?: string): Promise<string> {
    if (!this.livekitApiKey || !this.livekitApiSecret) {
      return 'mock_token_' + Date.now();
    }

    const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
      identity,
      name: name || identity,
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: isPublisher,
      canSubscribe: true,
      canPublishData: true,
    });

    return await token.toJwt();
  }
}
