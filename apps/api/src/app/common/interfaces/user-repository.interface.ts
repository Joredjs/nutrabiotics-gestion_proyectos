import {
  User,
  UserRole,
  PaginationQuery,
} from '@nutrabiotics-system/shared-types';

export interface IUserRepository {
  create(userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    avatar?: string;
  }): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<any | null>;
  update(id: string, userData: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(
    query: PaginationQuery & { role?: UserRole; isActive?: boolean }
  ): Promise<{
    data: User[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>;
  findDevelopers(query: PaginationQuery): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>;
  updateLastLogin(id: string): Promise<void>;
  activate(id: string): Promise<User>;
  deactivate(id: string): Promise<User>;
  getUserStats(id: string): Promise<any>;
}
