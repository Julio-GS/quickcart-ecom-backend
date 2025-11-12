import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@domain/entities/user.entity';

/**
 * UserInfoDto - Información básica del usuario autenticado
 * Excluye datos sensibles siguiendo principio de menor privilegio
 */
export class UserInfoDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@quickcart.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez García',
  })
  fullName: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    enum: UserRole,
    example: UserRole.CLIENT,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Fecha de creación de la cuenta',
    example: '2023-11-11T10:00:00Z',
  })
  createdAt: Date;
}

/**
 * AuthResponseDto - DTO de respuesta para autenticación exitosa
 * Nunca expone información sensible como contraseñas
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT token para autenticación',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Tipo de token',
    example: 'Bearer',
  })
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: 'Tiempo de expiración del token en segundos',
    example: 86400,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Información del usuario autenticado',
  })
  user: UserInfoDto;
}
