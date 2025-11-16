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
  ValidationPipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderResponseDto,
  OrderQueryDto,
  PaginatedOrderResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user.entity';
import { OrderStatus } from '../../domain/entities/order.entity';

/**
 * OrderController - Gestión de órdenes para e-commerce
 *
 * Implementa:
 * - CRUD completo de órdenes
 * - Filtrado avanzado y paginación
 * - Gestión de estados transaccionales
 * - Control de stock automático
 * - RBAC (Role-Based Access Control)
 * - Seguridad OWASP A03 (Injection Prevention)
 * - Autorización granular por usuario/admin
 */
@ApiTags('Órdenes')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  /**
   * Crear nueva orden (Clientes y Administradores)
   */
  @Post()
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear orden',
    description:
      'Crear una nueva orden con items del carrito. Valida stock automáticamente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Orden creada exitosamente',
    type: OrderResponseDto,
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
    status: 422,
    description: 'Stock insuficiente para algunos productos',
  })
  async create(
    @Body(ValidationPipe) createOrderDto: CreateOrderDto,
    @Request() req: any,
  ): Promise<OrderResponseDto> {
    const userId = req.user.sub;
    this.logger.log(`Usuario ${userId} creando nueva orden`);
    return this.orderService.create(userId, createOrderDto);
  }

  /**
   * Obtener órdenes con filtros y paginación
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Listar órdenes',
    description:
      'Obtener órdenes con filtros opcionales y paginación. Los clientes solo ven sus propias órdenes.',
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
    name: 'status',
    required: false,
    enum: OrderStatus,
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filtrar por usuario (solo admins)',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    type: Number,
    description: 'Monto mínimo en centavos',
  })
  @ApiQuery({
    name: 'maxAmount',
    required: false,
    type: Number,
    description: 'Monto máximo en centavos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes con paginación',
    type: PaginatedOrderResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async findAll(
    @Query(ValidationPipe) query: OrderQueryDto,
    @Request() req: any,
  ): Promise<PaginatedOrderResponseDto> {
    const userRole = req.user.role;
    const currentUserId = req.user.sub;

    this.logger.log(
      `Buscando órdenes con filtros: ${JSON.stringify(query)}, usuario: ${currentUserId}, rol: ${userRole}`,
    );

    return this.orderService.findWithFilters(query, userRole, currentUserId);
  }

  /**
   * Obtener estadísticas de órdenes (Solo Admin)
   */
  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Estadísticas de órdenes',
    description:
      'Obtener estadísticas detalladas de órdenes. Solo accesible por administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de órdenes',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        byStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        totalRevenue: { type: 'number' },
        averageOrderValue: { type: 'number' },
        recentOrders: { type: 'number' },
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
  async getStats(@Request() req: any) {
    const userRole = req.user.role;
    this.logger.log('Admin obteniendo estadísticas de órdenes');
    return this.orderService.getStats(userRole);
  }

  /**
   * Obtener historial de órdenes de un usuario
   */
  @Get('user/:userId/history')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Historial de órdenes de usuario',
    description:
      'Obtener historial paginado de órdenes de un usuario específico.',
  })
  @ApiParam({ name: 'userId', type: 'string', description: 'ID del usuario' })
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
  @ApiResponse({
    status: 200,
    description: 'Historial de órdenes del usuario',
    type: PaginatedOrderResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para ver este historial',
  })
  async getUserHistory(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req: any,
  ): Promise<PaginatedOrderResponseDto> {
    const userRole = req.user.role;
    const requestingUserId = req.user.sub;

    this.logger.log(
      `Obteniendo historial de órdenes para usuario ${userId}, solicitado por ${requestingUserId}`,
    );

    return this.orderService.getUserOrderHistory(
      userId,
      page,
      limit,
      userRole,
      requestingUserId,
    );
  }

  /**
   * Obtener mi historial de órdenes (Cliente actual)
   */
  @Get('my-orders')
  @Roles(UserRole.CLIENT)
  @ApiOperation({
    summary: 'Mis órdenes',
    description: 'Obtener el historial de órdenes del usuario autenticado.',
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
  @ApiResponse({
    status: 200,
    description: 'Historial de órdenes del usuario',
    type: PaginatedOrderResponseDto,
  })
  async getMyOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req: any,
  ): Promise<PaginatedOrderResponseDto> {
    const userId = req.user.sub;
    const userRole = req.user.role;

    this.logger.log(`Usuario ${userId} obteniendo su historial de órdenes`);

    return this.orderService.getUserOrderHistory(
      userId,
      page,
      limit,
      userRole,
      userId,
    );
  }

  /**
   * Obtener orden por ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Obtener orden',
    description:
      'Obtener una orden específica por su ID. Los clientes solo pueden ver sus propias órdenes.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la orden' })
  @ApiResponse({
    status: 200,
    description: 'Orden encontrada',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de orden inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para ver esta orden',
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<OrderResponseDto> {
    const userRole = req.user.role;
    const currentUserId = req.user.sub;

    this.logger.log(`Buscando orden con ID: ${id}, usuario: ${currentUserId}`);
    return this.orderService.findOne(id, userRole, currentUserId);
  }

  /**
   * Actualizar orden (Solo si está en estado PENDING)
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Actualizar orden',
    description:
      'Actualizar una orden. Los clientes solo pueden editar órdenes PENDING propias.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la orden' })
  @ApiResponse({
    status: 200,
    description: 'Orden actualizada exitosamente',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o ID de orden inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para modificar esta orden',
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'La orden no se puede modificar en su estado actual',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateOrderDto: UpdateOrderDto,
    @Request() req: any,
  ): Promise<OrderResponseDto> {
    const userRole = req.user.role;
    const currentUserId = req.user.sub;

    this.logger.log(
      `Actualizando orden ${id}: ${JSON.stringify(updateOrderDto)}, usuario: ${currentUserId}`,
    );

    return this.orderService.update(
      id,
      updateOrderDto,
      userRole,
      currentUserId,
    );
  }

  /**
   * Actualizar estado de orden (Solo Admin)
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar estado de orden',
    description:
      'Actualizar el estado de una orden. Solo accesible por administradores.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la orden' })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de orden inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los administradores pueden cambiar estados',
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Transición de estado inválida',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Request() req: any,
  ): Promise<OrderResponseDto> {
    const userRole = req.user.role;
    this.logger.log(`Admin actualizando estado de orden ${id} a: ${status}`);
    return this.orderService.updateStatus(id, status, userRole);
  }

  /**
   * Cancelar orden
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancelar orden',
    description:
      'Cancelar una orden (soft delete). Solo se pueden cancelar órdenes PENDING o PROCESSING.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la orden' })
  @ApiResponse({
    status: 204,
    description: 'Orden cancelada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'ID de orden inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para cancelar esta orden',
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'La orden no se puede cancelar en su estado actual',
  })
  async cancel(@Param('id') id: string, @Request() req: any): Promise<void> {
    const userRole = req.user.role;
    const currentUserId = req.user.sub;

    this.logger.log(
      `Cancelando orden con ID: ${id}, usuario: ${currentUserId}`,
    );
    await this.orderService.cancel(id, userRole, currentUserId);
  }
}
