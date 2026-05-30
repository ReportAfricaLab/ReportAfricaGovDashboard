import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsOptional } from 'class-validator';
import { FaceBlurService } from './face-blur.service';

class BlurFacesDto {
  @IsString() s3Key: string;
}

@Controller('face-blur')
export class FaceBlurController {
  constructor(private readonly faceBlurService: FaceBlurService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async blurFaces(@Body() dto: BlurFacesDto) {
    const result = await this.faceBlurService.blurFacesInImage(dto.s3Key);
    if (!result) return { blurred: false, message: 'No faces detected or processing failed' };

    // Return the full URL of the blurred image
    const bucket = process.env.AWS_S3_BUCKET || 'reportafrica-media';
    const region = process.env.AWS_REGION || 'af-south-1';
    const blurredUrl = `https://${bucket}.s3.${region}.amazonaws.com/${result.blurredKey}`;

    return { blurred: true, blurredKey: result.blurredKey, blurredUrl, facesDetected: result.facesDetected };
  }
}
