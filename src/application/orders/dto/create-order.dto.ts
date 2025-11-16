import {
  IsArray,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  @IsNumber({}, { message: 'El ID del producto debe ser un número válido' })
  @Min(1, { message: 'El ID del producto debe ser mayor a 0' })
  productId: number;

  @ApiProperty({
    description: 'Cantidad del producto',
    example: 2,
    minimum: 1,
    maximum: 999,
  })
  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @IsNumber({}, { message: 'La cantidad debe ser un número válido' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Items del pedido',
    type: [CreateOrderItemDto],
    minItems: 1,
  })
  @IsArray({ message: 'Los items deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Dirección de entrega',
    example: 'Calle 123 #45-67, Bogotá, Colombia',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La dirección de entrega debe ser texto' })
  @MaxLength(500, {
    message: 'La dirección no debe exceder 500 caracteres',
  })
  deliveryAddress?: string;
}
