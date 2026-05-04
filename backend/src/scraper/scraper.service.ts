
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { Comparison } from './comparison.entity';
import { SearchResult } from './search-result.entity';
import{PriceHistory} from './price-history.entity';
import { TrackedProduct } from './tracked-product.entity';
@Injectable()
export class ScraperService {

  constructor(
    @InjectRepository(Comparison)
    private comparisonRepository: Repository<Comparison>,
    @InjectRepository(SearchResult)
    private searchResultRepository: Repository<SearchResult>,
    @InjectRepository(TrackedProduct)
    private trackedProductRepository: Repository<TrackedProduct>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
  ) {}

  async scrapeUrl(url: string) {
   
   const browser = await puppeteer.launch({
  headless: true, 
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
  ],
});

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.setDefaultNavigationTimeout(70000);
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('.ui-pdp-title', { timeout: 15000 }).catch(() => {});

    const data = await page.evaluate(() => {
      const hostname = window.location.hostname;

      let title       = 'Sin título';
      let price       = 'Sin precio';
      let description = 'Sin descripción';
      let image       = '';
      let store       = 'Desconocida';

      if (hostname.includes('mercadolibre')) {
        store       = 'Mercado Libre';
        title       = document.querySelector('.ui-pdp-title')?.textContent || title;
        price       = document.querySelector('.ui-pdp-price__second-line .ui-pdp-price__part')?.textContent || price;
        description = document.querySelector('.ui-pdp-description__content')?.textContent || description;
        image       = (document.querySelector('.ui-pdp-gallery__figure img') as HTMLImageElement)?.src || image;

      } else if (hostname.includes('liverpool')) {
        store       = 'Liverpool';
        title       = document.querySelector('.a-product__information--title')?.textContent || title;
        price       = document.querySelector('.a-product__paragraphDiscountPrice')?.textContent || price;
        description = document.querySelector('.productDetailTab')?.textContent || description;
        image       = (document.querySelector('.carouselGallery img') as HTMLImageElement)?.src || image;
        if (price !== 'Sin precio') price = price.slice(0, -2);

      } else if (hostname.includes('amazon')) {
        store       = 'Amazon';
        title       = document.querySelector('#productTitle')?.textContent || title;
        price       = document.querySelector('.a-price-whole')?.textContent || title;
        description = document.querySelector('.descriptions')?.textContent || description;
        image       = (document.querySelector('#landingImage') as HTMLImageElement)?.src || image;
      }

      return { title: title.trim(), price: price.trim(), description: description.trim(), image, store };
    });

    await browser.close();

    return data;
  }

  async compareAll(urls: string[]) {
  const results = await Promise.all(
    urls.map(url => this.scrapeUrl(url))
  );

  const withPrices = results.map(r => ({
    ...r,
    priceNumber: parseFloat(r.price.replace(/[^0-9.]/g, '')) || 0,
  }));

  const sorted = [...withPrices].sort((a, b) => a.priceNumber - b.priceNumber);
  const winner = sorted[0];

  const comparison = this.comparisonRepository.create({
    winner: winner.store,
    winnerPrice: winner.price,
  });
  const saved = await this.comparisonRepository.save(comparison);

  for (const result of results) {
  const url = urls[results.indexOf(result)];

  // 1. Primero buscar o crear TrackedProduct
  let tracked = await this.trackedProductRepository.findOne({
    where: { url }
  });

  if (!tracked) {
    tracked = this.trackedProductRepository.create({
      store: result.store,
      title: result.title,
      url,
      image: result.image,
      currentPrice: result.price,
    });
  } else {
    tracked.currentPrice = result.price;
  }

  await this.trackedProductRepository.save(tracked);

  // 2. Ahora guardar SearchResult con el trackedProductId
  await this.searchResultRepository.save({
    comparison: saved,
    store: result.store,
    title: result.title,
    price: result.price,
    image: result.image,
    url,
    trackedProductId: tracked.id,  // ← ya tenemos el id
  });

  // 3. Registrar precio en el historial
  await this.priceHistoryRepository.save(
    this.priceHistoryRepository.create({
      price: result.price,
      trackedProduct: tracked,
    })
  );
}

  return results;
}

  async getHistory() {
    return this.comparisonRepository.find({
      relations: ['results'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

 async getProductHistory(productId: number) {
  const product = await this.trackedProductRepository.findOne({
    where: { id: productId },
    relations: ['priceHistory'],
  });

  if (!product) return null;

  // Ordenar en memoria después de obtener los datos
  product.priceHistory.sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  return product;
}


async saveComparison(results: any[]) {
  for (const result of results) {
    // Busca si ya existe un TrackedProduct para esta URL
    let tracked = await this.trackedProductRepository.findOne({
      where: { url: result.url }
    });

    // Si no existe, créalo
    if (!tracked) {
      tracked = this.trackedProductRepository.create({
        store: result.store,
        title: result.title,
        url: result.url,
        image: result.image,
        currentPrice: result.price,
      });
      await this.trackedProductRepository.save(tracked);
    } else {
      // Actualiza el precio actual
      tracked.currentPrice = result.price;
      await this.trackedProductRepository.save(tracked);
    }

    // Guarda el precio en el historial
    const priceEntry = this.priceHistoryRepository.create({
      price: result.price,
      trackedProduct: tracked,
    });
    await this.priceHistoryRepository.save(priceEntry);

    // Linkea el SearchResult con el TrackedProduct
    result.trackedProductId = tracked.id;
  }
}
}