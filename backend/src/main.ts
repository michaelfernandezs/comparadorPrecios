import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors(
    {
    origin: ['https://empowering-healing-production-a1c8.up.railway.app', 'http://localhost:4200'],
    methods: ['GET', 'POST'],
  }
  );

  await app.listen(3000);
  console.log('Backend corriendo en http://localhost:3000');
}
bootstrap();