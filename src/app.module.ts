import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from './infrastructure/database/database.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './application/auth/auth.module';
import { UserModule } from './application/users/user.module';
import { ProductModule } from './application/products/product.module';
import { OrderModule } from './application/orders/order.module';
import { configValidationSchema } from './shared/config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './application/payments/payments.module';

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

    // Authentication and Authorization
    AuthModule,

    // Feature modules
    UserModule,
    ProductModule,
    OrderModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
