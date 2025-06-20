// Types para manejo de estadísticas de proyectos y usuarios

import { Priority, ProjectStatus  } from './project.types';
import { TaskStatus } from './task.types';

export interface UserStats {
  totalManagedProjects: number;
  totalAssignedProjects: number;
  totalAssignedTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  projectsByStatus: Record<ProjectStatus, number>;
}

export interface ProjectStats {
  totalTasks: number;
  totalDevelopers: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<Priority, number>;
  totalEstimatedHours: number;
  totalActualHours: number;
  completionRate: number;
}
