import { Module, Global } from '@nestjs/common';
import { RekognitionService } from './rekognition.service';

@Global()
@Module({
  providers: [RekognitionService],
  exports: [RekognitionService],
})
export class RekognitionModule {}
