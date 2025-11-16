import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { OrderStatus } from '../../../domain/entities/order.entity';

export class OrderItemResponseDto {
  @ApiProperty({
    description: 'ID del item',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'ID del producto',
    example: 1,
  })
  @Expose()
  productId: number;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'iPhone 15 Pro Max',
  })
  @Expose()
  productName: string;

  @ApiProperty({
    description: 'Cantidad del producto',
    example: 2,
  })
  @Expose()
  quantity: number;

  @ApiProperty({
    description: 'Precio al momento de la compra (formateado)',
    example: '1299.99',
  })
  @Expose()
  @Transform(({ value }) => (value / 100).toFixed(2))
  priceAtPurchase: string;

  @ApiProperty({
    description: 'Precio en centavos (valor raw)',
    example: 129999,
  })
  @Expose()
  priceInCents: number;

  @ApiProperty({
    description: 'Total del item (formateado)',
    example: '2599.98',
  })
  @Expose()
  @Transform(({ obj }) => ((obj.priceInCents * obj.quantity) / 100).toFixed(2))
  totalPrice: string;

  constructor(partial: Partial<OrderItemResponseDto>) {
    Object.assign(this, partial);
  }
}

export class OrderResponseDto {
  @ApiProperty({
    description: 'ID único de la orden',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID del usuario que realizó la orden',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @Expose()
  userFullName: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan@email.com',
  })
  @Expose()
  userEmail: string;

  @ApiProperty({
    description: 'Monto total de la orden (formateado)',
    example: '2599.98',
  })
  @Expose()
  @Transform(({ value }) => (value / 100).toFixed(2))
  totalAmount: string;

  @ApiProperty({
    description: 'Monto total en centavos (valor raw)',
    example: 259998,
  })
  @Expose()
  totalAmountInCents: number;

  @ApiProperty({
    description: 'Estado de la orden',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  @Expose()
  status: OrderStatus;

  @ApiProperty({
    description: 'Dirección de entrega',
    example: 'Calle 123 #45-67, Bogotá, Colombia',
    nullable: true,
  })
  @Expose()
  deliveryAddress: string | null;

  @ApiProperty({
    description: 'Items de la orden',
    type: [OrderItemResponseDto],
  })
  @Expose()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];

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

  @ApiProperty({
    description: 'Indica si la orden es editable',
    example: true,
  })
  @Expose()
  @Transform(({ obj }) => obj.status === OrderStatus.PENDING)
  isEditable: boolean;

  @ApiProperty({
    description: 'Indica si la orden puede ser cancelada',
    example: true,
  })
  @Expose()
  @Transform(({ obj }) =>
    [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(obj.status),
  )
  canBeCancelled: boolean;

  constructor(partial: Partial<OrderResponseDto>) {
    Object.assign(this, partial);
  }
}
