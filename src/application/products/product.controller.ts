import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Put,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  ProductQueryDto,
  PaginatedProductResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user.entity';

/**
 * ProductController - Gestión de productos para e-commerce
 *
 * Implementa:
 * - CRUD completo de productos
 * - Filtrado avanzado y paginación
 * - Búsqueda textual
 * - Control de stock
 * - RBAC (Role-Based Access Control)
 * - Seguridad OWASP A03 (Injection Prevention)
 */
@ApiTags('Productos')
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  /**
   * Crear nuevo producto (Solo Admin)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear producto',
    description: 'Crear un nuevo producto. Solo accesible por administradores.',
  })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requieren permisos de administrador',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - El slug del producto ya existe',
  })
  async create(
    @Body(ValidationPipe) createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    this.logger.log(`Creando producto: ${createProductDto.name}`);
    return this.productService.create(createProductDto);
  }

  /**
   * Obtener productos con filtros y paginación (PÚBLICO)
   */
  @Get()
  @ApiOperation({
    summary: 'Listar productos',
    description:
      'Obtener productos con filtros opcionales, paginación y búsqueda.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items por página (default: 10)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filtrar por categoría',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Búsqueda en nombre y descripción',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Precio mínimo',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Precio máximo',
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    type: Boolean,
    description: 'Solo productos en stock',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    type: Boolean,
    description: 'Solo productos destacados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos con paginación',
    type: PaginatedProductResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async findAll(
    @Query(ValidationPipe) query: ProductQueryDto,
  ): Promise<PaginatedProductResponseDto> {
    this.logger.log(`Buscando productos con filtros: ${JSON.stringify(query)}`);
    return this.productService.findWithFilters(query);
  }

  /**
   * Obtener categorías disponibles (PÚBLICO)
   */
  @Get('categories')
  @ApiOperation({
    summary: 'Obtener categorías',
    description: 'Listar todas las categorías de productos disponibles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías',
    schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getCategories(): Promise<{ categories: string[] }> {
    this.logger.log('Obteniendo categorías de productos');
    const categories = await this.productService.getCategories();
    return { categories };
  }

  /**
   * Obtener estadísticas de productos (Solo Admin)
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Estadísticas de productos',
    description:
      'Obtener estadísticas detalladas de productos. Solo accesible por administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de productos',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        byCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        lowStock: { type: 'number' },
        outOfStock: { type: 'number' },
        featured: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requieren permisos de administrador',
  })
  async getStats() {
    this.logger.log('Obteniendo estadísticas de productos');
    return this.productService.getStats();
  }

  /**
   * Buscar productos destacados (PÚBLICO)
   */
  @Get('featured')
  @ApiOperation({
    summary: 'Productos destacados',
    description: 'Obtener productos marcados como destacados.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de productos (default: 6)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos destacados',
    type: [ProductResponseDto],
  })
  async getFeatured(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ProductResponseDto[]> {
    this.logger.log(`Obteniendo productos destacados (limit: ${limit || 6})`);
    return this.productService.getFeaturedProducts(limit);
  }

  /**
   * Obtener producto por slug (PÚBLICO)
   */
  @Get(':slug')
  @ApiOperation({
    summary: 'Obtener producto por slug',
    description: 'Obtener un producto específico por su slug (URL amigable).',
  })
  @ApiParam({
    name: 'slug',
    type: 'string',
    description: 'Slug del producto (ej: iphone-15-pro)',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  async findBySlug(@Param('slug') slug: string): Promise<ProductResponseDto> {
    this.logger.log(`Buscando producto con slug: ${slug}`);
    return this.productService.findBySlug(slug);
  }

  /**
   * Obtener producto por ID (PÚBLICO)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener producto',
    description: 'Obtener un producto específico por su ID.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID del producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de producto inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    this.logger.log(`Buscando producto con ID: ${id}`);
    return this.productService.findOne(id);
  }

  /**
   * Actualizar producto (Solo Admin)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar producto',
    description:
      'Actualizar un producto existente. Solo accesible por administradores.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID del producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o ID de producto inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requieren permisos de administrador',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - El slug del producto ya existe',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    this.logger.log(
      `Actualizando producto ${id}: ${JSON.stringify(updateProductDto)}`,
    );
    return this.productService.update(id, updateProductDto);
  }

  /**
   * Actualizar stock de producto (Solo Admin)
   */
  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar stock',
    description:
      'Actualizar el stock de un producto. Solo accesible por administradores.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID del producto' })
  @ApiResponse({
    status: 200,
    description: 'Stock actualizado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de producto inválido o cantidad inválida',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requieren permisos de administrador',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  @ApiResponse({
    status: 422,
    description: 'Stock insuficiente',
  })
  async updateStock(
    @Param('id') id: string,
    @Body('quantity', ParseIntPipe) quantity: number,
  ): Promise<ProductResponseDto> {
    this.logger.log(`Actualizando stock del producto ${id}: ${quantity}`);
    return this.productService.updateStock(id, quantity);
  }

  /**
   * Eliminar producto (Solo Admin)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar producto',
    description:
      'Eliminar un producto (soft delete). Solo accesible por administradores.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID del producto' })
  @ApiResponse({
    status: 204,
    description: 'Producto eliminado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'ID de producto inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requieren permisos de administrador',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Eliminando producto con ID: ${id}`);
    await this.productService.remove(id);
  }
}
