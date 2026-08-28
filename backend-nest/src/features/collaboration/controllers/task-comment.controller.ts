import { Controller, Get, Post, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { CommentService } from '../services/comment.service.js';
import { CreateCommentDto } from '../dto/create-comment.dto.js';

@ApiTags('comments')
@ApiBearerAuth('access-token')
@Controller('tasks/:id/comments')
export class TaskCommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'List comments on a task' })
  findByTask(@Param('id', ParseIntPipe) taskId: number, @CurrentUser() user: JwtPayload) {
    return this.commentService.findByTask(taskId, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a comment to a task' })
  create(
    @Param('id', ParseIntPipe) taskId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.create(taskId, user, dto);
  }
}
