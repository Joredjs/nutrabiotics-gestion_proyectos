import {
  Project,
  Priority,
  ProjectFilters,
} from '@nutrabiotics-system/shared-types';

export interface IProjectRepository {
  create(projectData: {
    name: string;
    description: string;
    priority: Priority;
    startDate: Date;
    endDate?: Date;
    managerId: string;
    developerIds: string[];
  }): Promise<Project>;
  findById(id: string): Promise<any | null>;
  findAll(filters: ProjectFilters): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>;
  update(id: string, projectData: any): Promise<Project>;
  delete(id: string): Promise<void>;
  addDeveloper(projectId: string, developerId: string): Promise<void>;
  removeDeveloper(projectId: string, developerId: string): Promise<void>;
  getProjectStats(id: string): Promise<any>;
}
