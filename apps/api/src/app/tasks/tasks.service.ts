import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
  TaskStatus,
  UserRole,
  User,
} from '@nutrabiotics-system/shared-types';
import { calculatePagination } from '@nutrabiotics-system/shared-utils';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, currentUser: User) {
    // Verifica si el usuario tiene acceso al proyecto
    await this.projectsService.findOne(createTaskDto.projectId, currentUser);

    if (createTaskDto.assignedToId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: createTaskDto.assignedToId },
      });

      if (!assignee || !assignee.isActive) {
        throw new NotFoundException('No se encontró el desarrollador');
      }

      // Verifica si el desarrollador asignado es parte del proyecto
      const isAssigneeInProject = await this.prisma.projectDeveloper.findFirst({
        where: {
          projectId: createTaskDto.projectId,
          developerId: createTaskDto.assignedToId,
        },
      });

      if (!isAssigneeInProject && assignee.role === UserRole.DEVELOPER) {
        throw new ForbiddenException('EL desarrolladorno es parte de este proyecto');
      }
    }

    return this.prisma.task.create({
      data: createTaskDto,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findByProject(projectId: string, filters: TaskFilters, currentUser: User) {
    // Verify project access
    await this.projectsService.findOne(projectId, currentUser);

    const { page, limit, skip } = calculatePagination(filters);

    const where: Prisma.TaskWhereInput = {
      projectId,
      deletedAt: null,
    };

    // Apply filters
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: filters.sortBy
          ? { [filters.sortBy]: filters.sortOrder || 'asc' }
          : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(filters: TaskFilters, currentUser: User) {
    const { page, limit, skip } = calculatePagination(filters);

    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
    };

    // Verifica el rol del usuario actual y ajusta los filtros
    if (currentUser.role === UserRole.DEVELOPER) {
      where.OR = [
        { assignedToId: currentUser.id },
        {
          project: {
            developers: {
              some: {
                developerId: currentUser.id,
              },
            },
          },
        },
      ];
    } else if (currentUser.role === UserRole.MANAGER) {
      where.OR = [
        { assignedToId: currentUser.id },
        { project: { managerId: currentUser.id } },
        {
          project: {
            developers: {
              some: {
                developerId: currentUser.id,
              },
            },
          },
        },
      ];
    }

    // Apply filters
    if (filters.search) {
      where.AND = [
        ...((Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [])),
        {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: filters.sortBy
          ? { [filters.sortBy]: filters.sortOrder || 'asc' }
          : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: User) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            managerId: true,
            developers: {
              include: {
                developer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Valida el acceso del usuario a la tarea
    const hasAccess = this.checkTaskAccess(task, currentUser);
    if (!hasAccess) {
      throw new ForbiddenException('Acceso denegado a esta tarea');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, currentUser: User) {
    const existingTask = await this.findOne(id, currentUser);

    // Valida si el usuario puede actualizar la tarea
    const canUpdate = this.canUpdateTask(existingTask, currentUser);
    if (!canUpdate) {
      throw new ForbiddenException('Acceso denegado para actualizar esta tarea');
    }

    // Valida si se asigna un desarrollador
    if (updateTaskDto.assignedToId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: updateTaskDto.assignedToId },
      });

      if (!assignee || !assignee.isActive) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Valida si el desarrollador asignado es parte del proyecto
      const isAssigneeInProject = await this.prisma.projectDeveloper.findFirst({
        where: {
          projectId: existingTask.projectId,
          developerId: updateTaskDto.assignedToId,
        },
      });

      if (!isAssigneeInProject && assignee.role === UserRole.DEVELOPER) {
        throw new ForbiddenException('El desarrollador no es parte de este proyecto');
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: TaskStatus, currentUser: User) {
    const task = await this.findOne(id, currentUser);

    // Valida si el usuario puede actualizar el estado de la tarea
    const canUpdate = this.canUpdateTask(task, currentUser);
    if (!canUpdate) {
      throw new ForbiddenException('Acceso denegado para actualizar el estado de esta tarea');
    }

    return this.prisma.task.update({
      where: { id },
      data: { status },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(id: string, currentUser: User) {
    const task = await this.findOne(id, currentUser);

    // Solo admins, managers del proyecto o el usuario asignado pueden eliminar la tarea
    if (
      currentUser.role !== UserRole.ADMIN &&
      task.project.managerId !== currentUser.id &&
      task.assignedToId !== currentUser.id
    ) {
      throw new ForbiddenException('Acceso denegado para eliminar esta tarea');
    }

    // Soft delete
    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getMyTasks(currentUser: User, filters: TaskFilters) {
    const { page, limit, skip } = calculatePagination(filters);

    const where: Prisma.TaskWhereInput = {
      assignedToId: currentUser.id,
      deletedAt: null,
    };

    // Filtros
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: filters.sortBy
          ? { [filters.sortBy]: filters.sortOrder || 'asc' }
          : [{ status: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private checkTaskAccess(task: any, user: User): boolean {
    // Admin tiene acceso a todas las tareas
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // manager tiene acceso a todas las tareas de su proyecto
    if (user.role === UserRole.MANAGER && task.project.managerId === user.id) {
      return true;
    }

    // El usuario asignado a la tarea tiene acceso
    if (task.assignedToId === user.id) {
      return true;
    }

    // El desarrollador del proyecto tiene acceso
    if (user.role === UserRole.DEVELOPER) {
      return task.project.developers.some((pd: any) => pd.developer.id === user.id);
    }

    return false;
  }

  private canUpdateTask(task: any, user: User): boolean {
    // Admin puede actualizar todas las tareas
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // manager puede actualizar tareas de su proyecto
    if (user.role === UserRole.MANAGER && task.project.managerId === user.id) {
      return true;
    }

    // El usuario asignado a la tarea puede actualizarla
    if (task.assignedToId === user.id) {
      return true;
    }

    return false;
  }
}
