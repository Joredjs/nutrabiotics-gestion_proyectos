import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@nutrabiotics-system/shared-types';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsEnum(TaskStatus, { message: 'El estado debe ser: TODO, IN_PROGRESS, REVIEW o DONE' })
  status: TaskStatus;
}
