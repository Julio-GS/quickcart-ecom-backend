import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../domain/entities/user.entity';

/**
 * RegisterDto - DTO para registro de nuevos usuarios
 * Implementa validaciones robustas siguiendo OWASP A03
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez García',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios',
  })
  fullName: string;

  @ApiProperty({
    description: 'Email del usuario (único en el sistema)',
    example: 'juan.perez@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
  email: string;

  @ApiProperty({
    description:
      'Contraseña segura (min 8 chars, 1 mayúscula, 1 minúscula, 1 número)',
    example: 'MySecure123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message:
      'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula y 1 número',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario (por defecto Client)',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  @IsOptional()
  @IsString()
  role?: UserRole = UserRole.CLIENT;
}
