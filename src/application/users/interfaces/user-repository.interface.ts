import { User } from '../../../domain/entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';

/**
 * Abstracción del Repository Pattern para Users (DIP - Dependency Inversion Principle)
 * Esta interface define el contrato que debe cumplir cualquier implementación de repositorio
 * Permite que la capa de aplicación (UserService) no dependa de detalles de infraestructura
 */
export interface IUserRepository {
  /**
   * Encuentra todos los usuarios activos (no soft deleted)
   * @returns Promise<User[]> Lista de usuarios activos
   */
  findAll(): Promise<User[]>;

  /**
   * Encuentra un usuario por su ID
   * @param id UUID del usuario
   * @returns Promise<User | null> Usuario encontrado o null
   */
  findById(id: string): Promise<User | null>;

  /**
   * Encuentra un usuario por su email
   * @param email Email del usuario
   * @returns Promise<User | null> Usuario encontrado o null
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Actualiza un usuario existente
   * @param id UUID del usuario
   * @param updateData Datos a actualizar
   * @returns Promise<User | null> Usuario actualizado o null si no existe
   */
  update(id: string, updateData: UpdateUserDto): Promise<User | null>;

  /**
   * Soft delete de un usuario (marca como eliminado sin borrarlo físicamente)
   * @param id UUID del usuario
   * @returns Promise<boolean> true si se eliminó correctamente
   */
  softDelete(id: string): Promise<boolean>;

  /**
   * Cuenta el total de usuarios activos
   * @returns Promise<number> Número total de usuarios
   */
  count(): Promise<number>;

  /**
   * Verifica si existe un usuario con un email específico (excluyendo un ID)
   * Útil para validar unicidad de email en updates
   * @param email Email a verificar
   * @param excludeId ID a excluir de la búsqueda
   * @returns Promise<boolean> true si existe otro usuario con ese email
   */
  existsByEmailExcluding(email: string, excludeId: string): Promise<boolean>;
}
