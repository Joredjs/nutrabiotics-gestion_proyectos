// types para manejo de tareas

import { BaseEntity, BaseCreateDto, BaseUpdateDto } from './base.types';
import { Priority } from './project.types';
import { User } from './user.types';
import { Project } from './project.types';

export enum TaskStatus {
  TODO = 'Pendiente',
  IN_PROGRESS = 'En Progreso',
  REVIEW = 'En Revisión',
  DONE = 'Completado',
}

export interface Task extends BaseEntity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  project?: Project;
  assignedToId?: string;
  assignedTo?: User;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
}

export interface CreateTaskDto extends BaseCreateDto {
  title: string;
  description: string;
  priority: Priority;
  projectId: string;
  assignedToId?: string;
  estimatedHours?: number;
  dueDate?: Date;
}

export interface UpdateTaskDto extends BaseUpdateDto, Partial<Omit<CreateTaskDto, 'projectId' | 'createdBy'>> {
  status?: TaskStatus;
  actualHours?: number;
}
