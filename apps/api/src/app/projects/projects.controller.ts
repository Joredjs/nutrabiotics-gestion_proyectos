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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectFilters,
  ProjectStatus,
  Priority,
  ApiResponse as ApiResponseType,
  User,
} from '@nutrabiotics-system/shared-types';

@ApiTags('Proyectos')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo proyecto' })
  @ApiResponse({ status: 201, description: 'Proyecto creado exitosamente' })
  @ApiResponse({ status: 403, description: 'Acceso no permitido, se requiere rol de manager o admin' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const project = await this.projectsService.create(createProjectDto, user);

    return {
      success: true,
      data: project,
      message: 'Ok',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los proyectos (puede usar oaginacion y filtros)' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  @ApiQuery({ name: 'managerId', required: false, type: 'string' })
  @ApiQuery({ name: 'sortBy', required: false, type: 'string' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query() filters: ProjectFilters,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const result = await this.projectsService.findAll(filters, user);

    return {
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Ok',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener proyecto por ID' })
  @ApiResponse({ status: 200, description: 'Proyecto obtenido correctamente' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const project = await this.projectsService.findOne(id, user);

    return {
      success: true,
      data: project,
      message: 'Ok',
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del proyecto' })
  async getProjectStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const stats = await this.projectsService.getProjectStats(id, user);

    return {
      success: true,
      data: stats,
      message: 'Ok',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proyecto' })
  @ApiResponse({ status: 200, description: 'Proyecto actualziado exitosamente' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const project = await this.projectsService.update(id, updateProjectDto, user);

    return {
      success: true,
      data: project,
      message: 'Ok',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar proyecto' })
  @ApiResponse({ status: 200, description: 'Proyecto eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Solo admins pueden eliminar proyecto' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    await this.projectsService.remove(id, user);

    return {
      success: true,
      data: null,
      message: 'Ok',
    };
  }
}
