import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from './interfaces/user-repository.interface';

/**
 * UserModule - Módulo de usuarios siguiendo Clean Architecture
 *
 * Responsabilidades:
 * - Configurar la inyección de dependencias para el módulo de usuarios
 * - Registrar el repositorio concreto con su abstracción (DIP)
 * - Exportar servicios para uso en otros módulos
 * - Configurar TypeORM para la entidad User
 */
@Module({
  imports: [
    // Registro de la entidad User para TypeORM
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    // Implementación del patrón Repository con DIP (Dependency Inversion Principle)
    // El servicio depende de IUserRepository (abstracción) no de UserRepository (implementación)
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
  exports: [
    UserService,
    // Exportar la abstracción del repositorio para uso en otros módulos
    'IUserRepository',
  ],
})
export class UserModule {}
