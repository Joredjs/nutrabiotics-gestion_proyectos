// types para usuarios y roles

import { BaseEntity, BaseCreateDto, BaseUpdateDto  } from './base.types';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DEVELOPER = 'DEVELOPER',
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface CreateUserDto extends BaseCreateDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
}

export interface UpdateUserDto extends BaseUpdateDto, Partial<Omit<CreateUserDto, 'password | createdBy'>> {
  isActive?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto extends Omit<CreateUserDto, 'role'> {
  confirmPassword: string;
}
