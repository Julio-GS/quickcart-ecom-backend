import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../domain/entities/user.entity';

/**
 * Decorador @Roles - Define los roles requeridos para acceder a un endpoint
 * Usado junto con RolesGuard para implementar RBAC
 *
 * @example
 * @Roles(UserRole.ADMIN)
 * @Get('admin-only')
 * adminOnlyEndpoint() { ... }
 *
 * @example
 * @Roles(UserRole.ADMIN, UserRole.CLIENT)
 * @Get('admin-or-client')
 * adminOrClientEndpoint() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
