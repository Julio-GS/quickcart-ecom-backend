import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import { AppModule } from '../src/app.module';

const server = express();

export default async (req: any, res: any) => {
  if (!server.locals.app) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { logger: ['error', 'warn', 'log'] },
    );

    const configService = app.get(ConfigService);

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // CORS - Allow all origins for Vercel
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
      ],
      exposedHeaders: ['Authorization'],
      credentials: true,
      optionsSuccessStatus: 200,
    });

    // Global prefix
    app.setGlobalPrefix('api/v1');

    await app.init();
    server.locals.app = app;
  }

  return server(req, res);
};
