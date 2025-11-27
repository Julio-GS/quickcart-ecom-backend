import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsEmail,
  Min,
  IsIn,
} from 'class-validator';

export class StripePaymentDto {
  @IsInt()
  @Min(1)
  amount: number; // en centavos

  @IsString()
  @IsIn(['usd', 'eur', 'ars'])
  currency: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  stripeToken: string;

  @IsString()
  description?: string;

  @IsString()
  productName: string;

  @IsString()
  productDescription?: string;

  @IsString()
  productImage?: string;

  @IsString()
  successUrl?: string;

  @IsString()
  cancelUrl?: string;
}
