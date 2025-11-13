import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  // Todos los campos de CreateProductDto son opcionales para actualización
  // Se agregan validaciones específicas si es necesario

  @ApiPropertyOptional({
    description: 'Indica si el producto está activo/disponible',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  isActive?: boolean;
}
