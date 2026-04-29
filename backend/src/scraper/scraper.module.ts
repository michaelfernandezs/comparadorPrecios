import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { Comparison } from './comparison.entity';
import { SearchResult } from './search-result.entity';
import { TrackedProduct } from './tracked-product.entity';
import { PriceHistory } from './price-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comparison, SearchResult, TrackedProduct, PriceHistory])],
  controllers: [ScraperController],
  providers: [ScraperService],
})
export class ScraperModule {}