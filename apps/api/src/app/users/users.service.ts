import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../db/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserRole,
  PaginationQuery
} from '@nutrabiotics-system/shared-types';
import { calculatePagination } from '@nutrabiotics-system/shared-utils';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Verifica si el usuario ya existe
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este correo electrónico');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        role: createUserDto.role,
        password: hashedPassword,
      },
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
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null
      },
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

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findById(id);

    // Verifica si el correo electrónico ya está en uso por otro usuario
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const userWithEmail = await this.findByEmail(updateUserDto.email);
      if (userWithEmail) {
        throw new ConflictException('Un usuario con este correo electrónico ya existe');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
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
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async remove(id: string) {
    await this.findById(id);

    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  async activate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  async getUserStats(id: string) {
    const user = await this.findById(id);

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
      user,
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
