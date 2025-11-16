import { ApiProperty } from '@nestjs/swagger';
import { OrderResponseDto } from './order-response.dto';

export class PaginatedOrderResponseDto {
  @ApiProperty({
    description: 'Lista de órdenes',
    type: [OrderResponseDto],
  })
  orders: OrderResponseDto[];

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
    status?: string;
    userId?: string;
    amountRange?: {
      min: number;
      max: number;
    };
  };

  constructor(
    orders: OrderResponseDto[],
    pagination: PaginatedOrderResponseDto['pagination'],
    filters?: PaginatedOrderResponseDto['filters'],
  ) {
    this.orders = orders;
    this.pagination = pagination;
    this.filters = filters;
  }
}
