import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  ApiResponse as ApiResponseType,
  AuthUser,
  User,
} from '@nutrabiotics-system/shared-types';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
    console.log('AuthController inicializado',
      authService
    );
    console.log('AuthService disponible:', !!this.authService);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicio de sesión' })
  async login(@Body() loginDto: LoginDto): Promise<ApiResponseType<AuthUser>> {
    console.log('AuthController.login llamado para:', loginDto.email);

    const result = await this.authService.login(loginDto);

    return {
      success: true,
      data: result,
      message: 'Ok',
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Registro de usuario' })
  async register(
    @Body() registerDto: RegisterDto
  ): Promise<ApiResponseType<AuthUser>> {
    const result = await this.authService.register(registerDto);

    return {
      success: true,
      data: result,
      message: 'Ok',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil de usuario' })
  async getProfile(@Request() req): Promise<ApiResponseType<User>> {
    return {
      success: true,
      data: req.user,
      message: 'Ok',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar access token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<ApiResponseType<any>> {
    const tokens = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken
    );

    return {
      success: true,
      data: tokens,
      message: 'Ok',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(
    @Request() req,
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<ApiResponseType<null>> {
    await this.authService.logout(req.user.id, refreshTokenDto.refreshToken);

    return {
      success: true,
      data: null,
      message: 'Ok',
    };
  }
}
