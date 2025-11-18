import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { IOrderRepository } from './interfaces/order-repository.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '../../domain/entities/order.entity';
import { UserRole } from '../../domain/entities/user.entity';

describe('OrderService - Tests Básicos', () => {
  let service: OrderService;
  let orderRepository: any;

  // Mock data simple con UUIDs válidos
  const validOrderId = '550e8400-e29b-41d4-a716-446655440000';
  const validUserId = '550e8400-e29b-41d4-a716-446655440001';
  const otherUserId = '550e8400-e29b-41d4-a716-446655440002';
  const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

  const mockOrder = {
    id: validOrderId,
    userId: validUserId,
    totalAmount: 20000, // en centavos = $200
    status: OrderStatus.PENDING,
    deliveryAddress: 'Test Address',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: validUserId,
      email: 'test@example.com',
      fullName: 'Test User',
    },
  };

  const mockOrderRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    cancel: jest.fn(),
    checkProductsAvailability: jest.fn(),
    findWithFilters: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: 'IOrderRepository',
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get('IOrderRepository');

    jest.clearAllMocks();
  });

  // Test básico: Crear una orden exitosamente
  describe('create', () => {
    it('should create an order successfully', async () => {
      // Arrange
      const createOrderDto: CreateOrderDto = {
        items: [{ productId: 1, quantity: 2 }],
        deliveryAddress: 'Test Address',
      };

      orderRepository.checkProductsAvailability.mockResolvedValue([
        { productId: 1, available: 10, requested: 2 },
      ]);
      orderRepository.create.mockResolvedValue(mockOrder);

      // Act
      const result = await service.create(validUserId, createOrderDto);

      // Assert
      expect(result).toBeDefined();
      expect(orderRepository.create).toHaveBeenCalledWith(
        validUserId,
        createOrderDto,
      );
    });

    it('should throw error when insufficient stock', async () => {
      // Arrange
      const createOrderDto: CreateOrderDto = {
        items: [{ productId: 1, quantity: 20 }],
        deliveryAddress: 'Test Address',
      };

      orderRepository.checkProductsAvailability.mockResolvedValue([
        { productId: 1, available: 5, requested: 20 },
      ]);

      // Act & Assert
      await expect(service.create(validUserId, createOrderDto)).rejects.toThrow(
        'Stock insuficiente',
      );
    });
  });

  // Test básico: Buscar una orden por ID
  describe('findOne', () => {
    it('should return order when found and user is owner', async () => {
      // Arrange
      orderRepository.findById.mockResolvedValue(mockOrder);

      // Act
      const result = await service.findOne(
        validOrderId,
        UserRole.CLIENT,
        validUserId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(orderRepository.findById).toHaveBeenCalledWith(validOrderId);
    });

    it('should throw NotFoundException when order not found', async () => {
      // Arrange
      orderRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOne(nonExistentId, UserRole.CLIENT, validUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when client tries to access other user order', async () => {
      // Arrange
      const otherUserOrder = { ...mockOrder, userId: otherUserId };
      orderRepository.findById.mockResolvedValue(otherUserOrder);

      // Act & Assert
      await expect(
        service.findOne(validOrderId, UserRole.CLIENT, validUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // Test básico: Actualizar estado de orden
  describe('updateStatus', () => {
    it('should update order status successfully for admin', async () => {
      // Arrange
      orderRepository.findById.mockResolvedValue(mockOrder);
      const updatedOrder = { ...mockOrder, status: OrderStatus.PROCESSING };
      orderRepository.updateStatus.mockResolvedValue(updatedOrder);

      // Act
      const result = await service.updateStatus(
        validOrderId,
        OrderStatus.PROCESSING,
        UserRole.ADMIN,
      );

      // Assert
      expect(result).toBeDefined();
      expect(orderRepository.updateStatus).toHaveBeenCalledWith(
        validOrderId,
        OrderStatus.PROCESSING,
      );
    });

    it('should throw ForbiddenException when client tries to update status', async () => {
      // Act & Assert
      await expect(
        service.updateStatus(
          validOrderId,
          OrderStatus.PROCESSING,
          UserRole.CLIENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // Test básico: Cancelar orden
  describe('cancel', () => {
    it('should cancel order successfully for admin', async () => {
      // Arrange
      const orderWithCancel = {
        ...mockOrder,
        canBeCancelled: jest.fn().mockReturnValue(true),
      };
      orderRepository.findById.mockResolvedValue(orderWithCancel);
      orderRepository.cancel.mockResolvedValue(true);

      // Act & Assert
      await expect(
        service.cancel(validOrderId, UserRole.ADMIN),
      ).resolves.not.toThrow();
      expect(orderRepository.cancel).toHaveBeenCalledWith(validOrderId);
    });

    it('should throw NotFoundException when order not found', async () => {
      // Arrange
      orderRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.cancel(nonExistentId, UserRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // Test básico: Obtener estadísticas (solo admin)
  describe('getStats', () => {
    it('should return stats for admin', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        byStatus: [{ status: OrderStatus.PENDING, count: 10 }],
        totalRevenue: 50000,
        averageOrderValue: 500,
        recentOrders: 5,
      };
      orderRepository.getStats.mockResolvedValue(mockStats);

      // Act
      const result = await service.getStats(UserRole.ADMIN);

      // Assert
      expect(result).toEqual(mockStats);
      expect(orderRepository.getStats).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for non-admin', async () => {
      // Act & Assert
      await expect(service.getStats(UserRole.CLIENT)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
