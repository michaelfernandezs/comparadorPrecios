import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperModule } from './scraper/scraper.module';
import { Comparison } from './scraper/comparison.entity';
import { SearchResult } from './scraper/search-result.entity';
import { TrackedProduct } from './scraper/tracked-product.entity';
import { PriceHistory } from './scraper/price-history.entity';

@Module({
  imports: [
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '123456',
  database: 'price_comparator',
  entities: [Comparison, SearchResult, TrackedProduct, PriceHistory],
  synchronize: true,
}),
    ScraperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}