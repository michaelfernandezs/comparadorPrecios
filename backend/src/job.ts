import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ScraperService } from './scraper/scraper.service';

/**
 * Entrypoint para Cloud Run Jobs.
 *
 * A diferencia de main.ts, esto NO levanta un servidor HTTP: crea un
 * "application context" de Nest (con acceso a DI, TypeORM, etc.), ejecuta
 * la actualización de precios una sola vez, y cierra el proceso.
 *
 * Cloud Scheduler dispara este Job en un horario fijo (ej. diario),
 * en vez de depender de un @Cron corriendo dentro de un servicio que
 * podría estar escalado a cero.
 */
async function runJob() {
  const startedAt = Date.now();
  console.log('[job] Iniciando job de actualización de precios...');

  const appContext = await NestFactory.createApplicationContext(AppModule, {
    // El Job no necesita logs HTTP, solo los del propio scraper
    logger: ['log', 'warn', 'error'],
  });

  try {
    const scraperService = appContext.get(ScraperService);
    await scraperService.updateAllPrices();

    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[job] Job completado en ${seconds}s`);
    await appContext.close();
    process.exit(0);
  } catch (error) {
    console.error('[job] Job falló:', (error as Error).message);
    await appContext.close();
    // Código de salida distinto de 0 -> Cloud Run marca la ejecución como fallida
    process.exit(1);
  }
}

runJob();
