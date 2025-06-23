import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { ProjectStatus } from '@nutrabiotics-system/shared-types';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiProperty({ enum: ProjectStatus, required: false })
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'El estado debe ser: PLANNING, IN_PROGRESS, COMPLETED o CANCELLED' })
  status?: ProjectStatus;
}
