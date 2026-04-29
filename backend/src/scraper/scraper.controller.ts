import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scrape')
export class ScraperController {

  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  async compare(@Body() body: { urls: string[] }) {
    const { urls } = body;
    const results = await this.scraperService.compareAll(urls);
    return results;
  }

  
  @Get('history/:id')
getHistory(@Param('id') id: number) {
  return this.scraperService.getProductHistory(id);
}
}