import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import {
  CreateCheckoutSessionDto,
  CheckoutSessionResponseDto,
} from './dto/checkout-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear sesión de checkout con persistencia del carrito',
  })
  @ApiResponse({
    status: 201,
    description: 'Sesión de checkout creada exitosamente',
    type: CheckoutSessionResponseDto,
  })
  async createCheckout(
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    return this.stripeService.createCheckoutSessionWithCart(dto);
  }

  @Get('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener datos del carrito por sessionId' })
  @ApiResponse({
    status: 200,
    description: 'Datos del carrito recuperados exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Sesión no encontrada o expirada',
  })
  async getCheckoutSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.stripeService.getCheckoutSession(sessionId);
  }

  @Post('session/:sessionId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar sesión como completada (después de crear orden)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión marcada como completada',
  })
  async completeCheckoutSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.stripeService.completeCheckoutSession(sessionId);
  }
}
