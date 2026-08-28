import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../shared/decorators/current-user.decorator.js';
import { TaskListService } from './task-list.service.js';
import { CreateTaskListDto } from './dto/create-task-list.dto.js';
import { UpdateTaskListDto } from './dto/update-task-list.dto.js';
import { ReorderListsDto } from './dto/reorder-lists.dto.js';

@ApiTags('lists')
@ApiBearerAuth('access-token')
@Controller('lists')
export class TaskListController {
  constructor(private readonly taskListService: TaskListService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's lists" })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('includeArchived', new ParseBoolPipe({ optional: true })) includeArchived?: boolean,
  ) {
    return this.taskListService.findAll(user, includeArchived ?? false);
  }

  @Post()
  @ApiOperation({ summary: 'Create a list' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaskListDto) {
    return this.taskListService.create(user, dto);
  }

  // Must be registered before `:id` route to avoid "reorder" being parsed as an id.
  @Patch('reorder')
  @ApiOperation({ summary: 'Bulk update sort order' })
  reorder(@CurrentUser() user: JwtPayload, @Body() dto: ReorderListsDto) {
    return this.taskListService.reorder(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get list detail + task count' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.taskListService.findOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a list' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskListDto,
  ) {
    return this.taskListService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive (soft delete) a list' })
  async archive(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    await this.taskListService.archive(user, id);
    return { message: 'List archived' };
  }
}
