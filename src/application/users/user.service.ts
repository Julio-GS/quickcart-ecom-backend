import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { IUserRepository } from './interfaces/user-repository.interface';
import { UpdateUserDto, UserResponseDto } from './dto';
import { User } from '../../domain/entities/user.entity';

/**
 * UserService - Capa de Aplicación (Clean Architecture)
 *
 * Responsabilidades (SRP - Single Responsibility Principle):
 * - Orquestar la lógica de negocio de usuarios
 * - Validar reglas de negocio específicas
 * - Transformar datos entre capas (DTOs <-> Entities)
 * - Manejar errores de dominio con mensajes apropiados
 *
 * Depende de abstracciones (DIP - Dependency Inversion Principle):
 * - IUserRepository en lugar de implementación concreta
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Obtiene todos los usuarios activos
   * @returns Promise<UserResponseDto[]> Lista de usuarios sin datos sensibles
   */
  async findAll(): Promise<UserResponseDto[]> {
    this.logger.log('Obteniendo todos los usuarios activos');

    const users = await this.userRepository.findAll();

    // Transformar entities a DTOs para excluir datos sensibles
    return users.map((user) =>
      plainToClass(UserResponseDto, user, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Obtiene un usuario por su ID
   * @param id UUID del usuario
   * @returns Promise<UserResponseDto> Usuario encontrado
   * @throws NotFoundException si el usuario no existe
   */
  async findOne(id: string): Promise<UserResponseDto> {
    this.logger.log(`Buscando usuario con ID: ${id}`);

    // Validación de formato UUID (OWASP A03: Injection Prevention)
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Actualiza un usuario existente
   * @param id UUID del usuario
   * @param updateUserDto Datos a actualizar
   * @returns Promise<UserResponseDto> Usuario actualizado
   * @throws NotFoundException si el usuario no existe
   * @throws ConflictException si el email ya está en uso
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Actualizando usuario con ID: ${id}`);

    // Validación de formato UUID
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    // Verificar que el usuario existe
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Validar unicidad de email si se está actualizando
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.userRepository.existsByEmailExcluding(
        updateUserDto.email,
        id,
      );

      if (emailExists) {
        throw new ConflictException('El email ya está en uso por otro usuario');
      }
    }

    // Realizar la actualización
    const updatedUser = await this.userRepository.update(id, updateUserDto);

    if (!updatedUser) {
      throw new NotFoundException(`Error al actualizar usuario con ID ${id}`);
    }

    this.logger.log(`Usuario ${id} actualizado exitosamente`);

    return plainToClass(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Elimina (soft delete) un usuario
   * @param id UUID del usuario
   * @returns Promise<void>
   * @throws NotFoundException si el usuario no existe
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Eliminando usuario con ID: ${id}`);

    // Validación de formato UUID
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    // Verificar que el usuario existe antes de eliminar
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const deleted = await this.userRepository.softDelete(id);

    if (!deleted) {
      throw new BadRequestException(`Error al eliminar usuario con ID ${id}`);
    }

    this.logger.log(`Usuario ${id} eliminado exitosamente`);
  }

  /**
   * Obtiene estadísticas básicas de usuarios
   * @returns Promise<{ total: number }> Estadísticas de usuarios
   */
  async getStats(): Promise<{ total: number }> {
    const total = await this.userRepository.count();

    return { total };
  }

  /**
   * Valida si un string es un UUID válido
   * Prevención contra inyección SQL (OWASP A03)
   * @param uuid String a validar
   * @returns boolean true si es válido
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
