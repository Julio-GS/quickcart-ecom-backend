import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
const compression = require('compression');
import rateLimit from 'express-rate-limit';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Disable debug and verbose logs
  });
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // Compression middleware
  app.use(compression());

  // Rate limiting (OWASP A04: Insecure Design prevention)
  app.use(
    rateLimit({
      windowMs: configService.get<number>('RATE_LIMIT_TTL', 60) * 1000,
      max: configService.get<number>('RATE_LIMIT_LIMIT', 100),
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Global validation pipe (OWASP A03: Injection prevention)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Transform payload to DTO instance
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration - Flexible for development and production
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const corsConfig =
    nodeEnv === 'production'
      ? {
          origin: corsOrigin.split(',').map((o) => o.trim()),
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
        }
      : {
          origin: true, // Permite todo en desarrollo
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
        };

  app.enableCors(corsConfig);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation (disponible en todos los entornos)
  const config = new DocumentBuilder()
    .setTitle('QuickCart E-commerce API')
    .setDescription('Backend API for QuickCart E-commerce platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  const port = configService.get<number>('PORT', 3001);

  await app.listen(port);

  console.log(`🚀 QuickCart Backend running on port ${port} (${nodeEnv})`);
  if (nodeEnv !== 'production') {
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
