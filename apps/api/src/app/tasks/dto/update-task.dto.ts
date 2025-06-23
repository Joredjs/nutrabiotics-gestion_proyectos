import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { TaskStatus } from '@nutrabiotics-system/shared-types';
import { Type } from 'class-transformer';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ enum: TaskStatus, required: false })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'El estado debe ser: TODO, IN_PROGRESS, REVIEW o DONE' })
  status?: TaskStatus;

  @ApiProperty({ required: false, example: 6.5, minimum: 0, maximum: 999 })
  @IsOptional()
  @IsNumber({}, { message: 'Las horas reales deben ser un número' })
  @Type(() => Number)
  @Min(0, { message: 'Las horas reales deben ser al menos 0' })
  @Max(999, { message: 'Las horas reales no pueden ser más de 999' })
  actualHours?: number;
}
