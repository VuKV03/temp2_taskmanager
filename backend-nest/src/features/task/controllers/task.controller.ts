import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../shared/decorators/roles.decorator.js';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { TaskService } from '../services/task.service.js';
import { TaskStatusService } from '../services/task-status.service.js';
import { TaskTagService } from '../services/task-tag.service.js';
import { CreateTaskDto } from '../dto/create-task.dto.js';
import { UpdateTaskDto } from '../dto/update-task.dto.js';
import { QueryTaskDto } from '../dto/query-task.dto.js';
import { UpdateStatusDto } from '../dto/update-status.dto.js';
import { UpdateAssigneeDto } from '../dto/update-assignee.dto.js';
import { ReorderTasksDto } from '../dto/reorder-tasks.dto.js';
import { ReplaceTagsDto } from '../dto/replace-tags.dto.js';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly taskStatusService: TaskStatusService,
    private readonly taskTagService: TaskTagService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with filters and pagination' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: QueryTaskDto) {
    return this.taskService.findMany(user, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create task' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaskDto) {
    return this.taskService.create(user, dto);
  }

  // Static routes registered before ':id' so they aren't swallowed by it.
  @Patch('reorder')
  @ApiOperation({ summary: 'Bulk reorder tasks' })
  reorder(@CurrentUser() user: JwtPayload, @Body() dto: ReorderTasksDto) {
    return this.taskService.reorder(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Task detail (subtasks, tags, counts)' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive (soft delete) task' })
  async archive(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    await this.taskService.archive(user, id);
    return { message: 'Task archived' };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change status (state machine)' })
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.taskStatusService.updateStatus(user, id, dto.status);
  }

  @Patch(':id/assignee')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign task to another user (admin only)' })
  assign(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssigneeDto,
  ) {
    return this.taskService.assign(user, id, dto.assigneeId);
  }

  @Put(':id/tags')
  @ApiOperation({ summary: 'Replace all tags of a task' })
  replaceTags(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplaceTagsDto,
  ) {
    return this.taskTagService.replaceTaskTags(user, id, dto.tagIds);
  }
}
