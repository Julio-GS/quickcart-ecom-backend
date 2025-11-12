import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '@infrastructure/database/database.module';
import { SharedModule } from '@shared/shared.module';
import { configValidationSchema } from '@shared/config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration with validation (OWASP A05: Security Misconfiguration prevention)
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),

    // Database configuration
    DatabaseModule,

    // Shared utilities and services
    SharedModule,

    // Feature modules will be added here
    // AuthModule,
    // UsersModule,
    // ProductsModule,
    // OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
