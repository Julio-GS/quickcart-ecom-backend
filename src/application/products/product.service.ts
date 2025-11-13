import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { IProductRepository } from './interfaces/product-repository.interface';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  ProductQueryDto,
  PaginatedProductResponseDto,
} from './dto';
import { Product } from '../../domain/entities/product.entity';

/**
 * ProductService - Capa de Aplicación (Clean Architecture)
 *
 * Responsabilidades (SRP - Single Responsibility Principle):
 * - Orquestar la lógica de negocio de productos
 * - Validar reglas de negocio específicas (precios, stock, categorías)
 * - Transformar datos entre capas (DTOs <-> Entities)
 * - Manejar búsquedas complejas y paginación
 *
 * Depende de abstracciones (DIP - Dependency Inversion Principle):
 * - IProductRepository en lugar de implementación concreta
 */
@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  /**
   * Obtiene productos con filtros, búsqueda y paginación
   * @param query Parámetros de consulta
   * @returns Promise<PaginatedProductResponseDto> Productos paginados
   */
  async findWithFilters(
    query: ProductQueryDto,
  ): Promise<PaginatedProductResponseDto> {
    this.logger.log(`Buscando productos con filtros: ${JSON.stringify(query)}`);

    // Validar rango de precios
    if (query.minPrice && query.maxPrice && query.minPrice > query.maxPrice) {
      throw new BadRequestException(
        'El precio mínimo no puede ser mayor al precio máximo',
      );
    }

    const result = await this.productRepository.findWithFilters(query);

    // Transformar products a DTOs
    const products = result.products.map((product) =>
      plainToClass(
        ProductResponseDto,
        {
          ...product,
          priceInCents: product.price,
        },
        {
          excludeExtraneousValues: true,
        },
      ),
    );

    // Calcular información de paginación
    const pagination = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
    };

    // Preparar filtros aplicados
    const filters: any = {};
    if (query.search) filters.search = query.search;
    if (query.category) filters.category = query.category;
    if (query.minPrice || query.maxPrice) {
      filters.priceRange = {
        min: query.minPrice,
        max: query.maxPrice,
      };
    }
    if (query.featured !== undefined) filters.isFeatured = query.featured;
    if (query.inStock !== undefined) filters.inStock = query.inStock;

    return new PaginatedProductResponseDto(products, pagination, filters);
  }

  /**
   * Obtiene todos los productos (sin paginación)
   * @returns Promise<ProductResponseDto[]> Lista de productos
   */
  async findAll(): Promise<ProductResponseDto[]> {
    this.logger.log('Obteniendo todos los productos');

    const products = await this.productRepository.findAll();

    return products.map((product) =>
      plainToClass(
        ProductResponseDto,
        {
          ...product,
          priceInCents: product.price,
        },
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }

  /**
   * Obtiene un producto por su ID
   * @param id UUID del producto
   * @returns Promise<ProductResponseDto> Producto encontrado
   * @throws NotFoundException si el producto no existe
   */
  async findOne(id: string): Promise<ProductResponseDto> {
    this.logger.log(`Buscando producto con ID: ${id}`);

    // Validación de formato ID
    if (!this.isValidId(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productRepository.findById(parseInt(id));

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return plainToClass(
      ProductResponseDto,
      {
        ...product,
        priceInCents: product.price,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Obtiene un producto por su slug
   * @param slug Slug del producto
   * @returns Promise<ProductResponseDto> Producto encontrado
   * @throws NotFoundException si el producto no existe
   */
  async findBySlug(slug: string): Promise<ProductResponseDto> {
    this.logger.log(`Buscando producto con slug: ${slug}`);

    if (!slug || slug.trim() === '') {
      throw new BadRequestException('Slug de producto inválido');
    }

    const product = await this.productRepository.findBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Producto con slug "${slug}" no encontrado`);
    }

    return plainToClass(
      ProductResponseDto,
      {
        ...product,
        priceInCents: product.price,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Crea un nuevo producto
   * @param createProductDto Datos del producto a crear
   * @returns Promise<ProductResponseDto> Producto creado
   * @throws ConflictException si el slug ya existe
   */
  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    this.logger.log(`Creando producto: ${createProductDto.name}`);

    // Validar unicidad del slug
    const existingProduct = await this.productRepository.findBySlug(
      createProductDto.slug,
    );
    if (existingProduct) {
      throw new ConflictException(
        `El slug "${createProductDto.slug}" ya está en uso`,
      );
    }

    // Validaciones de negocio adicionales
    this.validateBusinessRules(createProductDto);

    const product = await this.productRepository.create(createProductDto);

    this.logger.log(`Producto creado exitosamente: ${product.id}`);

    return plainToClass(
      ProductResponseDto,
      {
        ...product,
        priceInCents: product.price,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Actualiza un producto existente
   * @param id UUID del producto
   * @param updateProductDto Datos a actualizar
   * @returns Promise<ProductResponseDto> Producto actualizado
   * @throws NotFoundException si el producto no existe
   * @throws ConflictException si el slug ya está en uso
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    this.logger.log(`Actualizando producto con ID: ${id}`);

    // Validación de formato ID
    if (!this.isValidId(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    // Verificar que el producto existe
    const existingProduct = await this.productRepository.findById(parseInt(id));
    if (!existingProduct) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Validar unicidad de slug si se está actualizando
    if (
      updateProductDto.slug &&
      updateProductDto.slug !== existingProduct.slug
    ) {
      const slugExists = await this.productRepository.existsBySlugExcluding(
        updateProductDto.slug,
        parseInt(id),
      );

      if (slugExists) {
        throw new ConflictException('El slug ya está en uso por otro producto');
      }
    }

    // Validaciones de negocio
    if (Object.keys(updateProductDto).length > 0) {
      this.validateBusinessRules(updateProductDto);
    }

    // Realizar la actualización
    const updatedProduct = await this.productRepository.update(
      parseInt(id),
      updateProductDto,
    );

    if (!updatedProduct) {
      throw new NotFoundException(`Error al actualizar producto con ID ${id}`);
    }

    this.logger.log(`Producto ${id} actualizado exitosamente`);

    return plainToClass(
      ProductResponseDto,
      {
        ...updatedProduct,
        priceInCents: updatedProduct.price,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Elimina (soft delete) un producto
   * @param id ID del producto
   * @returns Promise<void>
   * @throws NotFoundException si el producto no existe
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Eliminando producto con ID: ${id}`);

    // Validación de formato ID
    if (!this.isValidId(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    // Verificar que el producto existe antes de eliminar
    const product = await this.productRepository.findById(parseInt(id));
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    const deleted = await this.productRepository.softDelete(parseInt(id));

    if (!deleted) {
      throw new BadRequestException(`Error al eliminar producto con ID ${id}`);
    }

    this.logger.log(`Producto ${id} eliminado exitosamente`);
  }

  /**
   * Obtiene todas las categorías disponibles
   * @returns Promise<string[]> Lista de categorías únicas
   */
  async getCategories(): Promise<string[]> {
    this.logger.log('Obteniendo categorías de productos');
    return this.productRepository.getCategories();
  }

  /**
   * Obtiene productos destacados
   * @param limit Límite de productos a retornar (por defecto 10)
   * @returns Promise<ProductResponseDto[]> Productos destacados
   */
  async getFeaturedProducts(limit: number = 10): Promise<ProductResponseDto[]> {
    this.logger.log(`Obteniendo productos destacados (límite: ${limit})`);

    if (limit <= 0 || limit > 100) {
      throw new BadRequestException('El límite debe estar entre 1 y 100');
    }

    const products = await this.productRepository.getFeaturedProducts(limit);

    return products.map((product) =>
      plainToClass(
        ProductResponseDto,
        {
          ...product,
          priceInCents: product.price,
        },
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }

  /**
   * Actualiza el stock de un producto
   * @param id ID del producto
   * @param quantity Cantidad a agregar (positiva) o quitar (negativa)
   * @returns Promise<ProductResponseDto> Producto con stock actualizado
   */
  async updateStock(id: string, quantity: number): Promise<ProductResponseDto> {
    this.logger.log(`Actualizando stock del producto ${id}: ${quantity}`);

    if (!this.isValidId(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    if (isNaN(quantity)) {
      throw new BadRequestException('La cantidad debe ser un número válido');
    }

    const updatedProduct = await this.productRepository.updateStock(
      parseInt(id),
      quantity,
    );

    if (!updatedProduct) {
      throw new NotFoundException(
        `Error al actualizar stock del producto con ID ${id}`,
      );
    }

    return plainToClass(
      ProductResponseDto,
      {
        ...updatedProduct,
        priceInCents: updatedProduct.price,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Obtiene estadísticas de productos
   * @returns Promise con estadísticas detalladas
   */
  async getStats() {
    this.logger.log('Obteniendo estadísticas de productos');
    return this.productRepository.getStats();
  }

  /**
   * Valida reglas de negocio para productos
   * @param productData Datos del producto a validar
   * @throws BadRequestException si alguna regla de negocio se viola
   */
  private validateBusinessRules(
    productData: Partial<CreateProductDto | UpdateProductDto>,
  ): void {
    // Validar precio mínimo
    if (productData.price !== undefined && productData.price < 1) {
      throw new BadRequestException('El precio debe ser mayor a $0.00');
    }

    // Validar stock no negativo
    if (productData.stock !== undefined && productData.stock < 0) {
      throw new BadRequestException('El stock no puede ser negativo');
    }

    // Validar categoría no vacía
    if (
      productData.category !== undefined &&
      productData.category.trim() === ''
    ) {
      throw new BadRequestException('La categoría no puede estar vacía');
    }

    // Validar que el nombre no esté vacío
    if (productData.name !== undefined && productData.name.trim() === '') {
      throw new BadRequestException(
        'El nombre del producto no puede estar vacío',
      );
    }
  }

  /**
   * Valida si un string es un ID numérico válido
   * @param id String a validar
   * @returns boolean true si es válido
   */
  private isValidId(id: string): boolean {
    const numericId = parseInt(id);
    return !isNaN(numericId) && numericId > 0;
  }
}
