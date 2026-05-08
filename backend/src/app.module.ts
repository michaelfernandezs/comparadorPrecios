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
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : 'localhost',
  port: process.env.DATABASE_URL ? undefined : 5432,
  username: process.env.DATABASE_URL ? undefined : 'postgres',
  password: process.env.DATABASE_URL ? undefined : '123456',
  database: process.env.DATABASE_URL ? undefined : 'price_comparator',
  entities: [Comparison, SearchResult, TrackedProduct, PriceHistory],
  synchronize: true,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
}),
    ScraperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}