import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { UserRole, Priority, TaskStatus } from '@nutrabiotics-system/shared-types';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: jest.Mocked<TasksService>;

  const mockUser = {
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

  const mockTask = {
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
          developerId: 'user-id',
          assignedAt: new Date(),
          developer: {
            id: 'user-id',
            name: 'Test User',
            email: 'test@test.com',
            avatar: null,
          },
        },
      ],
    },
    assignedTo: {
      id: 'user-id',
      name: 'Test User',
      email: 'test@test.com',
      avatar: null,
    },
  };

  const mockPaginatedResult = {
    data: [mockTask],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            remove: jest.fn(),
            getMyTasks: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get(TasksService);
  });

  describe('create', () => {
    it('should create task successfully', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        priority: Priority.HIGH,
        projectId: 'project-id',
        assignedToId: 'user-id',
        estimatedHours: 8,
        dueDate: new Date(),
      };
      tasksService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockTask,
        message: 'Ok',
      });
      expect(tasksService.create).toHaveBeenCalledWith(createTaskDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const filters = { page: 1, limit: 10 };
      tasksService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(filters, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockPaginatedResult.data,
        meta: mockPaginatedResult.meta,
        message: 'Ok',
      });
      expect(tasksService.findAll).toHaveBeenCalledWith(filters, mockUser);
    });
  });

  describe('getMyTasks', () => {
    it('should return user assigned tasks', async () => {
      const filters = { page: 1, limit: 10 };
      tasksService.getMyTasks.mockResolvedValue(mockPaginatedResult);

      const result = await controller.getMyTasks(filters, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockPaginatedResult.data,
        meta: mockPaginatedResult.meta,
        message: 'Ok',
      });
      expect(tasksService.getMyTasks).toHaveBeenCalledWith(mockUser, filters);
    });
  });

  describe('findOne', () => {
    it('should return task by id', async () => {
      tasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('task-id', mockUser);

      expect(result).toEqual({
        success: true,
        data: mockTask,
        message: 'Ok',
      });
      expect(tasksService.findOne).toHaveBeenCalledWith('task-id', mockUser);
    });
  });

  describe('update', () => {
    it('should update task successfully', async () => {
      const updateTaskDto = { title: 'Updated Task' };
      const updatedTask = { ...mockTask, title: 'Updated Task' };
      tasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update('task-id', updateTaskDto, mockUser);

      expect(result).toEqual({
        success: true,
        data: updatedTask,
        message: 'Ok',
      });
      expect(tasksService.update).toHaveBeenCalledWith('task-id', updateTaskDto, mockUser);
    });
  });

  describe('updateStatus', () => {
    it('should update task status successfully', async () => {
      const updatedTask = { ...mockTask, status: TaskStatus.DONE };
      tasksService.updateStatus.mockResolvedValue(updatedTask);

      const result = await controller.updateStatus('task-id', TaskStatus.DONE, mockUser);

      expect(result).toEqual({
        success: true,
        data: updatedTask,
        message: 'Ok',
      });
      expect(tasksService.updateStatus).toHaveBeenCalledWith('task-id', TaskStatus.DONE, mockUser);
    });
  });

  describe('remove', () => {
    it('should delete task successfully', async () => {
      tasksService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('task-id', mockUser);

      expect(result).toEqual({
        success: true,
        data: null,
        message: 'Ok',
      });
      expect(tasksService.remove).toHaveBeenCalledWith('task-id', mockUser);
    });
  });
});
