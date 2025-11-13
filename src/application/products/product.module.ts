import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductRepository } from '../../infrastructure/repositories/product.repository';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository } from './interfaces/product-repository.interface';

/**
 * ProductModule - Módulo de gestión de productos
 *
 * Implementa:
 * - Clean Architecture con separación de capas
 * - Dependency Inversion Principle (DIP) con abstract interfaces
 * - Repository Pattern para abstracción de datos
 * - Inyección de dependencias con NestJS
 */
@Module({
  imports: [
    // Configuración de TypeORM para la entidad Product
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [
    // REST API Controller con endpoints CRUD
    ProductController,
  ],
  providers: [
    // Servicio de lógica de negocio
    ProductService,
    // Repository implementation binding to interface (DIP)
    {
      provide: 'IProductRepository',
      useClass: ProductRepository,
    },
  ],
  exports: [
    // Exportar servicio para uso en otros módulos
    ProductService,
    // Exportar interface para dependency injection
    'IProductRepository',
  ],
})
export class ProductModule {}
