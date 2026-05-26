import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RekognitionResult {
  isApproved: boolean;
  labels: { name: string; confidence: number }[];
  moderationLabels: { name: string; confidence: number; parentName?: string }[];
  flags: string[];
}

@Injectable()
export class RekognitionService {
  private readonly logger = new Logger(RekognitionService.name);
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get('AWS_REGION', 'af-south-1');
    this.accessKeyId = this.config.get('AWS_ACCESS_KEY_ID', '');
    this.secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY', '');
    this.bucket = this.config.get('AWS_S3_BUCKET', 'reportafrica-media');
  }

  async moderateImage(s3Key: string): Promise<RekognitionResult> {
    if (!this.accessKeyId || this.accessKeyId === 'your_access_key') {
      return this.mockModeration();
    }

    try {
      const response = await fetch(`https://rekognition.${this.region}.amazonaws.com`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'RekognitionService.DetectModerationLabels',
        },
        body: JSON.stringify({
          Image: { S3Object: { Bucket: this.bucket, Name: s3Key } },
          MinConfidence: 60,
        }),
      });

      const data = await response.json();
      const moderationLabels = (data.ModerationLabels || []).map((l: any) => ({
        name: l.Name,
        confidence: l.Confidence,
        parentName: l.ParentName,
      }));

      const flags = this.extractFlags(moderationLabels);

      return {
        isApproved: flags.length === 0,
        labels: [],
        moderationLabels,
        flags,
      };
    } catch (error) {
      this.logger.error('Rekognition moderation failed', error);
      return this.mockModeration();
    }
  }

  async detectLabels(s3Key: string): Promise<{ name: string; confidence: number }[]> {
    if (!this.accessKeyId || this.accessKeyId === 'your_access_key') {
      return [{ name: 'Scene', confidence: 99 }];
    }

    try {
      const response = await fetch(`https://rekognition.${this.region}.amazonaws.com`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'RekognitionService.DetectLabels',
        },
        body: JSON.stringify({
          Image: { S3Object: { Bucket: this.bucket, Name: s3Key } },
          MaxLabels: 10,
          MinConfidence: 70,
        }),
      });

      const data = await response.json();
      return (data.Labels || []).map((l: any) => ({ name: l.Name, confidence: l.Confidence }));
    } catch (error) {
      this.logger.error('Rekognition label detection failed', error);
      return [];
    }
  }

  async detectFaces(s3Key: string): Promise<{ count: number; hasFaces: boolean }> {
    if (!this.accessKeyId || this.accessKeyId === 'your_access_key') {
      return { count: 0, hasFaces: false };
    }

    try {
      const response = await fetch(`https://rekognition.${this.region}.amazonaws.com`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'RekognitionService.DetectFaces',
        },
        body: JSON.stringify({
          Image: { S3Object: { Bucket: this.bucket, Name: s3Key } },
          Attributes: ['DEFAULT'],
        }),
      });

      const data = await response.json();
      const count = (data.FaceDetails || []).length;
      return { count, hasFaces: count > 0 };
    } catch (error) {
      this.logger.error('Rekognition face detection failed', error);
      return { count: 0, hasFaces: false };
    }
  }

  private extractFlags(moderationLabels: { name: string; confidence: number; parentName?: string }[]): string[] {
    const flags: string[] = [];
    for (const label of moderationLabels) {
      const name = label.name.toLowerCase();
      if (name.includes('nudity') || name.includes('explicit')) flags.push('nudity');
      if (name.includes('violence') || name.includes('gore')) flags.push('violence');
      if (name.includes('weapon') || name.includes('firearms')) flags.push('weapons');
      if (name.includes('hate') || name.includes('extremist')) flags.push('hate_symbols');
      if (name.includes('drugs') || name.includes('tobacco')) flags.push('drugs');
    }
    return [...new Set(flags)];
  }

  private mockModeration(): RekognitionResult {
    return { isApproved: true, labels: [], moderationLabels: [], flags: [] };
  }
}
