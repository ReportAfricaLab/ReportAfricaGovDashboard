import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsOptional } from 'class-validator';
import { GovService } from './gov.service';

class RegisterAgencyDto {
  @IsString() agencyName: string;
  @IsString() jurisdiction: string;
  @IsString() contactEmail: string;
  @IsString() @IsOptional() proofUrl?: string;
}

@Controller('gov')
export class GovController {
  constructor(private readonly service: GovService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('register')
  register(@Request() req: any, @Body() dto: RegisterAgencyDto) {
    return this.service.register(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('settings')
  saveSettings(@Request() req: any, @Body() body: any) {
    return { saved: true, userId: req.user.id };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Request() req: any) {
    return this.service.getGovMe(req.user.id);
  }

  @Get('reports/:id')
  getReportDetail(@Param('id') id: string) {
    return this.service.getReportDetail(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('elections')
  getElections(@Request() req: any, @Query('country') country: string) {
    return this.service.getElections(country || 'NG', req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('export/csv')
  exportCSV(@Request() req: any, @Query('country') country: string, @Query('category') category?: string, @Query('severity') severity?: string, @Query('state') state?: string, @Query('dateFrom') dateFrom?: string) {
    return this.service.exportCSV(country || 'NG', category, severity, state, dateFrom, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('sos/live')
  getSOSLive(@Request() req: any, @Query('country') country: string) {
    return this.service.getSOSLive(country || 'NG', req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('campaigns')
  getCampaigns(@Request() req: any, @Query('country') country: string) {
    return this.service.getCampaigns(country || 'NG', req.user.id);
  }

  // Admin endpoints for managing gov agencies
  @Get('agencies/pending')
  getPendingAgencies() {
    return this.service.getPendingAgencies();
  }

  @Get('agencies/all')
  getAllAgencies() {
    return this.service.getAllAgencies();
  }

  @Patch('agencies/:id/approve')
  approveAgency(@Param('id') id: string, @Body() body: { country?: string; state?: string }) {
    return this.service.approveAgency(id, body?.country, body?.state);
  }

  @Patch('agencies/:id/reject')
  rejectAgency(@Param('id') id: string) {
    return this.service.rejectAgency(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('agencies/:id/grant-access')
  grantAccess(@Param('id') id: string, @Body() body: { tier: string; days: number }) {
    return this.service.grantAccess(id, body.tier, body.days);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('subscribe')
  subscribe(@Request() req: any, @Body() dto: { tier: string; email: string }) {
    return this.service.subscribe(req.user.id, dto.tier, dto.email);
  }

  @Get('plans')
  getPlans() {
    return this.service.getPlans();
  }
}
