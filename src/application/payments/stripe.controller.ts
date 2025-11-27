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
    const session = await this.stripeService.createCheckoutSession(dto);
    return {
      id: session.id,
      url: session.url,
      status: session.status,
    };
  }
}
