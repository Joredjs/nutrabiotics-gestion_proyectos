// Types para manejo de proyectos

import { BaseEntity, BaseCreateDto, BaseUpdateDto } from './base.types';
import { User } from './user.types';
import { Task } from './task.types';

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Project extends BaseEntity {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: Date;
  endDate?: Date;
  managerId: string;
  manager?: User;
  developers: User[];
  tasks?: Task[];
}

export interface CreateProjectDto extends BaseCreateDto {
  name: string;
  description: string;
  priority: Priority;
  startDate: Date;
  endDate?: Date;
  managerId: string;
  developerIds: string[];
}

export interface UpdateProjectDto extends BaseUpdateDto,Partial<Omit<CreateProjectDto,'createdBy'>> {
  status?: ProjectStatus;
}
