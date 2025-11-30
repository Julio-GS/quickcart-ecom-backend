import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { CheckoutSession } from '../../domain/entities/checkout-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckoutSession])],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class PaymentsModule {}
