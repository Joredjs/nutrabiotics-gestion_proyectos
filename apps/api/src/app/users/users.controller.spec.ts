import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from '@nutrabiotics-system/shared-types';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

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
    _count: {
      managedProjects: 0,
      assignedProjects: 2,
      assignedTasks: 5,
    },
  };

  const mockPaginatedResult = {
    data: [mockUser],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findDevelopers: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            activate: jest.fn(),
            deactivate: jest.fn(),
            getUserStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const createUserDto = {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
        role: UserRole.DEVELOPER,
      };
      usersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual({
        success: true,
        data: mockUser,
        message: 'Ok',
      });
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const query = { page: 1, limit: 10 };
      usersService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(query);

      expect(result).toEqual({
        success: true,
        data: mockPaginatedResult.data,
        meta: mockPaginatedResult.meta,
        message: 'Ok',
      });
      expect(usersService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findDevelopers', () => {
    it('should return developers for assignment', async () => {
      const query = { page: 1, limit: 10 };
      const mockDevelopers = {
        data: [{
          id: 'dev-id',
          name: 'Developer User',
          email: 'dev@test.com',
          avatar: null,
          lastLoginAt: null,
          _count: {
            assignedProjects: 2,
            assignedTasks: 3,
          },
        }],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      usersService.findDevelopers.mockResolvedValue(mockDevelopers);

      const result = await controller.findDevelopers(query);

      expect(result).toEqual({
        success: true,
        data: mockDevelopers.data,
        meta: mockDevelopers.meta,
        message: 'Ok',
      });
      expect(usersService.findDevelopers).toHaveBeenCalledWith(query);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual({
        success: true,
        data: mockUser,
        message: 'Ok',
      });
      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        user: mockUser,
        stats: {
          totalManagedProjects: 2,
          totalAssignedProjects: 1,
          totalAssignedTasks: 5,
          tasksByStatus: { TODO: 2, IN_PROGRESS: 2, DONE: 1 },
          projectsByStatus: { IN_PROGRESS: 2 },
        },
      };
      usersService.getUserStats.mockResolvedValue(mockStats);

      const result = await controller.getUserStats(mockUser);

      expect(result).toEqual({
        success: true,
        data: mockStats,
        message: 'Ok',
      });
      expect(usersService.getUserStats).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-id');

      expect(result).toEqual({
        success: true,
        data: mockUser,
        message: 'Ok',
      });
      expect(usersService.findById).toHaveBeenCalledWith('user-id');
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateUserDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-id', updateUserDto);

      expect(result).toEqual({
        success: true,
        data: updatedUser,
        message: 'Ok',
      });
      expect(usersService.update).toHaveBeenCalledWith('user-id', updateUserDto);
    });
  });

  describe('deactivate', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      usersService.deactivate.mockResolvedValue(deactivatedUser);

      const result = await controller.deactivate('user-id');

      expect(result).toEqual({
        success: true,
        data: deactivatedUser,
        message: 'Ok',
      });
      expect(usersService.deactivate).toHaveBeenCalledWith('user-id');
    });
  });

  describe('activate', () => {
    it('should activate user successfully', async () => {
      usersService.activate.mockResolvedValue(mockUser);

      const result = await controller.activate('user-id');

      expect(result).toEqual({
        success: true,
        data: mockUser,
        message: 'Ok',
      });
      expect(usersService.activate).toHaveBeenCalledWith('user-id');
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      usersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('user-id');

      expect(result).toEqual({
        success: true,
        data: null,
        message: 'Ok',
      });
      expect(usersService.remove).toHaveBeenCalledWith('user-id');
    });
  });
});
