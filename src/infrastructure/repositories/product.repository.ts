import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository } from '../../application/products/interfaces/product-repository.interface';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from '../../application/products/dto';

/**
 * ProductRepository - Implementación concreta del Repository Pattern
 * Capa de Infraestructura (Clean Architecture)
 *
 * Responsabilidades:
 * - Implementar operaciones de persistencia específicas de TypeORM
 * - Manejar consultas SQL complejas de forma segura
 * - Abstraer detalles de la base de datos de la capa de aplicación
 * - Optimizar consultas con índices y joins
 */
@Injectable()
export class ProductRepository implements IProductRepository {
  private readonly logger = new Logger(ProductRepository.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Encuentra productos con filtros avanzados y paginación
   */
  async findWithFilters(query: ProductQueryDto): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.debug(
      `Ejecutando búsqueda con filtros: ${JSON.stringify(query)}`,
    );

    const queryBuilder = this.createBaseQueryBuilder();

    // Aplicar filtros
    this.applyFilters(queryBuilder, query);

    // Aplicar ordenamiento
    this.applySorting(queryBuilder, query);

    // Obtener total de registros antes de aplicar paginación
    const total = await queryBuilder.getCount();

    // Aplicar paginación
    const offset = (query.page - 1) * query.limit;
    queryBuilder.skip(offset).take(query.limit);

    // Ejecutar consulta
    const products = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / query.limit);

