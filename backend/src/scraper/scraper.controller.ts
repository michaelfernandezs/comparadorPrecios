import { Controller, Post, Body, Get, Param, Headers, UnauthorizedException } from '@nestjs/common';
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

  // Dispara la actualización completa de precios (todos los productos rastreados).
  // Protegido con un header secreto: solo quien tenga CRON_SECRET puede llamarlo
  // (en la práctica, el workflow programado de GitHub Actions).
  @Post('update-all')
  async updateAll(@Headers('x-cron-secret') secret: string) {
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException();
    }
    await this.scraperService.updateAllPrices();
    return { ok: true, triggeredAt: new Date().toISOString() };
  }


@Get('history')
getAllHistory() {
  return this.scraperService.getHistory();
}

@Get('history/:id')
getProductHistory(@Param('id') id: number) {
  return this.scraperService.getProductHistory(id);
}
@Post('search')
async searchByName(@Body() body: { query: string }) {
  return this.scraperService.searchByName(body.query);
}

@Get('price-drops')
getPriceDrops() {
  return this.scraperService.getPriceDrops();
}
}