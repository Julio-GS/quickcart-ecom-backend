import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductQueryDto {
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
    description: 'Cantidad de productos por página',
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
    description: 'Término de búsqueda (busca en nombre y descripción)',
    example: 'iPhone',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'La búsqueda no debe exceder 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría específica',
    example: 'ELECTRONICOS',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La categoría no debe exceder 100 caracteres' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  category?: string;

  @ApiPropertyOptional({
    description: 'Precio mínimo en centavos',
    example: 10000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio mínimo debe ser un número' })
  @Min(0, { message: 'El precio mínimo no puede ser negativo' })
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Precio máximo en centavos',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio máximo debe ser un número' })
  @Min(0, { message: 'El precio máximo no puede ser negativo' })
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Mostrar solo productos destacados',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'El filtro destacado debe ser verdadero o falso' })
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Mostrar solo productos en stock',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'El filtro en stock debe ser verdadero o falso' })
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Ordenar por campo (name, price, createdAt, stock)',
    example: 'name',
    enum: ['name', 'price', 'createdAt', 'stock', 'category'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock' | 'category' = 'createdAt';

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
