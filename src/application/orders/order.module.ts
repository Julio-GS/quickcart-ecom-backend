import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderRepository } from '../../infrastructure/repositories/order.repository';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { Product } from '../../domain/entities/product.entity';
import { User } from '../../domain/entities/user.entity';
import { IOrderRepository } from './interfaces/order-repository.interface';

/**
 * OrderModule - Módulo de gestión de órdenes
 *
 * Implementa:
 * - Clean Architecture con separación de capas
 * - Dependency Inversion Principle (DIP) con abstract interfaces
 * - Repository Pattern para abstracción de datos
 * - Inyección de dependencias con NestJS
 * - Transacciones atómicas para consistencia de datos
 */
@Module({
  imports: [
    // Configuración de TypeORM para las entidades relacionadas
    TypeOrmModule.forFeature([Order, OrderItem, Product, User]),
  ],
  controllers: [
    // REST API Controller con endpoints CRUD y RBAC
    OrderController,
  ],
  providers: [
    // Servicio de lógica de negocio
    OrderService,
    // Repository implementation binding to interface (DIP)
    {
      provide: 'IOrderRepository',
      useClass: OrderRepository,
    },
  ],
  exports: [
    // Exportar servicio para uso en otros módulos
    OrderService,
    // Exportar interface para dependency injection
    'IOrderRepository',
  ],
})
export class OrderModule {}
