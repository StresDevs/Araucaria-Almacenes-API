import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedApp: NestExpressApplication;

async function createApp(): Promise<NestExpressApplication> {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Prefijo global /api
  app.setGlobalPrefix('api');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — soporta múltiples orígenes separados por coma
  const rawOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3001');
  const allowedOrigins = rawOrigin.split(',').map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  });

  await app.init();
  cachedApp = app;
  return app;
}

// Local development: listen on port
async function bootstrap() {
  const app = await createApp();
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 API corriendo en http://localhost:${port}/api`);
}

// Vercel serverless handler
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await createApp();
  const expressInstance = app.getHttpAdapter().getInstance();
  return expressInstance(req, res);
}

// Only listen when not in Vercel (serverless sets VERCEL=1)
if (!process.env.VERCEL) {
  bootstrap();
}
