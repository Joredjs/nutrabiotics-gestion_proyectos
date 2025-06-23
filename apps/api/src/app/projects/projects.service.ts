import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectFilters,
  UserRole,
  User,
} from '@nutrabiotics-system/shared-types';
import { calculatePagination } from '@nutrabiotics-system/shared-utils';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, currentUser: User) {
    // Solo admin y manager pueden crear proyectos
    if (![UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role)) {
      throw new ForbiddenException('Only admins and managers can create projects');
    }

    // Verifica que el manager existe y es válido
    const manager = await this.prisma.user.findUnique({
      where: { id: createProjectDto.managerId },
    });

    if (!manager || ![UserRole.ADMIN, UserRole.MANAGER].includes(manager.role as UserRole)) {
      throw new NotFoundException('Manager not found or invalid role');
    }

    // Verifica que los desarrolladores existen y están activos
    if (createProjectDto.developerIds.length > 0) {
      const developers = await this.prisma.user.findMany({
        where: {
          id: { in: createProjectDto.developerIds },
          role: UserRole.DEVELOPER,
          isActive: true,
        },
      });

      if (developers.length !== createProjectDto.developerIds.length) {
        throw new NotFoundException('Alguno o más desarrolladores no encontrados');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Crea el proyecto
      const project = await tx.project.create({
        data: {
          name: createProjectDto.name,
          description: createProjectDto.description,
          priority: createProjectDto.priority,
          startDate: createProjectDto.startDate,
          endDate: createProjectDto.endDate,
          managerId: createProjectDto.managerId,
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
      });

      // Asigna desarrolladores al proyecto
      if (createProjectDto.developerIds.length > 0) {
        await tx.projectDeveloper.createMany({
          data: createProjectDto.developerIds.map((developerId) => ({
            projectId: project.id,
            developerId,
          })),
        });
      }

      // Obtener el proyecto con las relaciones
      return tx.project.findUnique({
        where: { id: project.id },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
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
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });
    });
  }

  async findAll(filters: ProjectFilters, currentUser: User) {
    const { page, limit, skip } = calculatePagination(filters);



    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
    };

    // Filtrar por permisos del usuario
    if (currentUser.role === UserRole.DEVELOPER) {
      where.developers = {
        some: {
          developerId: currentUser.id,
        },
      };
    } else if (currentUser.role === UserRole.MANAGER) {
      where.OR = [
        { managerId: currentUser.id },
        {
          developers: {
            some: {
              developerId: currentUser.id,
            },
          },
        },
      ];
    }

    // Aplicar filtros adicionales
    if (filters.search) {
      where.AND = [
        ...((Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [])),
        {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
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

    if (filters.managerId) {
      where.managerId = filters.managerId;
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
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
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: filters.sortBy
          ? { [filters.sortBy]: filters.sortOrder || 'asc' }
          : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    // Transforma los proyectos para incluir los desarrolladores
    const transformedProjects = projects.map((project) => ({
      ...project,
      developers: project.developers.map((pd) => pd.developer),
    }));

    return {
      data: transformedProjects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: User) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
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
        tasks: {
          where: { deletedAt: null },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('El proyecto no existe');
    }

    // Verifica acceso al proyecto
    const hasAccess = this.checkProjectAccess(project, currentUser);
    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para acceder a este proyecto');
    }

    return {
      ...project,
      developers: project.developers.map((pd) => pd.developer),
    };
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, currentUser: User) {
    const existingProject = await this.findOne(id, currentUser);

    // Solo admin y manager pueden actualizar proyectos
    if (
      currentUser.role !== UserRole.ADMIN &&
      existingProject.managerId !== currentUser.id
    ) {
      throw new ForbiddenException('No tienes permisos para actualizar este proyecto');
    }

    // Verifica que el manager existe y es válido
    if (updateProjectDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: updateProjectDto.managerId },
      });

      if (!manager || ![UserRole.ADMIN, UserRole.MANAGER].includes(manager.role as UserRole)) {
        throw new NotFoundException('Managet no encontrado o rol inválido');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Actualiza el proyecto
      await tx.project.update({
        where: { id },
        data: {
          name: updateProjectDto.name,
          description: updateProjectDto.description,
          status: updateProjectDto.status,
          priority: updateProjectDto.priority,
          startDate: updateProjectDto.startDate,
          endDate: updateProjectDto.endDate,
          managerId: updateProjectDto.managerId,
        },
      });

      // Actualiza los desarrolladores del proyecto
      if (updateProjectDto.developerIds) {
        // Quita desarrolladores existentes
        await tx.projectDeveloper.deleteMany({
          where: { projectId: id },
        });

        // Agrega nuevos desarrolladores
        if (updateProjectDto.developerIds.length > 0) {
          // Verifica que los desarrolladores existen y están activos
          const developers = await tx.user.findMany({
            where: {
              id: { in: updateProjectDto.developerIds },
              role: UserRole.DEVELOPER,
              isActive: true,
            },
          });

          if (developers.length !== updateProjectDto.developerIds.length) {
            throw new NotFoundException('Alguno o más desarrolladores no encontrados');
          }

          await tx.projectDeveloper.createMany({
            data: updateProjectDto.developerIds.map((developerId) => ({
              projectId: id,
              developerId,
            })),
          });
        }
      }

      // Retorna el proyecto actualizado con las relaciones
      return tx.project.findUnique({
        where: { id },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
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
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });
    });
  }

  async remove(id: string, currentUser: User) {
    await this.findOne(id, currentUser);

    // Solo admin puede eliminar proyectos
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Recuerda que solo los administradores pueden eliminar proyectos');
    }

    // Soft delete
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getProjectStats(id: string, currentUser: User) {
    const project = await this.findOne(id, currentUser);

    const stats = await this.prisma.project.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null },
            },
            developers: true,
          },
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            status: true,
            priority: true,
            estimatedHours: true,
            actualHours: true,
          },
        },
      },
    });

    const tasksByStatus = stats.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const tasksByPriority = stats.tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    const totalEstimatedHours = stats.tasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );

    const totalActualHours = stats.tasks.reduce(
      (sum, task) => sum + (task.actualHours || 0),
      0
    );

    const completionRate = stats.tasks.length > 0
      ? (tasksByStatus['DONE'] || 0) / stats.tasks.length * 100
      : 0;

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        priority: project.priority,
      },
      stats: {
        totalTasks: stats._count.tasks,
        totalDevelopers: stats._count.developers,
        tasksByStatus,
        tasksByPriority,
        totalEstimatedHours,
        totalActualHours,
        completionRate: Math.round(completionRate * 100) / 100,
      },
    };
  }

  private checkProjectAccess(project: any, user: User): boolean {
    // El administrador tiene acceso a todos los proyectos
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // El manager tiene acceso si es el gerente del proyecto
    if (user.role === UserRole.MANAGER && project.managerId === user.id) {
      return true;
    }

    // EL desarrollador tiene acceso si está asignado al proyecto
    if (user.role === UserRole.DEVELOPER) {
      return project.developers.some((pd: any) => pd.developer.id === user.id);
    }

    return false;
  }
}
