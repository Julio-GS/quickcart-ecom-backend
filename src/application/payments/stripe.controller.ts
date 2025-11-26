import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripePaymentDto } from './dto/stripe-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments/stripe')
@UseGuards(JwtAuthGuard)
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testPayment(@Body() dto: StripePaymentDto) {
    const paymentIntent = await this.stripeService.createPaymentIntent(dto);
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
    };
  }
}
