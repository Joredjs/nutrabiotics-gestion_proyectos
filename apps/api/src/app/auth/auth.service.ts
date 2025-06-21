import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../db/prisma.service';
import { UsersService } from '../users/users.service';
import {
  LoginDto,
  RegisterDto,
  AuthTokens,
  AuthUser,
  User,
  CreateUserDto,
} from '@nutrabiotics-system/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result as User;
    }

    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthUser> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('El usuario no está activo');
    }

    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      tokens,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthUser> {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new ConflictException('Las contraseñas no coinciden');
    }

    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario con este correo electrónico'
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const userData = {
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: 'DEVELOPER' as const,
    } as CreateUserDto;

    const user = await this.usersService.create(userData);
    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: user as User,
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get(
          'JWT_REFRESH_SECRET',
          'jwt-refresh-secret-dev'
        ),
      });

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expirado o no válido');
      }

      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      const tokens = await this.generateTokens(payload.sub, payload.email);
      await this.storeRefreshToken(payload.sub, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private async generateTokens(
    userId: string,
    email: string
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET', 'jwt-secret-dev'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get(
          'JWT_REFRESH_SECRET',
          'jwt-refresh-secret-dev'
        ),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
  }
}
