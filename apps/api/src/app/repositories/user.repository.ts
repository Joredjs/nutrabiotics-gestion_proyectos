import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { IUserRepository } from '../common/interfaces/user-repository.interface';
import { User, UserRole, PaginationQuery } from '@nutrabiotics-system/shared-types';
import { calculatePagination } from '@nutrabiotics-system/shared-utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    avatar?: string;
  }): Promise<User> {
    const user = await this.prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            managedProjects: true,
            assignedProjects: true,
            assignedTasks: true,
          },
        },
      },
    });
    if (!user) return null;
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findAll(query: PaginationQuery & { role?: UserRole; isActive?: boolean }) {
    const { page, limit, skip } = calculatePagination(query);

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              managedProjects: true,
              assignedProjects: true,
              assignedTasks: true,
            },
          },
        },
        orderBy: query.sortBy
          ? { [query.sortBy]: query.sortOrder || 'asc' }
          : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(user => ({
        ...user,
        role: user.role as UserRole,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findDevelopers(query: PaginationQuery) {
    const { page, limit, skip } = calculatePagination(query);

    const where: Prisma.UserWhereInput = {
      role: UserRole.DEVELOPER,
      isActive: true,
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [developers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          lastLoginAt: true,
          _count: {
            select: {
              assignedProjects: true,
              assignedTasks: {
                where: { status: { notIn: ['DONE'] } },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: developers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async delete(id: string): Promise<void> {
    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async activate(id: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async getUserStats(id: string) {
    const stats = await this.prisma.user.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            managedProjects: {
              where: { deletedAt: null },
            },
            assignedProjects: true,
            assignedTasks: {
              where: { deletedAt: null },
            },
          },
        },
        assignedTasks: {
          where: { deletedAt: null },
          select: {
            status: true,
            priority: true,
          },
        },
        managedProjects: {
          where: { deletedAt: null },
          select: {
            status: true,
            priority: true,
          },
        },
      },
    });

    const tasksByStatus = stats.assignedTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const projectsByStatus = stats.managedProjects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});

    return {
      stats: {
        totalManagedProjects: stats._count.managedProjects,
        totalAssignedProjects: stats._count.assignedProjects,
        totalAssignedTasks: stats._count.assignedTasks,
        tasksByStatus,
        projectsByStatus,
      },
    };
  }
}
