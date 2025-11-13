import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from './product-response.dto';

export class PaginatedProductResponseDto {
  @ApiProperty({
    description: 'Lista de productos',
    type: [ProductResponseDto],
  })
  products: ProductResponseDto[];

  @ApiProperty({
    description: 'Información de paginación',
    example: {
      page: 1,
      limit: 10,
      total: 150,
      totalPages: 15,
      hasNextPage: true,
      hasPrevPage: false,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };

  @ApiProperty({
    description: 'Filtros aplicados',
    required: false,
  })
  filters?: {
    search?: string;
    category?: string;
    priceRange?: {
      min: number;
      max: number;
    };
    featured?: boolean;
    inStock?: boolean;
  };

  constructor(
    products: ProductResponseDto[],
    pagination: PaginatedProductResponseDto['pagination'],
    filters?: PaginatedProductResponseDto['filters'],
  ) {
    this.products = products;
    this.pagination = pagination;
    this.filters = filters;
  }
}
