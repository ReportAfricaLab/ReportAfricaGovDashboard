import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard')
  getDashboard(@Query('country') country: string) {
    return this.service.getCountryDashboard(country || 'NG');
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('hotspots')
  getHotspots(@Query('country') country: string, @Query('category') category?: string) {
    return this.service.getIncidentHotspots(country || 'NG', category);
  }

  @Get('trending')
  getTrending(@Query('country') country: string, @Query('hours') hours?: string) {
    return this.service.getTrending(country || 'NG', Number(hours) || 24);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('donations')
  getDonationStats(@Query('country') country: string) {
    return this.service.getDonationStats(country || 'NG');
  }
}
