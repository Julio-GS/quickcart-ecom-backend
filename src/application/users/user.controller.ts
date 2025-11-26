import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto, UserResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../../domain/entities/user.entity';

/**
 * UserController - Capa de Presentación (Clean Architecture)
 *
 * Responsabilidades:
 * - Manejar peticiones HTTP para operaciones CRUD de usuarios
 * - Aplicar guards de autenticación y autorización
 * - Validar parámetros de entrada (UUIDs)
 * - Transformar responses según formato API REST
 *
 * Seguridad implementada:
 * - JWT Authentication requerido
 * - Role-based authorization (ADMIN para operaciones sensibles)
 * - UUID validation para prevenir injection
 */
@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Obtiene todos los usuarios (Solo ADMIN)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obtener todos los usuarios',
    description:
      'Devuelve una lista de todos los usuarios registrados. Solo accesible para administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado - Requiere rol ADMIN',
  })
  async findAll(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  /**
   * Obtiene un usuario por ID (ADMIN puede ver cualquiera, USER solo su propio perfil)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description:
      'Devuelve los detalles de un usuario específico. Los usuarios pueden ver su propio perfil, los administradores pueden ver cualquier perfil.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de usuario inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para ver este perfil',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() currentUser: User,
  ): Promise<UserResponseDto> {
    // Los usuarios pueden ver su propio perfil, los ADMIN pueden ver cualquiera
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('No autorizado para ver este perfil');
    }

    return this.userService.findOne(id);
  }

  /**
   * Actualiza un usuario (ADMIN puede actualizar cualquiera, USER solo su propio perfil)
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description:
      'Actualiza los datos de un usuario. Los usuarios pueden actualizar su propio perfil, los administradores pueden actualizar cualquier perfil.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Datos a actualizar del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o ID inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para actualizar este perfil',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya está en uso por otro usuario',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: User,
  ): Promise<UserResponseDto> {
    // Permitir que el usuario autenticado actualice su propio perfil por ID
    // Los ADMIN pueden actualizar cualquier usuario
    // Los CLIENT solo pueden actualizarse a sí mismos
    console.log('Updating user:', id, 'by', currentUser.id);
    if (
      currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.CLIENT && currentUser.id === id)
    ) {
      return this.userService.update(id, updateUserDto);
    }
    throw new ForbiddenException('No autorizado para actualizar este perfil');
  }

  /**
   * Elimina un usuario (Solo ADMIN)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar usuario',
    description:
      'Realiza un soft delete de un usuario. Solo accesible para administradores.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Usuario eliminado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'ID de usuario inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado - Requiere rol ADMIN',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.userService.remove(id);
  }

  /**
   * Obtiene estadísticas de usuarios (Solo ADMIN)
   */
  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obtener estadísticas de usuarios',
    description:
      'Devuelve estadísticas básicas de usuarios. Solo accesible para administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        total: {
          type: 'number',
          description: 'Total de usuarios activos',
          example: 150,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado - Requiere rol ADMIN',
  })
  async getStats(): Promise<{ total: number }> {
    return this.userService.getStats();
  }
}
