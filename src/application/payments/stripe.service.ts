import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { StripePaymentDto } from './dto/stripe-payment.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async createPaymentIntent(dto: StripePaymentDto) {
    try {
      // 1. Crear PaymentMethod con el token de test
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: { token: dto.stripeToken },
      });

      // 2. Crear PaymentIntent usando el PaymentMethod
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: dto.amount,
        currency: dto.currency,
        description: dto.description || 'Order payment',
        receipt_email: dto.email,
        payment_method: paymentMethod.id,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });
      return paymentIntent;
    } catch (error) {
      this.logger.error('Stripe error', error);
      throw error;
    }
  }
}
