import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../application/users/interfaces/user-repository.interface';
import { UpdateUserDto } from '../../application/users/dto/update-user.dto';

/**
 * UserRepository - Implementación concreta del Repository Pattern
 * Capa de Infraestructura (Clean Architecture)
 *
 * Responsabilidades:
 * - Implementar operaciones de persistencia específicas de TypeORM
 * - Manejar consultas SQL de forma segura
 * - Abstraer detalles de la base de datos de la capa de aplicación
 */
@Injectable()
export class UserRepository implements IUserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Encuentra todos los usuarios activos (no soft deleted)
   */
  async findAll(): Promise<User[]> {
    this.logger.debug('Obteniendo todos los usuarios activos desde DB');

    return this.userRepository.find({
      order: { createdAt: 'DESC' },
      withDeleted: false, // Excluye usuarios soft deleted
    });
  }

  /**
   * Encuentra un usuario por su ID
   */
  async findById(id: string): Promise<User | null> {
    this.logger.debug(`Buscando usuario por ID: ${id}`);

    return this.userRepository.findOne({
      where: { id },
      withDeleted: false, // Excluye usuarios soft deleted
    });
  }

  /**
   * Encuentra un usuario por su email
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Buscando usuario por email: ${email}`);

    return this.userRepository.findOne({
      where: { email },
      withDeleted: false, // Excluye usuarios soft deleted
    });
  }

  /**
   * Actualiza un usuario existente
   */
  async update(id: string, updateData: UpdateUserDto): Promise<User | null> {
    this.logger.debug(`Actualizando usuario ${id} en DB`);

    // Actualizar usando el método update de TypeORM para mayor seguridad
    const updateResult = await this.userRepository.update(
      { id },
      {
        ...updateData,
        updatedAt: new Date(),
      },
    );

    // Verificar si se actualizó algún registro
    if (updateResult.affected === 0) {
      return null;
    }

    // Retornar el usuario actualizado
    return this.findById(id);
  }

  /**
   * Soft delete de un usuario
   */
  async softDelete(id: string): Promise<boolean> {
    this.logger.debug(`Realizando soft delete del usuario ${id}`);

    // Usar el método softDelete de TypeORM que maneja automáticamente el deletedAt
    const deleteResult = await this.userRepository.softDelete(id);

    return deleteResult.affected > 0;
  }

  /**
   * Cuenta el total de usuarios activos
   */
  async count(): Promise<number> {
    this.logger.debug('Contando usuarios activos');

    return this.userRepository.count({
      withDeleted: false, // Excluye usuarios soft deleted
    });
  }

  /**
   * Verifica si existe un usuario con un email específico (excluyendo un ID)
   */
  async existsByEmailExcluding(
    email: string,
    excludeId: string,
  ): Promise<boolean> {
    this.logger.debug(
      `Verificando existencia de email: ${email}, excluyendo ID: ${excludeId}`,
    );

    const user = await this.userRepository.findOne({
      where: { email },
      withDeleted: false,
    });

    // Si no existe usuario con ese email, retorna false
    if (!user) {
      return false;
    }

    // Si existe y es diferente al ID excluido, retorna true
    return user.id !== excludeId;
  }
}
