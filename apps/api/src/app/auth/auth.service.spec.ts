import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../db/prisma.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '@nutrabiotics-system/shared-types';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-id-1',
    name: 'Test User',
    email: 'test@test.com',
    password: 'hashedPassword',
    role: UserRole.DEVELOPER,
    isActive: true,
    avatar: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockRefreshToken = {
    id: 'token-id',
    token: 'refresh-token',
    userId: 'user-id-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    usersService = module.get(UsersService);
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      const email = 'test@test.com';
      const password = 'password123';

      usersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        isActive: mockUser.isActive,
        avatar: mockUser.avatar,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@test.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser('test@test.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@test.com', password: 'password123' };

    it('should return auth user when credentials are valid', async () => {
      const userWithoutPassword = { ...mockUser };
      delete userWithoutPassword.password;

      jest.spyOn(service, 'validateUser').mockResolvedValue(userWithoutPassword as any);
      usersService.updateLastLogin.mockResolvedValue(undefined);
      jwtService.signAsync.mockResolvedValue('mock-token');
      prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      delete inactiveUser.password;

      jest.spyOn(service, 'validateUser').mockResolvedValue(inactiveUser as any);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerDto = {
      name: 'New User',
      email: 'new@test.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    it('should create and return new user', async () => {
      const newUser = { ...mockUser, id: 'new-user-id', name: registerDto.name, email: registerDto.email };

      usersService.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      usersService.create.mockResolvedValue(newUser);
      jwtService.signAsync.mockResolvedValue('mock-token');
      prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException when user already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when passwords do not match', async () => {
      const invalidRegisterDto = { ...registerDto, confirmPassword: 'differentPassword' };
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.register(invalidRegisterDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 'user-id-1', email: 'test@test.com' };

      jwtService.verify.mockReturnValue(payload);
      prismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      prismaService.refreshToken.delete.mockResolvedValue(mockRefreshToken);
      jwtService.signAsync.mockResolvedValue('new-token');
      prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await service.refreshTokens(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when refresh token is expired', async () => {
      const expiredToken = { ...mockRefreshToken, expiresAt: new Date(Date.now() - 1000) };
      jwtService.verify.mockReturnValue({ sub: 'user-id-1', email: 'test@test.com' });
      prismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete refresh token successfully', async () => {
      const userId = 'user-id-1';
      const refreshToken = 'refresh-token';

      prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout(userId, refreshToken);

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId, token: refreshToken },
      });
    });
  });

  describe('logoutAll', () => {
    it('should delete all refresh tokens for user', async () => {
      const userId = 'user-id-1';

      prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await service.logoutAll(userId);

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
