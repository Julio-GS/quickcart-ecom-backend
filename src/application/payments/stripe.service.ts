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

  async createCheckoutSession(dto: StripePaymentDto) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: dto.currency,
              product_data: {
                name: dto.productName,
                description:
                  dto.productDescription || dto.description || 'Order payment',
                images: dto.productImage ? [dto.productImage] : [],
              },
              unit_amount: dto.amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: dto.email,
        success_url: dto.successUrl || 'https://localhost:3001/success',
        cancel_url: dto.cancelUrl || 'https://localhost:3001/cancel',
      });
      return session;
    } catch (error) {
      this.logger.error('Stripe error', error);
      throw error;
    }
  }
}
