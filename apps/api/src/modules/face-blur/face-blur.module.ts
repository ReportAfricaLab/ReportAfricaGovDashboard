import { Module } from '@nestjs/common';
import { FaceBlurService } from './face-blur.service';
import { FaceBlurController } from './face-blur.controller';
import { RekognitionModule } from '../rekognition/rekognition.module';

@Module({
  imports: [RekognitionModule],
  controllers: [FaceBlurController],
  providers: [FaceBlurService],
  exports: [FaceBlurService],
})
export class FaceBlurModule {}
