import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'iPhone 15 Pro Max',
    minLength: 2,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(255, { message: 'El nombre no debe exceder 255 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Slug único del producto para URLs amigables',
    example: 'iphone-15-pro-max',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsNotEmpty({ message: 'El slug es obligatorio' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug debe contener solo letras minúsculas, números y guiones',
  })
  @MaxLength(255, { message: 'El slug no debe exceder 255 caracteres' })
  slug: string;

  @ApiProperty({
    description: 'Descripción detallada del producto',
    example: 'El iPhone 15 Pro Max cuenta con la potencia del chip A17 Pro...',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La descripción no debe exceder 2000 caracteres',
  })
  description?: string;

  @ApiProperty({
    description:
      'Precio del producto en centavos (para evitar problemas con decimales)',
    example: 129999,
    minimum: 1,
    maximum: 999999999,
  })
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'El precio debe ser un número válido' },
  )
  @Min(1, { message: 'El precio debe ser mayor a 0' })
  @Max(999999999, { message: 'El precio no puede exceder $9,999,999.99' })
  price: number;

  @ApiProperty({
    description: 'Cantidad en stock disponible',
    example: 50,
    minimum: 0,
    maximum: 999999,
  })
  @IsNotEmpty({ message: 'El stock es obligatorio' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'El stock debe ser un número válido' },
  )
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Max(999999, { message: 'El stock no puede exceder 999,999 unidades' })
  stock: number;

  @ApiProperty({
    description: 'Categoría del producto',
    example: 'ELECTRONICOS',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @IsString()
  @MaxLength(100, { message: 'La categoría no debe exceder 100 caracteres' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  category: string;

  @ApiProperty({
    description: 'URL de la imagen principal del producto',
    example: 'https://example.com/images/iphone-15-pro-max.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'La URL de imagen no debe exceder 500 caracteres',
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Indica si el producto está destacado en la tienda',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo destacado debe ser verdadero o falso' })
  isFeatured?: boolean = false;
}
