import {
  Task,
  TaskStatus,
  Priority,
  TaskFilters,
} from '@nutrabiotics-system/shared-types';

export interface ITaskRepository {
  create(taskData: {
    title: string;
    description: string;
    priority: Priority;
    projectId: string;
    assignedToId?: string;
    estimatedHours?: number;
    dueDate?: Date;
  }): Promise<Task>;

  findById(id: string): Promise<any | null>;
  findAll(filters: TaskFilters): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>;

  findByProject(
    projectId: string,
    filters: TaskFilters
  ): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>;

  findByAssignee(
    userId: string,
    filters: TaskFilters
  ): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>;

  update(id: string, taskData: any): Promise<Task>;
  updateStatus(id: string, status: TaskStatus): Promise<Task>;
  delete(id: string): Promise<void>;
}
