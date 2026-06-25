import { Controller, Post, Get, Param, Body, Query, UseGuards, Request, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { BusinessService } from './business.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

class RegisterBusinessDto {
  @IsString() name: string;
  @IsString() @IsOptional() description?: string;
  @IsString() category: string;
  @IsString() @IsOptional() state?: string;
  @IsString() @IsOptional() city?: string;
  @IsString() @IsOptional() address?: string;
  @IsNumber() @IsOptional() latitude?: number;
  @IsNumber() @IsOptional() longitude?: number;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() email?: string;
  @IsString() @IsOptional() website?: string;
  @IsString() @IsOptional() logoUrl?: string;
}

class SubscribeDto {
  @IsString() businessId: string;
  @IsString() tier: string;
  @IsString() email: string;
}

class RespondDto {
  @IsString() businessId: string;
  @IsString() reportId: string;
  @IsString() text: string;
}

@Controller('businesses')
export class BusinessController {
  constructor(
    private readonly service: BusinessService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('register')
  register(@Request() req: any, @Body() dto: RegisterBusinessDto) {
    return this.service.register(req.user.id, req.user.country, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('subscribe')
  subscribe(@Request() req: any, @Body() dto: SubscribeDto) {
    return this.service.subscribe(dto.businessId, req.user.id, dto.tier, dto.email);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  getMyBusinesses(@Request() req: any) {
    return this.service.getMyBusinesses(req.user.id);
  }

  @Get('plans')
  getPlans(@Query('country') country: string) {
    return this.service.getPlans(country || 'NG');
  }

  @Get('verified')
  getVerified(@Query('country') country: string, @Query('lat') lat?: string, @Query('lng') lng?: string, @Query('page') page?: string) {
    return this.service.getVerifiedNearby(country || 'NG', lat ? Number(lat) : undefined, lng ? Number(lng) : undefined, Number(page) || 1);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('respond')
  respond(@Request() req: any, @Body() dto: RespondDto) {
    return this.service.respond(dto.businessId, req.user.id, dto.reportId, dto.text);
  }

  @Get('response/:reportId')
  getResponse(@Param('reportId') reportId: string) {
    return this.service.getResponse(reportId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/analytics')
  getAnalytics(@Request() req: any, @Param('id') id: string) {
    return this.service.getAnalytics(id, req.user.id);
  }

  @Get('promoted')
  getPromoted(@Query('country') country: string, @Query('lat') lat?: string, @Query('lng') lng?: string) {
    return this.service.getPromotedBusinesses(country || 'NG', lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Post('webhook/paystack')
  async paystackWebhook(@Body() body: any, @Headers('x-paystack-signature') signature: string) {
    const secret = this.config.get('PAYSTACK_SECRET_KEY', '');
    if (secret) {
      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(body)).digest('hex');
      if (hash !== signature) return { status: 'invalid_signature' };
    }
    if (body.event === 'charge.success' && body.data?.metadata) {
      await this.service.handleWebhook(body.data.reference, body.data.metadata);
    }
    return { status: 'ok' };
  }
}
