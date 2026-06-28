import { Controller, Post, Get, Patch, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ObserverService } from './observer.service';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('observers')
export class ObserverController {
  constructor(private readonly service: ObserverService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('register')
  register(@Request() req: any, @Body() dto: { orgName?: string; country: string; tier: string; accreditationUrl: string }) {
    return this.service.register(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMyProfile(@Request() req: any) {
    return this.service.getMyProfile(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('subscription')
  getSubscription(@Request() req: any, @Query('country') country: string) {
    return this.service.getMySubscription(req.user.id, country);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('pay')
  initPayment(@Request() req: any, @Body() dto: { country: string; email: string }) {
    return this.service.initPayment(req.user.id, dto.country, dto.email);
  }

  @Get('verify/:reference')
  verifyPayment(@Param('reference') reference: string) {
    return this.service.verifyPayment(reference);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('invite-seat')
  inviteSeat(@Request() req: any, @Body() dto: { country: string; userId: string }) {
    return this.service.inviteSeat(req.user.id, dto.country, dto.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('seats')
  getSeats(@Request() req: any, @Query('country') country: string) {
    return this.service.getSeats(req.user.id, country);
  }

  // Admin endpoints
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('admin/pending')
  getPending() {
    return this.service.getPending();
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch('admin/:id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch('admin/:id/reject')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch('admin/:id/activate')
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('admin/active')
  getActive() {
    return this.service.getAllActive();
  }
}
