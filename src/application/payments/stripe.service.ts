import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/checkout-session.dto';
import { CheckoutSession } from '../../domain/entities/checkout-session.entity';
import { ProductService } from '../products/product.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(CheckoutSession)
    private readonly checkoutSessionRepo: Repository<CheckoutSession>,
    private readonly configService: ConfigService,
    private readonly productService: ProductService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured in environment variables',
      );
    }
    this.stripe = new Stripe(stripeKey);
  }

  /**
   * Guardar datos temporales del carrito y crear Session de Stripe
   */
  async createCheckoutSessionWithCart(dto: CreateCheckoutSessionDto) {
    try {
      // 1. Calcular fecha de expiración basada en configuración
      const expirationHours = this.configService.get<number>(
        'SESSION_EXPIRATION_HOURS',
        1,
      );
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      // 2. Guardar datos temporales del carrito en la base de datos
      const checkoutSession = this.checkoutSessionRepo.create({
        userId: dto.userId,
        cartData: {
          items: dto.items,
          total: dto.total,
        },
        status: 'pending',
        expiresAt,
      });
      await this.checkoutSessionRepo.save(checkoutSession);

      // 3. Obtener datos reales de productos y crear line_items
      const lineItems = await Promise.all(
        dto.items.map(async (item) => {
          let productName = `Product ${item.productId}`;
          let productImage: string | undefined;

          try {
            const product = await this.productService.findOne(
              item.productId.toString(),
            );
            productName = product.name;
            productImage = product.imageUrl;
          } catch (error) {
            this.logger.warn(
              `Product ${item.productId} not found, using fallback name`,
            );
          }

          return {
            price_data: {
              currency: dto.currency,
              product_data: {
                name: productName,
                images: productImage ? [productImage] : [],
              },
              unit_amount: item.price,
            },
            quantity: item.quantity,
          };
        }),
      );

      // 4. Incluir sessionId en las URLs de Stripe
      const successUrl = `${dto.successUrl}?sessionId=${checkoutSession.id}`;
      const cancelUrl = `${dto.cancelUrl}?sessionId=${checkoutSession.id}`;

      // 5. Crear Session de Stripe
      const stripeSession = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      // 6. Actualizar checkoutSession con el ID de Stripe
      checkoutSession.stripeSessionId = stripeSession.id;
      await this.checkoutSessionRepo.save(checkoutSession);

      return {
        sessionId: checkoutSession.id,
        stripeUrl: stripeSession.url,
      };
    } catch (error) {
      this.logger.error('Error creating checkout session', error);

      // Clasificar errores de Stripe
      if (error instanceof Stripe.errors.StripeError) {
        switch (error.type) {
          case 'StripeCardError':
            throw new BadRequestException(
              'Error con la tarjeta: ' + error.message,
            );
          case 'StripeRateLimitError':
            throw new BadRequestException(
              'Demasiadas solicitudes, intente más tarde',
            );
          case 'StripeInvalidRequestError':
            throw new BadRequestException(
              'Solicitud inválida: ' + error.message,
            );
          case 'StripeAPIError':
            throw new BadRequestException(
              'Error del servicio de pagos, intente más tarde',
            );
          case 'StripeConnectionError':
            throw new BadRequestException(
              'Error de conexión con el servicio de pagos',
            );
          case 'StripeAuthenticationError':
            throw new BadRequestException(
              'Error de autenticación con el servicio de pagos',
            );
          default:
            throw new BadRequestException(
              'Error procesando el pago: ' + error.message,
            );
        }
      }

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
