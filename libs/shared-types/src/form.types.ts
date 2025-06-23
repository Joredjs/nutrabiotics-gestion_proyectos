// Types específicos para formularios del frontend

import { CreateProjectDto } from './project.types';
import { CreateTaskDto } from './task.types';
import { CreateUserDto } from './user.types';


export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ProjectFormData extends Omit<CreateProjectDto, 'managerId' | 'developerIds'> {
  managerId: string;
  developerIds: string[];
}

export interface TaskFormData extends Omit<CreateTaskDto, 'projectId'> {
  projectId?: string; // Opcional si ya estamos en contexto de proyecto
}

export interface UserFormData extends Omit<CreateUserDto, 'password'> {
  password?: string; // Opcional para edición
}
