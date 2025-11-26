import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { Order, OrderStatus } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { Product } from '../../domain/entities/product.entity';
import { User } from '../../domain/entities/user.entity';
import { IOrderRepository } from '../../application/orders/interfaces/order-repository.interface';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderDto,
} from '../../application/orders/dto';

/**
 * OrderRepository - Implementación concreta del Repository Pattern
 * Capa de Infraestructura (Clean Architecture)
 *
 * Responsabilidades:
 * - Implementar operaciones de persistencia específicas de TypeORM
 * - Manejar consultas SQL complejas de forma segura
 * - Abstraer detalles de la base de datos de la capa de aplicación
 * - Optimizar consultas con índices y joins
 * - Manejar transacciones atómicas para órdenes
 */
@Injectable()
export class OrderRepository implements IOrderRepository {
  private readonly logger = new Logger(OrderRepository.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Encuentra órdenes con filtros avanzados y paginación
   */
  async findWithFilters(query: OrderQueryDto): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.debug(
      `Ejecutando búsqueda de órdenes con filtros: ${JSON.stringify(query)}`,
    );

    const queryBuilder = this.createBaseOrderQueryBuilder();

    // Aplicar filtros
    this.applyFilters(queryBuilder, query);

    // Aplicar ordenamiento
    this.applySorting(queryBuilder, query);

    // Obtener total de registros antes de aplicar paginación
    const total = await queryBuilder.getCount();

    // Aplicar paginación
    const offset = (query.page - 1) * query.limit;
    queryBuilder.skip(offset).take(query.limit);

    // Ejecutar consulta con relaciones
    const orders = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / query.limit);

