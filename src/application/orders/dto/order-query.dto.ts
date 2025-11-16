import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../../domain/entities/order.entity';

export class OrderQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página para paginación',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de órdenes por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(100, { message: 'El límite no puede exceder 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de la orden',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Estado de orden inválido' })
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
    maxLength: 36,
  })
  @IsOptional()
  @IsString()
  @MaxLength(36, { message: 'El ID de usuario no debe exceder 36 caracteres' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Monto mínimo total',
    example: 10000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto mínimo debe ser un número' })
  @Min(0, { message: 'El monto mínimo no puede ser negativo' })
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Monto máximo total',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto máximo debe ser un número' })
  @Min(0, { message: 'El monto máximo no puede ser negativo' })
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Ordenar por campo (createdAt, totalAmount, status)',
    example: 'createdAt',
    enum: ['createdAt', 'totalAmount', 'status', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'totalAmount' | 'status' | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
