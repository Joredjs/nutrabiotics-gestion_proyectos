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
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
  TaskStatus,
  Priority,
  ApiResponse as ApiResponseType,
  User,
} from '@nutrabiotics-system/shared-types';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva tarea' })
  @ApiResponse({ status: 201, description: 'Tarea creada exitosa,emte' })
  @ApiResponse({ status: 403, description: 'Acceso no permitido' })
  @ApiResponse({ status: 404, description: 'Projecto o Usuario no encontrado' })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const task = await this.tasksService.create(createTaskDto, user);

    return {
      success: true,
      data: task,
      message: 'Ok',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos las tareas (puede usar paginacion y filtros)' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  @ApiQuery({ name: 'assignedToId', required: false, type: 'string' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiQuery({ name: 'sortBy', required: false, type: 'string' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query() filters: TaskFilters,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const result = await this.tasksService.findAll(filters, user);

    return {
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Ok',
    };
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Obteber las tareas del usuario activo' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  async getMyTasks(
    @Query() filters: TaskFilters,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const result = await this.tasksService.getMyTasks(user, filters);

    return {
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Ok',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una tarea' })
  @ApiResponse({ status: 200, description: 'Información de la tarea obtenidoa correctamente' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const task = await this.tasksService.findOne(id, user);

    return {
      success: true,
      data: task,
      message: 'Ok',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualziar tarea' })
  @ApiResponse({ status: 200, description: 'Tarea actualizada correctamente' })
  @ApiResponse({ status: 404, description: 'Tarea no encotrada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const task = await this.tasksService.update(id, updateTaskDto, user);

    return {
      success: true,
      data: task,
      message: 'Ok',
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de la tarea' })
  @ApiResponse({ status: 200, description: 'Estado de la tarea actualizado correctamente' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: TaskStatus,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const task = await this.tasksService.updateStatus(id, status, user);

    return {
      success: true,
      data: task,
      message: 'Ok',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tarea' })
  @ApiResponse({ status: 200, description: 'Tarea eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso no permitido' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    await this.tasksService.remove(id, user);

    return {
      success: true,
      data: null,
      message: 'Ok',
    };
  }
}
