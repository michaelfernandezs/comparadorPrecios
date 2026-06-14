import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { Comparison } from './comparison.entity';
import { SearchResult } from './search-result.entity';
import { PriceHistory } from './price-history.entity';
import { TrackedProduct } from './tracked-product.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScraperService {
@Cron(CronExpression.EVERY_30_MINUTES,{name: 'updatePrices'})
async updateAllPrices() {
  console.log('Actualizando precios...');
  const products = await this.trackedProductRepository.find();
  
  for (const product of products) {
    try {
      const data = await this.scrapeUrl(product.url);
      if (data.price !== 'Sin precio') {
        product.currentPrice = data.price;
        await this.trackedProductRepository.save(product);
        await this.priceHistoryRepository.save(
          this.priceHistoryRepository.create({
            price: data.price,
            trackedProduct: product,
          })
        );
        console.log(`Precio actualizado: ${product.title} → ${data.price}`);
      }
    } catch(e) {
      console.log(`Error actualizando ${product.title}:`, (e as Error).message);
    }
  }
  console.log('Actualización completa');
}
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

  // ─── Métodos privados de Puppeteer ───────────────────────────────

  private async launchBrowser() {
    return puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });
  }

  private async newPage(browser: any) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    await page.setDefaultNavigationTimeout(70000);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-MX,es;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });
    return page;
  }

  // ─── Búsqueda por nombre en cada tienda ──────────────────────────


  private async searchMercadoLibre(query: string): Promise<string | null> {
  const browser = await this.launchBrowser();
  const page = await this.newPage(browser);
  try {
    const shortQuery = query.split(' ').slice(0, 3).join(' ');
    await page.goto(
      `https://listado.mercadolibre.com.mx/${encodeURIComponent(shortQuery)}`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );
    await new Promise(r => setTimeout(r, 2000));
    const url = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];
      const product = links.find(l =>
        l.href.includes('mercadolibre.com.mx/') &&
        (l.href.includes('-MLM') || l.href.includes('/p/MLM'))
      );
      return product?.href || null;
    });
    console.log('ML URL:', url);
    return url;
  } catch(e) {
    console.log('ML error:', (e as Error).message);
    return null;
  } finally {
    await browser.close();
  }
}


private async searchAmazon(query: string): Promise<string | null> {
  const browser = await this.launchBrowser();
  const page = await this.newPage(browser);
  try {
    await page.goto(`https://www.amazon.com.mx/s?k=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 40000 });
    
    // Esperar a que carguen los resultados reales
    await page.waitForSelector('[data-asin]:not([data-asin=""])', { timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

   const url = await page.evaluate(() => {
  // Buscar cualquier link de producto de Amazon
  const links = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];
  const product = links.find(l => 
    l.href.includes('amazon.com.mx') && 
    (l.href.includes('/dp/') || l.href.includes('/gp/product/'))
  );
  if (product) {
    const dpMatch = product.href.match(/\/dp\/([A-Z0-9]{10})/);
    if (dpMatch) return `https://www.amazon.com.mx/dp/${dpMatch[1]}`;
  }
  return null;
});

    console.log('Amazon URL:', url);
    return url;
  } catch(e) {
    console.log('Amazon error:', (e as Error).message);
    return null;
  } finally {
    await browser.close();
  }
}

private async searchLiverpool(query: string): Promise<string | null> {
  const browser = await this.launchBrowser();
  const page = await this.newPage(browser);
  try {
    await page.goto(
      `https://www.liverpool.com.mx/tienda/search?q=${encodeURIComponent(query)}`,
      { waitUntil: 'networkidle2' }
    );
    await new Promise(r => setTimeout(r, 3000));
    const url = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];
      const product = links.find(l => 
        l.href.includes('/tienda/pdp/') || 
        l.href.includes('/tienda/p/')
      );
      console.log('Liverpool link encontrado:', product?.href);
      return product?.href || null;
    });
    console.log('Liverpool URL:', url);
    return url;
  } finally {
    await browser.close();
  }
}

  // ─── Scraping de producto individual ─────────────────────────────

  private async scrapeUrl(url: string) {
    const browser = await this.launchBrowser();
    const page = await this.newPage(browser);
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      if (url.includes('mercadolibre')) {
        await page.waitForSelector('.ui-pdp-title', { timeout: 20000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 3000));
      } else if (url.includes('amazon')) {
        await page.waitForSelector('#productTitle', { timeout: 20000 }).catch(() => {});
      } else if (url.includes('liverpool')) {
        await page.waitForSelector('.a-product__information--title', { timeout: 20000 }).catch(() => {});
      }

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

      return data;
    } finally {
      await browser.close();
    }
  }

  // ─── Búsqueda por nombre + comparación ───────────────────────────

  async searchByName(query: string) {
    const [amazonUrl, mlUrl, liverpoolUrl] = await Promise.all([
      this.searchAmazon(query),
      this.searchMercadoLibre(query),
      this.searchLiverpool(query),
    ]);

    const urls = [amazonUrl, mlUrl, liverpoolUrl].filter(Boolean) as string[];
    return this.compareAll(urls);
  }

  // ─── Comparación y guardado ───────────────────────────────────────

 async compareAll(urls: string[]) {
  const results = await Promise.all(
    urls.map(url => this.scrapeUrl(url))
  );

  // Filtrar resultados vacíos
  const validResults = results.filter(r => r.title !== 'Sin título' && r.price !== 'Sin precio');

  if (validResults.length === 0) {
    throw new Error('No se encontraron resultados para ninguna tienda');
  }

  const withPrices = validResults.map(r => ({
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

      let tracked = await this.trackedProductRepository.findOne({ where: { url } });

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

      await this.searchResultRepository.save({
        comparison: saved,
        store: result.store,
        title: result.title,
        price: result.price,
        image: result.image,
        url,
        trackedProductId: tracked.id,
      });

      await this.priceHistoryRepository.save(
        this.priceHistoryRepository.create({
          price: result.price,
          trackedProduct: tracked,
        })
      );
    }

    return results;
  }

  // ─── Historial ────────────────────────────────────────────────────

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

    product.priceHistory.sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    return product;
  }
}