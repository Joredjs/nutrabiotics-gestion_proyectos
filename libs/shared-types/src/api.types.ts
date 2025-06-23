// types para la API y paginación

import { UserRole } from './user.types';
import { ProjectStatus, Priority } from './project.types';
import { TaskStatus } from './task.types';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  meta?: PaginationMeta;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectFilters extends PaginationQuery {
  status?: ProjectStatus;
  priority?: Priority;
  managerId?: string;
}

export interface TaskFilters extends PaginationQuery {
  status?: TaskStatus;
  priority?: Priority;
  assignedToId?: string;
  projectId?: string;
}

export interface UserFilters extends PaginationQuery {
  role?: UserRole;
  isActive?: boolean;
}
