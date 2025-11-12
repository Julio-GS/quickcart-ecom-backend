import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @Expose()
  fullName: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'juan.perez@email.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'Rol del usuario',
    example: UserRole.CLIENT,
    enum: UserRole,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    description: 'Número de teléfono del usuario',
    example: '+1234567890',
    nullable: true,
  })
  @Expose()
  phone: string | null;

  @ApiProperty({
    description: 'Dirección del usuario',
    example: 'Calle 123, Ciudad',
    nullable: true,
  })
  @Expose()
  address: string | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2023-12-01T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2023-12-01T15:45:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  // Excluir datos sensibles de la respuesta
  @Exclude()
  password: string;

  @Exclude()
  deletedAt: Date | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
