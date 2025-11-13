import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

export class ProductResponseDto {
  @ApiProperty({
    description: 'ID único del producto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'iPhone 15 Pro Max',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Slug único del producto',
    example: 'iphone-15-pro-max',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Descripción del producto',
    example: 'El iPhone 15 Pro Max cuenta con...',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Precio formateado del producto',
    example: '1299.99',
  })
  @Expose()
  @Transform(({ value }) => (value / 100).toFixed(2))
  price: string;

  @ApiProperty({
    description: 'Precio en centavos (valor raw)',
    example: 129999,
  })
  @Expose()
  priceInCents: number;

  @ApiProperty({
    description: 'Cantidad en stock',
    example: 50,
  })
  @Expose()
  stock: number;

  @ApiProperty({
    description: 'Categoría del producto',
    example: 'Electrónicos',
  })
  @Expose()
  category: string;

  @ApiProperty({
    description: 'URL de imagen del producto',
    example: 'https://example.com/image.jpg',
    nullable: true,
  })
  @Expose()
  imageUrl: string | null;

  @ApiProperty({
    description: 'Indica si el producto está destacado',
    example: true,
  })
  @Expose()
  isFeatured: boolean;

  @ApiProperty({
    description: 'Indica si el producto está disponible',
    example: true,
  })
  @Expose()
  @Transform(({ obj }) => obj.stock > 0)
  isAvailable: boolean;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2023-12-01T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2023-12-01T15:45:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  // Excluir campos internos
  @Exclude()
  deletedAt: Date | null;

  constructor(partial: Partial<ProductResponseDto>) {
    Object.assign(this, partial);
  }
}
