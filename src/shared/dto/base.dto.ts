import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * BaseDto - Base DTO with common fields
 * Used for response DTOs that include entity metadata
 */
export abstract class BaseDto {
  @ApiPropertyOptional({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2023-11-11T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Last update timestamp',
    example: '2023-11-11T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: Date;
}
