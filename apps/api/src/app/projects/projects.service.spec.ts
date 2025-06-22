import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../db/prisma.service';
import {
  UserRole,
  ProjectStatus,
  Priority,
  User,
  Project
} from '@nutrabiotics-system/shared-types';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaService: any;

  const mockAdminUser: User = {
    id: 'admin-id',
    name: 'Admin User',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    isActive: true,
    avatar: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockManagerUser: User = {
    id: 'manager-id',
    name: 'Manager User',
    email: 'manager@test.com',
    role: UserRole.MANAGER,
    isActive: true,
    avatar: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeveloperUser: User = {
    id: 'dev-id',
    name: 'Developer User',
    email: 'dev@test.com',
    role: UserRole.DEVELOPER,
    isActive: true,
    avatar: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject: Project = {
    id: 'project-id',
    name: 'Test Project',
    description: 'Test Description',
    status: ProjectStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    startDate: new Date(),
    endDate: new Date(),
    managerId: 'manager-id',
    manager: mockManagerUser,
    developers: [mockDeveloperUser],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaTransaction = {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    projectDeveloper: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            projectDeveloper: {
              createMany: jest.fn(),
              deleteMany: jest.fn(),
              findFirst: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    const createProjectDto = {
      name: 'New Project',
      description: 'New Description',
      priority: Priority.HIGH,
      startDate: new Date(),
      endDate: new Date(),
      managerId: 'manager-id',
      developerIds: ['dev-id'],
    };

    it('should create project when user is admin', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockManagerUser);
      prismaService.user.findMany.mockResolvedValue([mockDeveloperUser]);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaTransaction);
      });
      mockPrismaTransaction.project.create.mockResolvedValue(mockProject);
      mockPrismaTransaction.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.create(createProjectDto, mockAdminUser);

      expect(result).toEqual(mockProject);
    });

    it('should throw ForbiddenException when user is developer', async () => {
      await expect(service.create(createProjectDto, mockDeveloperUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when manager not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createProjectDto, mockAdminUser))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return projects for admin user', async () => {
      const mockProjects = [mockProject];
      prismaService.project.findMany.mockResolvedValue(mockProjects);
      prismaService.project.count.mockResolvedValue(1);

      const result = await service.findAll({}, mockAdminUser);

      expect(result.data).toEqual(mockProjects);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return project when found and user has access', async () => {
      const projectFromPrisma = {
        ...mockProject,
        manager: {
          id: mockManagerUser.id,
          name: mockManagerUser.name,
          email: mockManagerUser.email,
          role: mockManagerUser.role,
          avatar: mockManagerUser.avatar,
        },
        developers: [
          {
            id: 'assignment-id',
            projectId: 'project-id',
            developerId: 'dev-id',
            assignedAt: new Date(),
            developer: mockDeveloperUser,
          }
        ],
        tasks: [],
      };

      prismaService.project.findFirst.mockResolvedValue(projectFromPrisma);

      const result = await service.findOne('project-id', mockAdminUser);

      expect(result).toBeDefined();
      expect(result.id).toBe('project-id');
      expect(result.developers).toEqual([mockDeveloperUser]);
    });

    it('should throw NotFoundException when project not found', async () => {
      prismaService.project.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', mockAdminUser))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateProjectDto = {
      name: 'Updated Project',
      description: 'Updated Description',
    };

    it('should update project when user is admin', async () => {
      const projectFromFindOne = {
        ...mockProject,
        manager: {
          id: mockManagerUser.id,
          name: mockManagerUser.name,
          email: mockManagerUser.email,
          role: mockManagerUser.role,
          avatar: mockManagerUser.avatar,
        },
        developers: [
          {
            id: mockDeveloperUser.id,
            name: mockDeveloperUser.name,
            email: mockDeveloperUser.email,
            avatar: mockDeveloperUser.avatar,
          }
        ],
        tasks: [],
        endDate: new Date(),
        deletedAt: null,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(projectFromFindOne);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaTransaction);
      });
      mockPrismaTransaction.project.update.mockResolvedValue(mockProject);
      mockPrismaTransaction.project.findUnique.mockResolvedValue({
        ...mockProject,
        manager: {
          id: mockManagerUser.id,
          name: mockManagerUser.name,
          email: mockManagerUser.email,
          role: mockManagerUser.role,
          avatar: mockManagerUser.avatar,
        },
        developers: [
          {
            id: 'assignment-id',
            projectId: 'project-id',
            developerId: 'dev-id',
            assignedAt: new Date(),
            developer: mockDeveloperUser,
          }
        ],
        _count: { tasks: 5 },
      });

      const result = await service.update('project-id', updateProjectDto, mockAdminUser);

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when user is not project manager', async () => {
      const projectFromFindOne = {
        ...mockProject,
        managerId: 'other-manager-id',
        manager: {
          id: 'other-manager-id',
          name: 'Other Manager',
          email: 'other@test.com',
          role: UserRole.MANAGER,
          avatar: null,
        },
        developers: [
          {
            id: mockDeveloperUser.id,
            name: mockDeveloperUser.name,
            email: mockDeveloperUser.email,
            avatar: mockDeveloperUser.avatar,
          }
        ],
        tasks: [],
        endDate: new Date(),
        deletedAt: null,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(projectFromFindOne);

      await expect(service.update('project-id', updateProjectDto, mockManagerUser))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete project when user is admin', async () => {
      const projectFromFindOne = {
        ...mockProject,
        manager: {
          id: mockManagerUser.id,
          name: mockManagerUser.name,
          email: mockManagerUser.email,
          role: mockManagerUser.role,
          avatar: mockManagerUser.avatar,
        },
        developers: [
          {
            id: mockDeveloperUser.id,
            name: mockDeveloperUser.name,
            email: mockDeveloperUser.email,
            avatar: mockDeveloperUser.avatar,
          }
        ],
        tasks: [],
        endDate: new Date(),
        deletedAt: null,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(projectFromFindOne);
      prismaService.project.update.mockResolvedValue(mockProject);

      await service.remove('project-id', mockAdminUser);

      expect(prismaService.project.update).toHaveBeenCalledWith({
        where: { id: 'project-id' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw ForbiddenException when user is not admin', async () => {
      const projectFromFindOne = {
        ...mockProject,
        manager: {
          id: mockManagerUser.id,
          name: mockManagerUser.name,
          email: mockManagerUser.email,
          role: mockManagerUser.role,
          avatar: mockManagerUser.avatar,
        },
        developers: [
          {
            id: mockDeveloperUser.id,
            name: mockDeveloperUser.name,
            email: mockDeveloperUser.email,
            avatar: mockDeveloperUser.avatar,
          }
        ],
        tasks: [],
        endDate: new Date(),
        deletedAt: null,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(projectFromFindOne);

      await expect(service.remove('project-id', mockManagerUser))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
