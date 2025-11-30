import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/checkout-session.dto';
import { CheckoutSession } from '../../domain/entities/checkout-session.entity';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(CheckoutSession)
    private readonly checkoutSessionRepo: Repository<CheckoutSession>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  /**
   * Guardar datos temporales del carrito y crear Session de Stripe
   */
  async createCheckoutSessionWithCart(dto: CreateCheckoutSessionDto) {
    try {
      // 1. Guardar datos temporales del carrito en la base de datos
      const checkoutSession = this.checkoutSessionRepo.create({
        userId: dto.userId,
        cartData: {
          items: dto.items,
          total: dto.total,
        },
        status: 'pending',
      });
      await this.checkoutSessionRepo.save(checkoutSession);

      // 2. Crear line_items dinámicamente desde el carrito
      const lineItems = dto.items.map((item) => ({
        price_data: {
          currency: dto.currency,
          product_data: {
            name: `Product ${item.productId}`, // Puedes mejorar esto con datos reales del producto
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      }));

      // 3. Incluir sessionId en las URLs de Stripe
      const successUrl = `${dto.successUrl}?sessionId=${checkoutSession.id}`;
      const cancelUrl = `${dto.cancelUrl}?sessionId=${checkoutSession.id}`;

      // 4. Crear Session de Stripe
      const stripeSession = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      // 5. Actualizar checkoutSession con el ID de Stripe
      checkoutSession.stripeSessionId = stripeSession.id;
      await this.checkoutSessionRepo.save(checkoutSession);

      return {
        sessionId: checkoutSession.id,
        stripeUrl: stripeSession.url,
      };
    } catch (error) {
      this.logger.error('Error creating checkout session', error);
      throw error;
    }
  }

  /**
   * Recuperar datos del carrito por sessionId
   */
  async getCheckoutSession(sessionId: string) {
    const session = await this.checkoutSessionRepo.findOne({
      where: { id: sessionId, status: 'pending' },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found or expired');
    }

    return session;
  }

  /**
   * Marcar session como completada
   */
  async completeCheckoutSession(sessionId: string) {
    const session = await this.getCheckoutSession(sessionId);
    session.status = 'completed';
    await this.checkoutSessionRepo.save(session);
    return session;
  }
}
