import { Order } from '../../../domain/entities/order.entity';
import { OrderItem } from '../../../domain/entities/order-item.entity';
import { CreateOrderDto, UpdateOrderDto, OrderQueryDto } from '../dto';
import { OrderStatus } from '../../../domain/entities/order.entity';

/**
 * Abstracción del Repository Pattern para Orders (DIP - Dependency Inversion Principle)
 * Define el contrato para operaciones de persistencia de órdenes
 * Incluye capacidades avanzadas de búsqueda, filtrado, paginación y transacciones
 */
export interface IOrderRepository {
  /**
   * Encuentra órdenes con paginación y filtros avanzados
   * @param query Parámetros de búsqueda, filtros y paginación
   * @returns Promise con órdenes y metadatos de paginación
   */
  findWithFilters(query: OrderQueryDto): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Encuentra todas las órdenes activas (sin paginación)
   * @returns Promise<Order[]> Lista de órdenes activas
   */
  findAll(): Promise<Order[]>;

  /**
   * Encuentra una orden por su ID con items incluidos
   * @param id UUID de la orden
   * @returns Promise<Order | null> Orden encontrada o null
   */
  findById(id: string): Promise<Order | null>;

  /**
   * Encuentra órdenes de un usuario específico
   * @param userId UUID del usuario
   * @param limit Límite de órdenes a retornar
   * @returns Promise<Order[]> Órdenes del usuario
   */
  findByUserId(userId: string, limit?: number): Promise<Order[]>;

  /**
   * Crea una nueva orden con transacción atómica
   * @param userId UUID del usuario
   * @param createData Datos de la orden a crear
   * @returns Promise<Order> Orden creada con items incluidos
   */
  create(userId: string, createData: CreateOrderDto): Promise<Order>;

  /**
   * Actualiza una orden existente
   * @param id UUID de la orden
   * @param updateData Datos a actualizar
   * @returns Promise<Order | null> Orden actualizada o null si no existe
   */
  update(id: string, updateData: UpdateOrderDto): Promise<Order | null>;

  /**
   * Actualiza el estado de una orden
   * @param id UUID de la orden
   * @param status Nuevo estado
   * @returns Promise<Order | null> Orden actualizada
   */
  updateStatus(id: string, status: OrderStatus): Promise<Order | null>;

  /**
   * Soft delete de una orden (cancelar)
   * @param id UUID de la orden
   * @returns Promise<boolean> true si se canceló correctamente
   */
  cancel(id: string): Promise<boolean>;

  /**
   * Obtiene órdenes por estado
   * @param status Estado de las órdenes
   * @param limit Límite de órdenes a retornar
   * @returns Promise<Order[]> Órdenes con el estado especificado
   */
  findByStatus(status: OrderStatus, limit?: number): Promise<Order[]>;

  /**
   * Calcula el total de una orden basado en sus items
   * @param orderId UUID de la orden
   * @returns Promise<number> Total calculado
   */
  calculateOrderTotal(orderId: string): Promise<number>;

  /**
   * Verifica si una orden pertenece a un usuario
   * @param orderId UUID de la orden
   * @param userId UUID del usuario
   * @returns Promise<boolean> true si la orden pertenece al usuario
   */
  belongsToUser(orderId: string, userId: string): Promise<boolean>;

  /**
   * Obtiene estadísticas de órdenes
   * @returns Promise con estadísticas básicas
   */
  getStats(): Promise<{
    total: number;
    byStatus: { status: OrderStatus; count: number }[];
    totalRevenue: number;
    averageOrderValue: number;
    recentOrders: number; // últimas 24 horas
  }>;

  /**
   * Obtiene el historial de órdenes de un usuario con paginación
   * @param userId UUID del usuario
   * @param page Página a obtener
   * @param limit Items por página
   * @returns Promise con órdenes paginadas del usuario
   */
  findUserOrderHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Verifica disponibilidad de productos antes de crear orden
   * @param items Items a verificar
   * @returns Promise<{ productId: number; available: number }[]> Stock disponible por producto
   */
  checkProductsAvailability(
    items: { productId: number; quantity: number }[],
  ): Promise<{ productId: number; available: number; requested: number }[]>;

  /**
   * Reduce el stock de productos después de confirmar orden
   * @param items Items cuyo stock debe reducirse
   * @returns Promise<boolean> true si se redujo correctamente
   */
  reduceProductsStock(
    items: { productId: number; quantity: number }[],
  ): Promise<boolean>;
}
