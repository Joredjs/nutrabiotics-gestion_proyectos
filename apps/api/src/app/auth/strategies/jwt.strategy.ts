import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '../../common/interfaces/user-repository.interface';
import { REPOSITORY_TOKENS } from '../../repositories/repository.tokens';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService?.get('JWT_SECRET') || 'jwt-secret-dev',
    });
  }

  async validate(payload: any) {
    console.log('validando JWT payload para usuario:', payload.sub);

    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      console.log('usuario no encontrado o inactivo');
      throw new UnauthorizedException('Token inválido');
    }

    console.log('JWT válido para usuario:', user.email);
    return user;
  }
}
