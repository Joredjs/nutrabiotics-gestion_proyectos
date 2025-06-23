import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ProjectsService } from '../projects/projects.service';
import { PrismaService } from '../db/prisma.service';
import {
  UserRole,
  TaskStatus,
  Priority,
  User,
  Task,
} from '@nutrabiotics-system/shared-types';

describe('TasksService', () => {
  let service: TasksService;
  let prismaService: any;
  let projectsService: jest.Mocked<ProjectsService>;

  const mockUser: User = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@test.com',
    role: UserRole.DEVELOPER,
    isActive: true,
    avatar: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProjectTransformed = {
    id: 'project-id',
    name: 'Test Project',
    description: 'Test Description',
    status: 'IN_PROGRESS' as any,
    priority: Priority.HIGH,
    startDate: new Date(),
    endDate: new Date(),
    managerId: 'manager-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    manager: {
      id: 'manager-id',
      name: 'Manager User',
      email: 'manager@test.com',
      role: UserRole.MANAGER,
      avatar: null,
    },
    developers: [
      {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        avatar: mockUser.avatar,
      }
    ],
    tasks: [],
  };

  const mockTask: Task = {
    id: 'task-id',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    projectId: 'project-id',
    assignedToId: 'user-id',
    estimatedHours: 8,
    actualHours: 0,
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            projectDeveloper: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: ProjectsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prismaService = module.get(PrismaService);
    projectsService = module.get(ProjectsService);
  });

  describe('create', () => {
    const createTaskDto = {
      title: 'New Task',
      description: 'New Description',
      priority: Priority.HIGH,
      projectId: 'project-id',
      assignedToId: 'user-id',
      estimatedHours: 8,
      dueDate: new Date(),
    };

    it('should create task successfully', async () => {
      projectsService.findOne.mockResolvedValue(mockProjectTransformed);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.projectDeveloper.findFirst.mockResolvedValue({
        id: 'assignment-id',
        projectId: 'project-id',
        developerId: 'user-id',
        assignedAt: new Date(),
      });
      prismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, mockUser);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when assignee not found', async () => {
      projectsService.findOne.mockResolvedValue(mockProjectTransformed);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createTaskDto, mockUser))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when assignee not in project', async () => {
      projectsService.findOne.mockResolvedValue(mockProjectTransformed);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.projectDeveloper.findFirst.mockResolvedValue(null);

      await expect(service.create(createTaskDto, mockUser))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return tasks for admin user', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      const mockTasks = [mockTask];

      prismaService.task.findMany.mockResolvedValue(mockTasks);
      prismaService.task.count.mockResolvedValue(1);

      const result = await service.findAll({}, adminUser);

      expect(result.data).toEqual(mockTasks);
      expect(result.meta.total).toBe(1);
    });

    it('should filter tasks for developer user', async () => {
      const mockTasks = [mockTask];
      prismaService.task.findMany.mockResolvedValue(mockTasks);
      prismaService.task.count.mockResolvedValue(1);

      await service.findAll({}, mockUser);

      expect(prismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { assignedToId: mockUser.id },
              {
                project: {
                  developers: {
                    some: {
                      developerId: mockUser.id,
                    },
                  },
                },
              },
            ]),
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    const taskWithProject = {
      ...mockTask,
      assignedToId: mockUser.id, // Asegurar que esté presente
      estimatedHours: 8,
      actualHours: 0,
      dueDate: new Date(),
      deletedAt: null,
      project: {
        id: 'project-id',
        name: 'Test Project',
        status: 'IN_PROGRESS' as any,
        managerId: 'manager-id',
        developers: [
          {
            id: 'assignment-id',
            projectId: 'project-id',
            developerId: mockUser.id,
            assignedAt: new Date(),
            developer: {
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              avatar: mockUser.avatar,
            },
          }
        ],
      },
      assignedTo: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        avatar: mockUser.avatar,
      },
    };

    it('should return task when user has access', async () => {
      prismaService.task.findFirst.mockResolvedValue(taskWithProject);

      const result = await service.findOne('task-id', mockUser);

      expect(result).toEqual(taskWithProject);
    });

    it('should throw NotFoundException when task not found', async () => {
      prismaService.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', mockUser))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no access', async () => {
      const taskWithoutAccess = {
        ...mockTask,
        estimatedHours: 8,
        actualHours: 0,
        dueDate: new Date(),
        deletedAt: null,
        assignedToId: 'other-user-id',
        project: {
          id: 'project-id',
          name: 'Test Project',
          status: 'IN_PROGRESS' as any,
          managerId: 'other-manager-id',
          developers: [
            {
              id: 'assignment-id',
              projectId: 'project-id',
              developerId: 'other-user-id',
              assignedAt: new Date(),
              developer: {
                id: 'other-user-id',
                name: 'Other User',
                email: 'other@test.com',
                avatar: null,
              },
            }
          ],
        },
        assignedTo: {
          id: 'other-user-id',
          name: 'Other User',
          email: 'other@test.com',
          avatar: null,
        },
      };

      prismaService.task.findFirst.mockResolvedValue(taskWithoutAccess);

      await expect(service.findOne('task-id', mockUser))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateTaskDto = {
      title: 'Updated Task',
      description: 'Updated Description',
      status: TaskStatus.IN_PROGRESS,
    };

    const taskWithProject = {
      ...mockTask,
      assignedToId: mockUser.id,
      estimatedHours: 8,
      actualHours: 0,
      dueDate: new Date(),
      deletedAt: null,
      project: {
        id: 'project-id',
        name: 'Test Project',
        status: 'IN_PROGRESS' as any,
        managerId: 'manager-id',
        developers: [
          {
            id: 'assignment-id',
            projectId: 'project-id',
            developerId: mockUser.id,
            assignedAt: new Date(),
            developer: {
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              avatar: mockUser.avatar,
            },
          }
        ],
      },
      assignedTo: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        avatar: mockUser.avatar,
      },
    };

    it('should update task when user has permission', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(taskWithProject);
      prismaService.task.update.mockResolvedValue(mockTask);

      const result = await service.update('task-id', updateTaskDto, mockUser);

      expect(result).toEqual(mockTask);
      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-id' },
        data: updateTaskDto,
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException when user cannot update task', async () => {
      const taskWithoutAccess = {
        ...mockTask,
        estimatedHours: 8,
        actualHours: 0,
        dueDate: new Date(),
        deletedAt: null,
        assignedToId: 'other-user-id',
        project: {
          id: 'project-id',
          name: 'Test Project',
          status: 'IN_PROGRESS' as any,
          managerId: 'other-manager-id',
          developers: [
            {
              id: 'assignment-id',
              projectId: 'project-id',
              developerId: 'other-user-id',
              assignedAt: new Date(),
              developer: {
                id: 'other-user-id',
                name: 'Other User',
                email: 'other@test.com',
                avatar: null,
              },
            }
          ],
        },
        assignedTo: {
          id: 'other-user-id',
          name: 'Other User',
          email: 'other@test.com',
          avatar: null,
        },
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(taskWithoutAccess);

      await expect(service.update('task-id', updateTaskDto, mockUser))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    const taskWithProject = {
      ...mockTask,
      assignedToId: mockUser.id,
      estimatedHours: 8,
      actualHours: 0,
      dueDate: new Date(),
      deletedAt: null,
      project: {
        id: 'project-id',
        name: 'Test Project',
        status: 'IN_PROGRESS' as any,
        managerId: 'manager-id',
        developers: [
          {
            id: 'assignment-id',
            projectId: 'project-id',
            developerId: mockUser.id,
            assignedAt: new Date(),
            developer: {
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              avatar: mockUser.avatar,
            },
          }
        ],
      },
      assignedTo: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        avatar: mockUser.avatar,
      },
    };

    it('should update task status successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(taskWithProject);
      prismaService.task.update.mockResolvedValue(mockTask);

      const result = await service.updateStatus('task-id', TaskStatus.DONE, mockUser);

      expect(result).toEqual(mockTask);
      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-id' },
        data: { status: TaskStatus.DONE },
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    const taskWithProject = {
      ...mockTask,
      estimatedHours: 8,
      actualHours: 0,
      dueDate: new Date(),
      deletedAt: null,
      assignedToId: mockUser.id,
      project: {
        id: 'project-id',
        name: 'Test Project',
        status: 'IN_PROGRESS' as any,
        managerId: 'manager-id',
        developers: [
          {
            id: 'assignment-id',
            projectId: 'project-id',
            developerId: mockUser.id,
            assignedAt: new Date(),
            developer: {
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              avatar: mockUser.avatar,
            },
          }
        ],
      },
      assignedTo: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        avatar: mockUser.avatar,
      },
    };

    it('should delete task when user is assigned to it', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(taskWithProject);
      prismaService.task.update.mockResolvedValue(mockTask);

      await service.remove('task-id', mockUser);

      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-id' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw ForbiddenException when user cannot delete task', async () => {
      const taskWithoutAccess = {
        ...mockTask,
        estimatedHours: 8,
        actualHours: 0,
        dueDate: new Date(),
        deletedAt: null,
        assignedToId: 'other-user-id',
        project: {
          id: 'project-id',
          name: 'Test Project',
          status: 'IN_PROGRESS' as any,
          managerId: 'other-manager-id',
          developers: [
            {
              id: 'assignment-id',
              projectId: 'project-id',
              developerId: 'other-user-id',
              assignedAt: new Date(),
              developer: {
                id: 'other-user-id',
                name: 'Other User',
                email: 'other@test.com',
                avatar: null,
              },
            }
          ],
        },
        assignedTo: {
          id: 'other-user-id',
          name: 'Other User',
          email: 'other@test.com',
          avatar: null,
        },
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(taskWithoutAccess);

      await expect(service.remove('task-id', mockUser))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyTasks', () => {
    it('should return user assigned tasks', async () => {
      const mockTasks = [mockTask];
      prismaService.task.findMany.mockResolvedValue(mockTasks);
      prismaService.task.count.mockResolvedValue(1);

      const result = await service.getMyTasks(mockUser, {});

      expect(result.data).toEqual(mockTasks);
      expect(prismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedToId: mockUser.id,
          }),
        })
      );
    });

    it('should apply project filter', async () => {
      prismaService.task.findMany.mockResolvedValue([]);
      prismaService.task.count.mockResolvedValue(0);

      await service.getMyTasks(mockUser, { projectId: 'project-id' });

      expect(prismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'project-id',
          }),
        })
      );
    });
  });
});
