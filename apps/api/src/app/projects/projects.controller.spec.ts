import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { UserRole, Priority, ProjectStatus } from '@nutrabiotics-system/shared-types';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let projectsService: jest.Mocked<ProjectsService>;

  const mockUser = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@test.com',
    role: UserRole.MANAGER,
    isActive: true,
    avatar: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeveloper = {
    id: 'dev-id',
    name: 'Developer User',
    email: 'dev@test.com',
    avatar: null,
  };

  // Mock actualizado con la estructura completa que espera Prisma
  const mockProject = {
    id: 'project-id',
    name: 'Test Project',
    description: 'Test Description',
    status: ProjectStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    startDate: new Date(),
    endDate: new Date(),
    managerId: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    manager: {
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
      avatar: mockUser.avatar,
    },
    developers: [
      {
        id: 'assignment-id',
        projectId: 'project-id',
        developerId: 'dev-id',
        assignedAt: new Date(),
        developer: mockDeveloper,
      }
    ],
    _count: {
      tasks: 5,
      developers: 1,
    },
  };

  const mockPaginatedResult = {
    data: [{
      ...mockProject,
      developers: [mockDeveloper], // Ya transformado para findAll
    }],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getProjectStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    projectsService = module.get(ProjectsService);
  });

  describe('create', () => {
    it('should create project successfully', async () => {
      const createProjectDto = {
        name: 'New Project',
        description: 'New Description',
        priority: Priority.HIGH,
        startDate: new Date(),
        managerId: 'user-id',
        developerIds: [],
      };
      projectsService.create.mockResolvedValue(mockProject);

      const result = await controller.create(createProjectDto, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockProject,
        message: 'Ok',
      });
      expect(projectsService.create).toHaveBeenCalledWith(createProjectDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const filters = { page: 1, limit: 10 };
      projectsService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(filters, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockPaginatedResult.data,
        meta: mockPaginatedResult.meta,
        message: 'Ok',
      });
      expect(projectsService.findAll).toHaveBeenCalledWith(filters, mockUser);
    });
  });

  describe('findOne', () => {
    it('should return project by id', async () => {
      // Mock para findOne que retorna estructura transformada
      const transformedProject = {
        ...mockProject,
        developers: [mockDeveloper], // Ya transformado sin la estructura intermedia
        tasks: [], // Requerido por el service
      };

      projectsService.findOne.mockResolvedValue(transformedProject);

      const result = await controller.findOne('project-id', mockUser);

      expect(result).toEqual({
        success: true,
        data: transformedProject,
        message: 'Ok',
      });
      expect(projectsService.findOne).toHaveBeenCalledWith('project-id', mockUser);
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      const mockStats = {
        project: {
          id: mockProject.id,
          name: mockProject.name,
          status: mockProject.status,
          priority: mockProject.priority,
        },
        stats: {
          totalTasks: 10,
          totalDevelopers: 3,
          tasksByStatus: { TODO: 3, IN_PROGRESS: 4, REVIEW: 2, DONE: 1 },
          tasksByPriority: { LOW: 2, MEDIUM: 5, HIGH: 3 },
          totalEstimatedHours: 80,
          totalActualHours: 45,
          completionRate: 10,
        },
      };
      projectsService.getProjectStats.mockResolvedValue(mockStats);

      const result = await controller.getProjectStats('project-id', mockUser);

      expect(result).toEqual({
        success: true,
        data: mockStats,
        message: 'Ok',
      });
      expect(projectsService.getProjectStats).toHaveBeenCalledWith('project-id', mockUser);
    });
  });

  describe('update', () => {
    it('should update project successfully', async () => {
      const updateProjectDto = { name: 'Updated Project' };
      const updatedProject = { ...mockProject, name: 'Updated Project' };
      projectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update('project-id', updateProjectDto, mockUser);

      expect(result).toEqual({
        success: true,
        data: updatedProject,
        message: 'Ok',
      });
      expect(projectsService.update).toHaveBeenCalledWith('project-id', updateProjectDto, mockUser);
    });
  });

  describe('remove', () => {
    it('should delete project successfully', async () => {
      projectsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('project-id', mockUser);

      expect(result).toEqual({
        success: true,
        data: null,
        message: 'Ok',
      });
      expect(projectsService.remove).toHaveBeenCalledWith('project-id', mockUser);
    });
  });
});
