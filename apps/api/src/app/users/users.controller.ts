import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateUserDto,
  UpdateUserDto,
  UserRole,
  PaginationQuery,
  ApiResponse as ApiResponseType,
} from '@nutrabiotics-system/shared-types';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado correctamente' })
  @ApiResponse({
    status: 403,
    description: 'Acceso no permitido, se requiere rol de admin o manager',
  })
  @ApiResponse({ status: 409, description: 'Ya existe un usuario con ese correo' })
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseType> {
    const user = await this.usersService.create(createUserDto);

    return {
      success: true,
      data: user,
      message: 'Ok',
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar todos los usuarios (puede usar paginacion y filtros)' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false, type: 'boolean' })
  @ApiQuery({ name: 'sortBy', required: false, type: 'string' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query() query: PaginationQuery & { role?: UserRole; isActive?: boolean }
  ): Promise<ApiResponseType> {
    const result = await this.usersService.findAll(query);

    return {
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Ok',
    };
  }

  @Get('developers')
  @ApiOperation({ summary: 'Listar los desarrolladores' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  async findDevelopers(
    @Query() query: PaginationQuery
  ): Promise<ApiResponseType> {
    const result = await this.usersService.findDevelopers(query);

    return {
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Ok',
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener el perfil del usuario activo' })
  async getProfile(@CurrentUser() user: any): Promise<ApiResponseType> {
    const userProfile = await this.usersService.findById(user.id);

    return {
      success: true,
      data: userProfile,
      message: 'Ok',
    };
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Obtener las estadísticas del usuario activo' })
  async getUserStats(@CurrentUser() user: any): Promise<ApiResponseType> {
    const stats = await this.usersService.getUserStats(user.id);

    return {
      success: true,
      data: stats,
      message: 'Ok',
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obtener usuario por id' })
  @ApiResponse({ status: 200, description: 'Usuario obtenido correctamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiResponseType> {
    const user = await this.usersService.findById(id);

    return {
      success: true,
      data: user,
      message: 'Ok',
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El correo ya existe' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<ApiResponseType> {
    const user = await this.usersService.update(id, updateUserDto);

    return {
      success: true,
      data: user,
      message: 'Ok',
    };
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desactivar Usuario' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiResponseType> {
    const user = await this.usersService.deactivate(id);

    return {
      success: true,
      data: user,
      message: 'Ok',
    };
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activar usuario' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiResponseType> {
    const user = await this.usersService.activate(id);

    return {
      success: true,
      data: user,
      message: 'Ok',
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiResponseType> {
    await this.usersService.remove(id);

    return {
      success: true,
      data: null,
      message: 'Ok',
    };
  }
}
