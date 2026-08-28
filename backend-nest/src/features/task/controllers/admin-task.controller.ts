import { Controller, Get, Delete, Param, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../shared/decorators/roles.decorator.js';
import { TaskService } from '../services/task.service.js';
import { QueryTaskDto } from '../dto/query-task.dto.js';

@ApiTags('admin-tasks')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin/tasks')
export class AdminTaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'List all tasks in the system' })
  findAll(@Query() query: QueryTaskDto) {
    return this.taskService.adminFindMany(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard delete a task' })
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    await this.taskService.adminHardDelete(id);
    return { message: 'Task permanently deleted' };
  }
}
