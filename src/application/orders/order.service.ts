import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { IOrderRepository } from './interfaces/order-repository.interface';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderResponseDto,
  OrderQueryDto,
  PaginatedOrderResponseDto,
  OrderItemResponseDto,
} from './dto';
import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/entities/order.entity';
import { UserRole } from '../../domain/entities/user.entity';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}
  async findWithFilters(
    query: OrderQueryDto,
    userRole: UserRole,
    currentUserId?: string,
  ): Promise<PaginatedOrderResponseDto> {
    // Validar rango de montos
    if (
      query.minAmount &&
      query.maxAmount &&
      query.minAmount > query.maxAmount
    ) {
      throw new BadRequestException(
        'El monto mínimo no puede ser mayor al monto máximo',
      );
    }

    // Aplicar filtro de usuario si es CLIENT
    if (userRole === UserRole.CLIENT) {
      if (!currentUserId) {
        throw new BadRequestException('ID de usuario requerido para clientes');
      }
      query.userId = currentUserId;
    }

    const result = await this.orderRepository.findWithFilters(query);

    // Transformar órdenes a DTOs
    const orders = result.orders.map((order) =>
      this.mapToOrderResponseDto(order),
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
    if (query.status) filters.status = query.status;
    if (query.userId) filters.userId = query.userId;
    if (query.minAmount || query.maxAmount) {
      filters.amountRange = {
        min: query.minAmount,
        max: query.maxAmount,
      };
    }

    return new PaginatedOrderResponseDto(orders, pagination, filters);
  }

  /**
   * Obtiene una orden por su ID
   * @param id UUID de la orden
   * @param userRole Rol del usuario
   * @param currentUserId ID del usuario actual
   * @returns Promise<OrderResponseDto> Orden encontrada
   * @throws NotFoundException si la orden no existe
   * @throws ForbiddenException si el cliente intenta acceder a orden ajena
   */
  async findOne(
    id: string,
    userRole: UserRole,
    currentUserId?: string,
  ): Promise<OrderResponseDto> {
    this.logger.log(`Buscando orden con ID: ${id}`);

    if (!this.isValidUUID(id)) {
      throw new BadRequestException('ID de orden inválido');
    }

    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    // Verificar autorización para clientes
    if (userRole === UserRole.CLIENT) {
      if (!currentUserId || order.userId !== currentUserId) {
        throw new ForbiddenException('No tienes permisos para ver esta orden');
      }
    }

    return this.mapToOrderResponseDto(order);
  }

  /**
   * Crea una nueva orden
   * @param userId UUID del usuario que crea la orden
   * @param createOrderDto Datos de la orden a crear
   * @returns Promise<OrderResponseDto> Orden creada
   * @throws BadRequestException si los datos son inválidos
   * @throws UnprocessableEntityException si no hay stock suficiente
   */
  async create(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    this.logger.log(`Creando orden para usuario: ${userId}`);

    // Validaciones de negocio
    this.validateCreateOrderData(createOrderDto);

    // Verificar disponibilidad de productos
    const availability = await this.orderRepository.checkProductsAvailability(
      createOrderDto.items,
    );

    // Verificar que todos los productos tengan stock suficiente
    const insufficientStock = availability.filter(
      (item) => item.available < item.requested,
    );

    if (insufficientStock.length > 0) {
      const stockErrors = insufficientStock
        .map(
          (item) =>
            `Producto ${item.productId}: disponible ${item.available}, solicitado ${item.requested}`,
        )
        .join('; ');

      throw new UnprocessableEntityException(
        `Stock insuficiente para los siguientes productos: ${stockErrors}`,
      );
    }

    // Crear la orden (incluye reducir stock automáticamente)
    const order = await this.orderRepository.create(userId, createOrderDto);

    this.logger.log(`Orden creada exitosamente: ${order.id}`);

    return this.mapToOrderResponseDto(order);
  }

  /**
   * Actualiza una orden existente
   * @param id UUID de la orden
   * @param updateOrderDto Datos a actualizar
   * @param userRole Rol del usuario
   * @param currentUserId ID del usuario actual
   * @returns Promise<OrderResponseDto> Orden actualizada
   */
  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
    userRole: UserRole,
    currentUserId?: string,
  ): Promise<OrderResponseDto> {
    this.logger.log(`Actualizando orden con ID: ${id}`);

    if (!this.isValidUUID(id)) {
      throw new BadRequestException('ID de orden inválido');
    }

    // Verificar que la orden existe
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    // Verificar autorización
    if (userRole === UserRole.CLIENT) {
      if (!currentUserId || existingOrder.userId !== currentUserId) {
        throw new ForbiddenException(
          'No tienes permisos para modificar esta orden',
        );
      }

      // Los clientes solo pueden editar órdenes PENDING
      if (existingOrder.status !== OrderStatus.PENDING) {
        throw new ConflictException(
          'Solo se pueden modificar órdenes en estado PENDING',
        );
      }
    }

    // Validar transición de estado si se está actualizando
    if (updateOrderDto.status) {
      this.validateStatusTransition(
        existingOrder.status,
        updateOrderDto.status,
      );
    }

    // Realizar la actualización
    const updatedOrder = await this.orderRepository.update(id, updateOrderDto);

    if (!updatedOrder) {
      throw new NotFoundException(`Error al actualizar orden con ID ${id}`);
    }

    this.logger.log(`Orden ${id} actualizada exitosamente`);

    return this.mapToOrderResponseDto(updatedOrder);
  }

  /**
   * Actualiza el estado de una orden
   * @param id UUID de la orden
   * @param status Nuevo estado
   * @param userRole Rol del usuario
   * @param currentUserId ID del usuario actual
   * @returns Promise<OrderResponseDto> Orden actualizada
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    userRole: UserRole,
    currentUserId?: string,
  ): Promise<OrderResponseDto> {
    this.logger.log(`Actualizando estado de orden ${id} a: ${status}`);

    // Solo los ADMIN pueden cambiar estados
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo los administradores pueden cambiar el estado de las órdenes',
      );
    }

    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    // Validar transición de estado
    this.validateStatusTransition(existingOrder.status, status);

    const updatedOrder = await this.orderRepository.updateStatus(id, status);

    if (!updatedOrder) {
      throw new NotFoundException(`Error al actualizar estado de orden ${id}`);
    }

    return this.mapToOrderResponseDto(updatedOrder);
  }

  /**
   * Cancela una orden
   * @param id UUID de la orden
   * @param userRole Rol del usuario
   * @param currentUserId ID del usuario actual
   * @returns Promise<void>
   */
  async cancel(
    id: string,
    userRole: UserRole,
    currentUserId?: string,
  ): Promise<void> {
    this.logger.log(`Cancelando orden con ID: ${id}`);

    if (!this.isValidUUID(id)) {
      throw new BadRequestException('ID de orden inválido');
    }

    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    // Verificar autorización
    if (userRole === UserRole.CLIENT) {
      if (!currentUserId || order.userId !== currentUserId) {
        throw new ForbiddenException(
          'No tienes permisos para cancelar esta orden',
        );
      }
    }

    // Verificar que la orden se puede cancelar
    if (!order.canBeCancelled()) {
      throw new ConflictException(
        `No se puede cancelar una orden en estado ${order.status}`,
      );
    }

    const cancelled = await this.orderRepository.cancel(id);

    if (!cancelled) {
      throw new BadRequestException(`Error al cancelar orden con ID ${id}`);
    }

    this.logger.log(`Orden ${id} cancelada exitosamente`);
  }

  /**
   * Obtiene el historial de órdenes de un usuario
   * @param userId UUID del usuario
   * @param page Página
   * @param limit Límite por página
   * @param requestingUserRole Rol del usuario que solicita
   * @param requestingUserId ID del usuario que solicita
   * @returns Promise<PaginatedOrderResponseDto> Historial de órdenes
   */
  async getUserOrderHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
    requestingUserRole: UserRole,
    requestingUserId?: string,
  ): Promise<PaginatedOrderResponseDto> {
    this.logger.log(`Obteniendo historial de órdenes para usuario: ${userId}`);

    // Verificar autorización
    if (requestingUserRole === UserRole.CLIENT) {
      if (!requestingUserId || userId !== requestingUserId) {
        throw new ForbiddenException(
          'Solo puedes ver tu propio historial de órdenes',
        );
      }
    }

    const result = await this.orderRepository.findUserOrderHistory(
      userId,
      page,
      limit,
    );

    const orders = result.orders.map((order) =>
      this.mapToOrderResponseDto(order),
    );

    const pagination = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
    };

    return new PaginatedOrderResponseDto(orders, pagination, { userId });
  }

  /**
   * Obtiene estadísticas de órdenes (solo ADMIN)
   * @param userRole Rol del usuario
   * @returns Promise con estadísticas
   */
  async getStats(userRole: UserRole) {
    this.logger.log('Obteniendo estadísticas de órdenes');

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo los administradores pueden ver estadísticas',
      );
    }

    return this.orderRepository.getStats();
  }

  /**
   * Mapea una orden a DTO de respuesta
   */
  private mapToOrderResponseDto(order: Order): OrderResponseDto {
    const items =
      order.items?.map((item) =>
        plainToClass(
          OrderItemResponseDto,
          {
            id: item.id,
            productId: item.productId,
            productName: item.product?.name || 'Producto no disponible',
            quantity: item.quantity,
            priceInCents: item.priceAtPurchase,
          },
          { excludeExtraneousValues: true },
        ),
      ) || [];

    return plainToClass(
      OrderResponseDto,
      {
        id: order.id,
        userId: order.userId,
        userFullName: order.user?.fullName || 'Usuario no disponible',
        userEmail: order.user?.email || 'Email no disponible',
        totalAmountInCents: order.totalAmount,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        items,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Valida los datos de creación de orden
   */
  private validateCreateOrderData(createOrderDto: CreateOrderDto): void {
    // Validar que hay items
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('La orden debe incluir al menos un item');
    }

    // Validar que no hay productos duplicados
    const productIds = createOrderDto.items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);

    if (productIds.length !== uniqueProductIds.size) {
      throw new BadRequestException(
        'No se pueden incluir productos duplicados en una orden',
      );
    }

    // Validar cantidades
    for (const item of createOrderDto.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(
          `La cantidad del producto ${item.productId} debe ser mayor a 0`,
        );
      }

      if (item.quantity > 999) {
        throw new BadRequestException(
          `La cantidad del producto ${item.productId} no puede exceder 999`,
        );
      }
    }
  }

  /**
   * Valida la transición de estados de orden
   */
  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.DELIVERED], // Se puede cancelar via soft delete
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [], // Estado final
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new ConflictException(
        `No se puede cambiar el estado de ${currentStatus} a ${newStatus}`,
      );
    }
  }

  /**
   * Valida si un string es un UUID válido
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
