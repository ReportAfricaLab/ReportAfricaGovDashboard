import { Controller, Post, Get, Param, Body, Query, UseGuards, Request, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ChallengesService } from './challenges.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

class CreateChallengeDto {
  @IsString() businessId: string;
  @IsString() title: string;
  @IsString() description: string;
  @IsString() productName: string;
  @IsString() @IsOptional() productImageUrl?: string;
  @IsNumber() potAmount: number;
  @IsString() deadline: string;
  @IsString() email: string;
}

class EnterChallengeDto {
  @IsString() reportId: string;
}

@Controller('challenges')
export class ChallengesController {
  constructor(
    private readonly service: ChallengesService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Request() req: any, @Body() dto: CreateChallengeDto) {
    return this.service.create(req.user.id, req.user.country, dto);
  }

  @Get('feed')
  getFeed(@Query('country') country: string, @Query('page') page?: string) {
    return this.service.getFeed(country || 'NG', Number(page) || 1);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.service.getLeaderboard(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/enter')
  enter(@Request() req: any, @Param('id') id: string, @Body() dto: EnterChallengeDto) {
    return this.service.enter(req.user.id, id, dto.reportId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my/entries')
  getMyEntries(@Request() req: any) {
    return this.service.getMyEntries(req.user.id);
  }

  @Post('admin/close-expired')
  closeExpired() {
    return this.service.closeExpired();
  }

  @Post('webhook/paystack')
  async paystackWebhook(@Body() body: any, @Headers('x-paystack-signature') signature: string) {
    const secret = this.config.get('PAYSTACK_SECRET_KEY', '');
    if (secret) {
      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(body)).digest('hex');
      if (hash !== signature) return { status: 'invalid_signature' };
    }
    if (body.event === 'charge.success' && body.data?.metadata) {
      await this.service.handlePaymentWebhook(body.data.reference, body.data.metadata);
    }
    return { status: 'ok' };
  }
}
