import { IsString, IsNotEmpty, MinLength, MaxLength, IsEnum, IsOptional, IsUUID, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '@nutrabiotics-system/shared-types';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implementar autenticación' })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es requerido' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El título no puede tener más de 100 caracteres' })
  title: string;

  @ApiProperty({ example: 'Desarrollar el sistema de autenticación con JWT...' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @MaxLength(1000, { message: 'La descripción no puede tener más de 1000 caracteres' })
  description: string;

  @ApiProperty({ enum: Priority, example: Priority.HIGH })
  @IsEnum(Priority, { message: 'La prioridad debe ser: LOW, MEDIUM o HIGH' })
  priority: Priority;

  @ApiProperty({ example: 'uuid-del-proyecto' })
  @IsUUID('4', { message: 'El ID del proyecto debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El proyecto es requerido' })
  projectId: string;

  @ApiProperty({ required: false, example: 'uuid-del-desarrollador' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del desarrollador debe ser un UUID válido' })
  assignedToId?: string;

  @ApiProperty({ required: false, example: 8, minimum: 0.5, maximum: 999 })
  @IsOptional()
  @IsNumber({}, { message: 'Las horas estimadas deben ser un número' })
  @Type(() => Number)
  @Min(0.5, { message: 'Las horas estimadas deben ser al menos 0.5' })
  @Max(999, { message: 'Las horas estimadas no pueden ser más de 999' })
  estimatedHours?: number;

  @ApiProperty({ required: false, example: '2025-02-15' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha límite debe ser una fecha válida' })
  dueDate?: Date;
}
