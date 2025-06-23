import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '@nutrabiotics-system/shared-types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthUser = {
    user: {
      id: 'user-id-1',
      name: 'Test User',
      email: 'test@test.com',
      role: UserRole.DEVELOPER,
      isActive: true,
      avatar: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('login', () => {
    it('should return auth user on successful login', async () => {
      const loginDto = { email: 'test@test.com', password: 'password123' };
      authService.login.mockResolvedValue(mockAuthUser);

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        success: true,
        data: mockAuthUser,
        message: 'Ok',
      });
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    it('should return auth user on successful registration', async () => {
      const registerDto = {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
        confirmPassword: 'password123',
      };
      authService.register.mockResolvedValue(mockAuthUser);

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        success: true,
        data: mockAuthUser,
        message: 'Ok',
      });
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const req = { user: mockAuthUser.user };

      const result = await controller.getProfile(req);

      expect(result).toEqual({
        success: true,
        data: mockAuthUser.user,
        message: 'Ok',
      });
    });
  });

  describe('refresh', () => {
    it('should return new tokens', async () => {
      const refreshToken = 'refresh-token';
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      authService.refreshTokens.mockResolvedValue(newTokens);

      const result = await controller.refresh(refreshToken);

      expect(result).toEqual({
        success: true,
        data: newTokens,
        message: 'Ok',
      });
      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const req = { user: mockAuthUser.user };
      const refreshToken = 'refresh-token';
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(req, refreshToken);

      expect(result).toEqual({
        success: true,
        data: null,
        message: 'Ok',
      });
      expect(authService.logout).toHaveBeenCalledWith(mockAuthUser.user.id, refreshToken);
    });
  });
});
