import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LivestreamEntity } from '../../database/entities';
import { AccessToken, RoomServiceClient, EgressClient } from 'livekit-server-sdk';

@Injectable()
export class LivestreamService {
  private readonly logger = new Logger(LivestreamService.name);
  private readonly livekitHost: string;
  private readonly livekitApiKey: string;
  private readonly livekitApiSecret: string;
  private readonly roomService: RoomServiceClient | null;
  private readonly egressClient: EgressClient | null;
  private readonly s3Bucket: string;
  private readonly s3Region: string;
  private readonly s3AccessKey: string;
  private readonly s3SecretKey: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(LivestreamEntity)
    private readonly streamRepo: Repository<LivestreamEntity>,
  ) {
    this.livekitHost = this.config.get('LIVEKIT_HOST', 'wss://reportafrica-project-0ankto27.livekit.cloud');
    this.livekitApiKey = this.config.get('LIVEKIT_API_KEY', '');
    this.livekitApiSecret = this.config.get('LIVEKIT_API_SECRET', '');
    this.s3Bucket = this.config.get('AWS_S3_BUCKET', 'reportafrica-media-prod');
    this.s3Region = this.config.get('AWS_REGION', 'eu-west-1');
    this.s3AccessKey = this.config.get('AWS_ACCESS_KEY_ID', '');
    this.s3SecretKey = this.config.get('AWS_SECRET_ACCESS_KEY', '');

    if (this.livekitApiKey && this.livekitApiSecret) {
      this.roomService = new RoomServiceClient(this.livekitHost, this.livekitApiKey, this.livekitApiSecret);
      this.egressClient = new EgressClient(this.livekitHost, this.livekitApiKey, this.livekitApiSecret);
    } else {
      this.roomService = null;
      this.egressClient = null;
    }
  }

  async createStream(userId: string, country: string, dto: { title: string; description?: string; category?: string; latitude?: number; longitude?: number; thumbnailUrl?: string; electionName?: string; electionState?: string; electionPollingUnit?: string }) {
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
      channelArn: roomName,
      streamKeyValue: broadcasterToken,
      ingestEndpoint: this.livekitHost,
      playbackUrl: roomName,
      thumbnailUrl: dto.thumbnailUrl || undefined,
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

    // Start recording (Egress) to S3
    if (this.egressClient && this.s3AccessKey) {
      try {
        const recordingKey = `recordings/${stream.id}/${Date.now()}.mp4`;
        const output = {
          file: {
            filepath: recordingKey,
            output: {
              case: 's3' as const,
              value: { accessKey: this.s3AccessKey, secret: this.s3SecretKey, bucket: this.s3Bucket, region: this.s3Region },
            },
          },
        };
        const egress = await this.egressClient.startRoomCompositeEgress(stream.channelArn, output as any);
        stream.recordingUrl = egress.egressId;
        this.logger.log(`Recording started for stream ${streamId}: ${egress.egressId}`);
      } catch (err) {
        this.logger.error('Failed to start recording', err);
      }
    }

    return this.streamRepo.save(stream);
  }

  async endStream(streamId: string, userId: string) {
    const stream = await this.streamRepo.findOne({ where: { id: streamId, userId } });
    if (!stream) throw new NotFoundException('Stream not found');

    stream.status = 'ended';
    stream.endedAt = new Date();

    // Stop recording and get the file URL
    if (this.egressClient && stream.recordingUrl && !stream.recordingUrl.startsWith('http')) {
      try {
        await this.egressClient.stopEgress(stream.recordingUrl); // recordingUrl holds egressId
        // Build the S3 URL for the recording
        const recordingKey = `recordings/${stream.id}`;
        stream.recordingUrl = `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${recordingKey}`;
        // Thumbnail = first frame (same path with .jpg)
        stream.thumbnailUrl = `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${recordingKey}/thumbnail.jpg`;
        this.logger.log(`Recording stopped for stream ${streamId}`);
      } catch (err) {
        this.logger.error('Failed to stop recording', err);
        stream.recordingUrl = '' as any;
      }
    }

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
