import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IUserRepository } from '../common/interfaces/user-repository.interface';
import { IAuthRepository } from '../common/interfaces/auth-repository.interface';
import { REPOSITORY_TOKENS } from '../repositories/repository.tokens';
import {
  AuthTokens,
  AuthUser,
  User,
  UserRole,
} from '@nutrabiotics-system/shared-types';

@Injectable()
export class AuthService {
  constructor(

    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(REPOSITORY_TOKENS.AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    console.log('AuthService inicializado');
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    console.log('validando usuario:', email);

    const user = await this.userRepository.findByEmail(email);
    console.log('usuario encontrado:', !!user);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      console.log('credenciales válidas para:', email);
      return result as User;
    }

    console.log('credenciales inválidas para:', email);
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthUser> {
    console.log('AuthService.login llamado para:', loginDto.email);

    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('El usuario no está activo');
    }

    await this.userRepository.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.email);

    await this.authRepository.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      this.getRefreshTokenExpiration()
    );

    console.log('login exitoso para usuario:', user.email);

    return {
      user,
      tokens,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthUser> {
    console.log('registrando usuario:', registerDto.email);

    if (registerDto.password !== registerDto.confirmPassword) {
      throw new ConflictException('Las contraseñas no coinciden');
    }

    const existingUser = await this.userRepository.findByEmail(
      registerDto.email
    );

    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario con este correo electrónico'
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.DEVELOPER,
    });

    const tokens = await this.generateTokens(user.id, user.email);

    await this.authRepository.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      this.getRefreshTokenExpiration()
    );

    console.log('usuario registrado exitosamente:', user.email);

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

      const storedToken = await this.authRepository.findRefreshToken(
        refreshToken
      );

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expirado o no válido');
      }

      await this.authRepository.deleteRefreshToken(storedToken.id);

      const tokens = await this.generateTokens(payload.sub, payload.email);

      await this.authRepository.storeRefreshToken(
        payload.sub,
        tokens.refreshToken,
        this.getRefreshTokenExpiration()
      );

      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.authRepository.deleteUserRefreshTokens(userId, refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.deleteAllRefreshTokens(userId);
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

  private getRefreshTokenExpiration(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }
}