    return {
      orders,
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
    };
  }

  /**
   * Encuentra todas las órdenes activas
   */
  async findAll(): Promise<Order[]> {
    this.logger.debug('Obteniendo todas las órdenes activas');

    return this.orderRepository.find({
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Encuentra una orden por su ID con todas las relaciones
   */
  async findById(id: string): Promise<Order | null> {
    this.logger.debug(`Buscando orden por ID: ${id}`);

    return this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });
  }

  /**
   * Encuentra órdenes de un usuario específico
   */
  async findByUserId(userId: string, limit?: number): Promise<Order[]> {
    this.logger.debug(`Obteniendo órdenes del usuario: ${userId}`);

    const queryBuilder = this.createBaseOrderQueryBuilder().where(
      'order.userId = :userId',
      { userId },
    );

    if (limit) {
      queryBuilder.take(limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * Crea una nueva orden con transacción atómica
   */
  async create(userId: string, createData: CreateOrderDto): Promise<Order> {
    this.logger.debug(`Creando nueva orden para usuario: ${userId}`);

    return this.dataSource.transaction(async (manager) => {
      // 1. Verificar que el usuario existe
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // 2. Obtener productos y verificar existencia/stock
      const productIds = createData.items.map((item) => item.productId);
      const products = await manager.find(Product, {
        where: productIds.map((id) => ({ id })),
      });

      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p.id);
        const missingIds = productIds.filter((id) => !foundIds.includes(id));
        throw new Error(`Productos no encontrados: ${missingIds.join(', ')}`);
      }

      // 3. Verificar stock y calcular total
      let totalAmount = 0;
      const itemsWithPrices: Array<{
        productId: number;
        quantity: number;
        price: number;
        product: Product;
      }> = [];

      for (const item of createData.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Producto ${item.productId} no encontrado`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para producto ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`,
          );
        }

        itemsWithPrices.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          product,
        });

        totalAmount += product.price * item.quantity;
      }

      // 4. Crear la orden
      const order = manager.create(Order, {
        userId: userId,
        user: user,
        totalAmount,
        status: OrderStatus.PENDING,
        deliveryAddress: createData.deliveryAddress || null,
      });

      const savedOrder = await manager.save(order);

      // 5. Crear los items de la orden y reducir stock
      const orderItems: OrderItem[] = [];
      for (const itemData of itemsWithPrices) {
        const orderItem = manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: itemData.productId,
          quantity: itemData.quantity,
          priceAtPurchase: itemData.price,
        });

        const savedItem = await manager.save(orderItem);
        orderItems.push(savedItem);

        // Reducir stock del producto
        await manager.update(
          Product,
          { id: itemData.productId },
          { stock: () => `stock - ${itemData.quantity}` },
        );
      }

      // 6. Retornar orden completa con relaciones
      return manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['user', 'items', 'items.product'],
      });
    });
  }

  /**
   * Actualiza una orden existente
   */
  async update(id: string, updateData: UpdateOrderDto): Promise<Order | null> {
    this.logger.debug(`Actualizando orden ${id} en DB`);

    const updateResult = await this.orderRepository.update({ id }, updateData);

    if (updateResult.affected === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Actualiza el estado de una orden
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    this.logger.debug(`Actualizando estado de orden ${id} a: ${status}`);

    const updateResult = await this.orderRepository.update(
      { id },
      { status, updatedAt: new Date() },
    );

    if (updateResult.affected === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Soft delete de una orden (cancelar)
   */
  async cancel(id: string): Promise<boolean> {
    this.logger.debug(`Cancelando orden ${id}`);

    const deleteResult = await this.orderRepository.softDelete(id);
    return deleteResult.affected > 0;
  }

  /**
   * Obtiene órdenes por estado
   */
  async findByStatus(status: OrderStatus, limit?: number): Promise<Order[]> {
    this.logger.debug(`Obteniendo órdenes con estado: ${status}`);

    const queryBuilder = this.createBaseOrderQueryBuilder().where(
      'order.status = :status',
      { status },
    );

    if (limit) {
      queryBuilder.take(limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * Calcula el total de una orden basado en sus items
   */
  async calculateOrderTotal(orderId: string): Promise<number> {
    this.logger.debug(`Calculando total de orden: ${orderId}`);

    const result = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.priceAtPurchase * item.quantity)', 'total')
      .where('item.orderId = :orderId', { orderId })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  /**
   * Verifica si una orden pertenece a un usuario
   */
  async belongsToUser(orderId: string, userId: string): Promise<boolean> {
    this.logger.debug(
      `Verificando si orden ${orderId} pertenece a usuario ${userId}`,
    );

    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      select: ['id'],
    });

    return !!order;
  }

  /**
   * Obtiene estadísticas de órdenes
   */
  async getStats(): Promise<{
    total: number;
    byStatus: { status: OrderStatus; count: number }[];
    totalRevenue: number;
    averageOrderValue: number;
    recentOrders: number;
  }> {
    this.logger.debug('Obteniendo estadísticas de órdenes');

    // Estadísticas básicas
    const [total, totalRevenue, recentOrders] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
        .getRawOne()
        .then((result) => parseFloat(result.total)),
      this.orderRepository
        .createQueryBuilder('order')
        .where('order.createdAt >= :since', {
          since: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .getCount(),
    ]);

    // Estadísticas por estado
    const statusStats = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const byStatus = statusStats.map((row) => ({
      status: row.status as OrderStatus,
      count: parseInt(row.count),
    }));

    const averageOrderValue = total > 0 ? totalRevenue / total : 0;

    return {
      total,
      byStatus,
      totalRevenue,
      averageOrderValue,
      recentOrders,
    };
  }

  /**
   * Obtiene el historial de órdenes de un usuario con paginación
   */
  async findUserOrderHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.debug(
      `Obteniendo historial de usuario ${userId}, página ${page}`,
    );

    const queryBuilder = this.createBaseOrderQueryBuilder()
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC');

    // Obtener total
    const total = await queryBuilder.getCount();

    // Aplicar paginación
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const orders = await queryBuilder.getMany();
    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Verifica disponibilidad de productos antes de crear orden
   */
  async checkProductsAvailability(
    items: { productId: number; quantity: number }[],
  ): Promise<{ productId: number; available: number; requested: number }[]> {
    this.logger.debug('Verificando disponibilidad de productos');

    const productIds = items.map((item) => item.productId);
    const products = await this.productRepository.find({
      where: productIds.map((id) => ({ id })),
      select: ['id', 'stock'],
    });

    return items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        available: product?.stock || 0,
        requested: item.quantity,
      };
    });
  }

  /**
   * Reduce el stock de productos después de confirmar orden
   */
  async reduceProductsStock(
    items: { productId: number; quantity: number }[],
  ): Promise<boolean> {
    this.logger.debug('Reduciendo stock de productos');

    try {
      await this.dataSource.transaction(async (manager) => {
        for (const item of items) {
          await manager.update(
            Product,
            { id: item.productId },
            { stock: () => `stock - ${item.quantity}` },
          );
        }
      });
      return true;
    } catch (error) {
      this.logger.error('Error al reducir stock:', error);
      return false;
    }
  }

  /**
   * Crea un query builder base para órdenes con relaciones
   */
  private createBaseOrderQueryBuilder(): SelectQueryBuilder<Order> {
    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');
  }

  /**
   * Aplica filtros al query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<Order>,
    query: OrderQueryDto,
  ): void {
    // Filtro por estado
    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    // Filtro por usuario
    if (query.userId) {
      queryBuilder.andWhere('order.userId = :userId', { userId: query.userId });
    }

    // Filtro por rango de montos
    if (query.minAmount) {
      queryBuilder.andWhere('order.totalAmount >= :minAmount', {
        minAmount: query.minAmount,
      });
    }

    if (query.maxAmount) {
      queryBuilder.andWhere('order.totalAmount <= :maxAmount', {
        maxAmount: query.maxAmount,
      });
    }
  }

  /**
   * Aplica ordenamiento al query builder
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<Order>,
    query: OrderQueryDto,
  ): void {
    const sortField = `order.${query.sortBy}`;
    queryBuilder.orderBy(sortField, query.sortOrder);
  }
}
