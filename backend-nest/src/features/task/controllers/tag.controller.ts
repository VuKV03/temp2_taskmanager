import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { TaskTagService } from '../services/task-tag.service.js';
import { CreateTagDto } from '../dto/create-tag.dto.js';
import { UpdateTagDto } from '../dto/update-tag.dto.js';

@ApiTags('tags')
@ApiBearerAuth('access-token')
@Controller('tags')
export class TagController {
  constructor(private readonly taskTagService: TaskTagService) {}

  @Get()
  @ApiOperation({ summary: 'User tags + system tags' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.taskTagService.findAll(user);
  }

  @Post()
  @ApiOperation({ summary: 'Create tag' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTagDto) {
    return this.taskTagService.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tag' })
  update(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
    return this.taskTagService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete tag (removes from all tasks)' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    await this.taskTagService.remove(user, id);
    return { message: 'Tag deleted' };
  }
}
