import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsOptional } from 'class-validator';
import { GovService } from './gov.service';

class RegisterAgencyDto {
  @IsString() agencyName: string;
  @IsString() jurisdiction: string;
  @IsString() contactEmail: string;
}

@Controller('gov')
export class GovController {
  constructor(private readonly service: GovService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('register')
  register(@Request() req: any, @Body() dto: RegisterAgencyDto) {
    return this.service.register(req.user.id, dto);
  }

  @Get('reports/:id')
  getReportDetail(@Param('id') id: string) {
    return this.service.getReportDetail(id);
  }

  @Get('elections')
  getElections(@Query('country') country: string) {
    return this.service.getElections(country || 'NG');
  }

  @Get('export/csv')
  exportCSV(@Query('country') country: string, @Query('category') category?: string, @Query('severity') severity?: string, @Query('state') state?: string, @Query('dateFrom') dateFrom?: string) {
    return this.service.exportCSV(country || 'NG', category, severity, state, dateFrom);
  }

  @Get('sos/live')
  getSOSLive(@Query('country') country: string) {
    return this.service.getSOSLive(country || 'NG');
  }

  @Get('campaigns')
  getCampaigns(@Query('country') country: string) {
    return this.service.getCampaigns(country || 'NG');
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
  approveAgency(@Param('id') id: string) {
    return this.service.approveAgency(id);
  }

  @Patch('agencies/:id/reject')
  rejectAgency(@Param('id') id: string) {
    return this.service.rejectAgency(id);
  }
}
