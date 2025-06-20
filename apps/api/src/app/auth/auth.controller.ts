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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  LoginDto,
  RegisterDto,
  ApiResponse as ApiResponseType,
  AuthUser,
  User,
} from '@nutrabiotics-system/shared-types';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicio de sesión' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión correcto' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas' })
  async login(@Body() loginDto: LoginDto): Promise<ApiResponseType<AuthUser>> {
    const result = await this.authService.login(loginDto);

    return {
      success: true,
      data: result,
      message: 'Ok',
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Registro de usuario' })
  @ApiResponse({ status: 201, description: 'Registro de usuario correcto' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
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
  @ApiResponse({
    status: 200,
    description: 'Perfil de usuario obtenido correctamente',
  })
  @ApiResponse({ status: 401, description: 'Petición no autorizada' })
  async getProfile(@Request() req): Promise<ApiResponseType<User>> {
    return {
      success: true,
      data: req.user,
      message: 'Ok',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualiza el access token' })
  @ApiResponse({ status: 200, description: 'Token actualizado correctamente' })
  @ApiResponse({ status: 401, description: 'refresh token inválido' })
  async refresh(
    @Body('refreshToken') refreshToken: string
  ): Promise<ApiResponseType<any>> {
    const tokens = await this.authService.refreshTokens(refreshToken);

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
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  async logout(
    @Request() req,
    @Body('refreshToken') refreshToken: string
  ): Promise<ApiResponseType<null>> {
    await this.authService.logout(req.user.id, refreshToken);

    return {
      success: true,
      data: null,
      message: 'Ok',
    };
  }
}
