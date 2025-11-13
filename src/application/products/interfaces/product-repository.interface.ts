import { Product } from '../../../domain/entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from '../dto';

/**
 * Abstracción del Repository Pattern para Products (DIP - Dependency Inversion Principle)
 * Define el contrato para operaciones de persistencia de productos
 * Incluye capacidades avanzadas de búsqueda, filtrado y paginación
 */
export interface IProductRepository {
  /**
   * Encuentra productos con paginación y filtros avanzados
   * @param query Parámetros de búsqueda, filtros y paginación
   * @returns Promise con productos y metadatos de paginación
   */
  findWithFilters(query: ProductQueryDto): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Encuentra todos los productos activos (sin paginación)
   * @returns Promise<Product[]> Lista de productos activos
   */
  findAll(): Promise<Product[]>;

  /**
   * Encuentra un producto por su ID
   * @param id ID numérico del producto
   * @returns Promise<Product | null> Producto encontrado o null
   */
  findById(id: number): Promise<Product | null>;

  /**
   * Encuentra un producto por su slug único
   * @param slug Slug del producto
   * @returns Promise<Product | null> Producto encontrado o null
   */
  findBySlug(slug: string): Promise<Product | null>;

  /**
   * Crea un nuevo producto
   * @param createData Datos del producto a crear
   * @returns Promise<Product> Producto creado
   */
  create(createData: CreateProductDto): Promise<Product>;

  /**
   * Actualiza un producto existente
   * @param id ID numérico del producto
   * @param updateData Datos a actualizar
   * @returns Promise<Product | null> Producto actualizado o null si no existe
   */
  update(id: number, updateData: UpdateProductDto): Promise<Product | null>;

  /**
   * Soft delete de un producto
   * @param id ID numérico del producto
   * @returns Promise<boolean> true si se eliminó correctamente
   */
  softDelete(id: number): Promise<boolean>;

  /**
   * Actualiza el stock de un producto
   * @param id ID numérico del producto
   * @param quantity Cantidad a agregar (positiva) o quitar (negativa)
   * @returns Promise<Product | null> Producto con stock actualizado
   */
  updateStock(id: number, quantity: number): Promise<Product | null>;

  /**
   * Obtiene todas las categorías únicas de productos
   * @returns Promise<string[]> Lista de categorías
   */
  getCategories(): Promise<string[]>;

  /**
   * Obtiene productos por categoría
   * @param category Nombre de la categoría
   * @param limit Límite de productos a retornar
   * @returns Promise<Product[]> Productos de la categoría
   */
  findByCategory(category: string, limit?: number): Promise<Product[]>;

  /**
   * Obtiene productos destacados
   * @param limit Límite de productos a retornar
   * @returns Promise<Product[]> Productos destacados
   */
  getFeaturedProducts(limit?: number): Promise<Product[]>;

  /**
   * Busca productos por término de búsqueda
   * @param searchTerm Término a buscar en nombre y descripción
   * @param limit Límite de productos a retornar
   * @returns Promise<Product[]> Productos que coinciden con la búsqueda
   */
  searchProducts(searchTerm: string, limit?: number): Promise<Product[]>;

  /**
   * Verifica si existe un producto con un slug específico (excluyendo un ID)
   * Útil para validar unicidad de slug en updates
   * @param slug Slug a verificar
   * @param excludeId ID a excluir de la búsqueda
   * @returns Promise<boolean> true si existe otro producto con ese slug
   */
  existsBySlugExcluding(slug: string, excludeId: number): Promise<boolean>;

  /**
   * Cuenta el total de productos activos
   * @returns Promise<number> Número total de productos
   */
  count(): Promise<number>;

  /**
   * Obtiene estadísticas de productos
   * @returns Promise con estadísticas básicas
   */
  getStats(): Promise<{
    total: number;
    byCategory: { category: string; count: number }[];
    lowStock: number; // productos con stock < 10
    outOfStock: number;
    featured: number;
  }>;
}
