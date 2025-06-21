import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from '../tasks/tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateTaskDto,
  TaskFilters,
  TaskStatus,
  Priority,
  ApiResponse as ApiResponseType,
  User,
} from '@nutrabiotics-system/shared-types';

@ApiTags('Proyectos')
@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar las tareas de un proyecto' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  @ApiQuery({ name: 'assignedToId', required: false, type: 'string' })
  @ApiQuery({ name: 'sortBy', required: false, type: 'string' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async getProjectTasks(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() filters: TaskFilters,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const result = await this.tasksService.findByProject(projectId, filters, user);

    return {
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Ok',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva tarea en un proyecto' })
  @ApiResponse({ status: 201, description: 'Tarea creada correctamente' })
  async createProjectTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createTaskDto: Omit<CreateTaskDto, 'projectId'>,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType> {
    const taskDto: CreateTaskDto = {
      ...createTaskDto,
      projectId,
    };

    const task = await this.tasksService.create(taskDto, user);

    return {
      success: true,
      data: task,
      message: 'Ok',
    };
  }
}
