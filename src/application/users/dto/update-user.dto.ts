import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no debe exceder 100 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios',
  })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico del usuario',
    example: 'juan.perez@email.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @MaxLength(255, { message: 'El email no debe exceder 255 caracteres' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono del usuario',
    example: '+1234567890',
    pattern: '^\\+?[1-9]\\d{1,14}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'El teléfono debe tener un formato válido (+1234567890)',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Dirección del usuario',
    example: 'Calle 123, Ciudad',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La dirección no debe exceder 500 caracteres' })
  address?: string;
}
