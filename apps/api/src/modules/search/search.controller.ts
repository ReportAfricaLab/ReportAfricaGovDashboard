import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get('reports')
  searchReports(
    @Query('q') q: string,
    @Query('country') country?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
  ) {
    return this.service.searchReports(q || '', country, category, Number(page) || 1);
  }

  @Get('users')
  searchUsers(@Query('q') q: string, @Query('page') page?: string) {
    return this.service.searchUsers(q || '', Number(page) || 1);
  }

  @Get('trending')
  getTrending(@Query('country') country: string, @Query('hours') hours?: string) {
    return this.service.getTrending(country || 'NG', Number(hours) || 24);
  }

  @Get('suggestions')
  getSuggestions(@Query('q') q: string, @Query('country') country?: string) {
    return this.service.getSuggestions(q || '', country);
  }
}