    return {
      products,
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
    };
  }

  /**
   * Encuentra todos los productos activos
   */
  async findAll(): Promise<Product[]> {
    this.logger.debug('Obteniendo todos los productos activos');

    return this.productRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Encuentra un producto por su ID
   */
  async findById(id: number): Promise<Product | null> {
    this.logger.debug(`Buscando producto por ID: ${id}`);

    return this.productRepository.findOne({
      where: { id },
    });
  }

  /**
   * Encuentra un producto por su slug
   */
  async findBySlug(slug: string): Promise<Product | null> {
    this.logger.debug(`Buscando producto por slug: ${slug}`);

    return this.productRepository.findOne({
      where: { slug },
    });
  }

  /**
   * Crea un nuevo producto
   */
  async create(createData: CreateProductDto): Promise<Product> {
    this.logger.debug(`Creando nuevo producto: ${createData.name}`);

    const product = this.productRepository.create(createData);
    return this.productRepository.save(product);
  }

  /**
   * Actualiza un producto existente
   */
  async update(
    id: number,
    updateData: UpdateProductDto,
  ): Promise<Product | null> {
    this.logger.debug(`Actualizando producto ${id} en DB`);

    const updateResult = await this.productRepository.update(
      { id },
      updateData,
    );

    if (updateResult.affected === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Soft delete de un producto
   */
  async softDelete(id: number): Promise<boolean> {
    this.logger.debug(`Realizando soft delete del producto ${id}`);

    const deleteResult = await this.productRepository.softDelete(id);
    return deleteResult.affected > 0;
  }

  /**
   * Actualiza el stock de un producto
   */
  async updateStock(id: number, quantity: number): Promise<Product | null> {
    this.logger.debug(`Actualizando stock del producto ${id}: ${quantity}`);

    // Usar transaction para asegurar consistencia
    return this.productRepository.manager.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id },
      });

      if (!product) {
        return null;
      }

      const newStock = product.stock + quantity;

      // Validar que el stock no sea negativo
      if (newStock < 0) {
        throw new Error('Stock insuficiente');
      }

      await manager.update(
        Product,
        { id },
        {
          stock: newStock,
        },
      );

      return manager.findOne(Product, { where: { id } });
    });
  }

  /**
   * Obtiene todas las categorías únicas
   */
  async getCategories(): Promise<string[]> {
    this.logger.debug('Obteniendo categorías únicas');

    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'category')
      .orderBy('product.category', 'ASC')
      .getRawMany();

    return result.map((row) => row.category).filter((category) => category);
  }

  /**
   * Obtiene productos por categoría
   */
  async findByCategory(category: string, limit?: number): Promise<Product[]> {
    this.logger.debug(`Obteniendo productos por categoría: ${category}`);

    const queryBuilder = this.createBaseQueryBuilder().where(
      'product.category = :category',
      { category },
    );

    if (limit) {
      queryBuilder.take(limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * Obtiene productos destacados
   */
  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    this.logger.debug(`Obteniendo productos destacados (límite: ${limit})`);

    const queryBuilder = this.createBaseQueryBuilder()
      .where('product.isFeatured = :featured', { featured: true })
      .orderBy('product.createdAt', 'DESC');

    if (limit) {
      queryBuilder.take(limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * Busca productos por término
   */
  async searchProducts(searchTerm: string, limit?: number): Promise<Product[]> {
    this.logger.debug(`Buscando productos: ${searchTerm}`);

    const queryBuilder = this.createBaseQueryBuilder()
      .where(
        'product.name ILIKE :search OR product.description ILIKE :search',
        { search: `%${searchTerm}%` },
      )
      .orderBy('product.name', 'ASC');

    if (limit) {
      queryBuilder.take(limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * Verifica existencia de slug excluyendo un ID
   */
  async existsBySlugExcluding(
    slug: string,
    excludeId: number,
  ): Promise<boolean> {
    this.logger.debug(`Verificando slug: ${slug}, excluyendo ID: ${excludeId}`);

    const product = await this.productRepository.findOne({
      where: { slug },
    });

    if (!product) {
      return false;
    }

    return product.id !== excludeId;
  }

  /**
   * Cuenta total de productos activos
   */
  async count(): Promise<number> {
    this.logger.debug('Contando productos activos');

    return this.productRepository.count({
      withDeleted: false,
    });
  }

  /**
   * Obtiene estadísticas de productos
   */
  async getStats(): Promise<{
    total: number;
    byCategory: { category: string; count: number }[];
    lowStock: number;
    outOfStock: number;
    featured: number;
  }> {
    this.logger.debug('Obteniendo estadísticas de productos');

    // Estadísticas básicas
    const [total, lowStock, outOfStock, featured] = await Promise.all([
      this.count(),
      this.productRepository.count({
        where: {
          stock: Between(1, 9),
        },
      }),
      this.productRepository.count({
        where: { stock: 0 },
      }),
      this.productRepository.count({
        where: { isFeatured: true },
      }),
    ]);

    // Estadísticas por categoría
    const categoryStats = await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    const byCategory = categoryStats.map((row) => ({
      category: row.category,
      count: parseInt(row.count),
    }));

    return {
      total,
      byCategory,
      lowStock,
      outOfStock,
      featured,
    };
  }

  /**
   * Crea un query builder base para productos
   */
  private createBaseQueryBuilder(): SelectQueryBuilder<Product> {
    return this.productRepository.createQueryBuilder('product');
  }

  /**
   * Aplica filtros al query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<Product>,
    query: ProductQueryDto,
  ): void {
    // Filtro de búsqueda
    if (query.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Filtro de categoría
    if (query.category) {
      queryBuilder.andWhere('product.category = :category', {
        category: query.category,
      });
    }

    // Filtro de rango de precios
    if (query.minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    // Filtro de productos destacados
    if (query.featured !== undefined) {
      queryBuilder.andWhere('product.isFeatured = :featured', {
        featured: query.featured,
      });
    }

    // Filtro de productos en stock
    if (query.inStock !== undefined) {
      if (query.inStock) {
        queryBuilder.andWhere('product.stock > 0');
      } else {
        queryBuilder.andWhere('product.stock = 0');
      }
    }
  }

  /**
   * Aplica ordenamiento al query builder
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<Product>,
    query: ProductQueryDto,
  ): void {
    const sortField = `product.${query.sortBy}`;
    queryBuilder.orderBy(sortField, query.sortOrder);
  }
}
