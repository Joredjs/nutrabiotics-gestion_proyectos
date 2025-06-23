import { IsString, IsNotEmpty, MinLength, MaxLength, IsEnum, IsDateString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '@nutrabiotics-system/shared-types';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @ApiProperty({ example: 'Proyecto de E-commerce' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  name: string;

  @ApiProperty({ example: 'Desarrollo de plataforma de e-commerce...' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @MaxLength(500, { message: 'La descripción no puede tener más de 500 caracteres' })
  description: string;

  @ApiProperty({ enum: Priority, example: Priority.HIGH })
  @IsEnum(Priority, { message: 'La prioridad debe ser: LOW, MEDIUM o HIGH' })
  priority: Priority;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  startDate: Date;

  @ApiProperty({ required: false, example: '2025-06-30' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  endDate?: Date;

  @ApiProperty({ example: 'uuid-del-manager' })
  @IsUUID('4', { message: 'El ID del manager debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El manager es requerido' })
  managerId: string;

  @ApiProperty({ type: [String], example: ['uuid-dev-1', 'uuid-dev-2'] })
  @IsArray({ message: 'Los desarrolladores deben ser un arreglo' })
  @IsUUID('4', { each: true, message: 'Cada ID de desarrollador debe ser un UUID válido' })
  @Type(() => String)
  developerIds: string[];
}
