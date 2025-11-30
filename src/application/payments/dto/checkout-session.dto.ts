import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(0)
  price: number; // en centavos
}

export class CreateCheckoutSessionDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsInt()
  @Min(1)
  total: number; // en centavos

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  successUrl: string;

  @IsString()
  cancelUrl: string;
}

export class CheckoutSessionResponseDto {
  sessionId: string;
  stripeUrl: string;
}
