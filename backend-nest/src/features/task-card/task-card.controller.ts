import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../shared/decorators/current-user.decorator.js';
import { TaskCardService } from './task-card.service.js';
import { CreateTaskCardDto } from './dto/create-task-card.dto.js';
import { UpdateTaskCardDto } from './dto/update-task-card.dto.js';

@ApiTags('task-cards')
@ApiBearerAuth('access-token')
@Controller('task-cards')
export class TaskCardController {
  constructor(private readonly taskCardService: TaskCardService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's task cards" })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.taskCardService.findAll(user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task card' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaskCardDto) {
    return this.taskCardService.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a task card' })
  update(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskCardDto) {
    return this.taskCardService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task card (tasks on it are unlinked, never deleted)' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    await this.taskCardService.remove(user, id);
    return { message: 'Task card deleted' };
  }
}
