import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../shared/decorators/current-user.decorator.js';
import { RandomDrawService } from './random-draw.service.js';
import { CreateDrawSessionDto } from './dto/create-draw-session.dto.js';
import { DrawDto } from './dto/draw.dto.js';
import { UpdateDrawSessionDto } from './dto/update-draw-session.dto.js';

@ApiTags('draw-sessions')
@ApiBearerAuth('access-token')
@Controller('draw-sessions')
export class RandomDrawController {
  constructor(private readonly randomDrawService: RandomDrawService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's draw sessions" })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.randomDrawService.findAll(user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a draw session — snapshots the pool from a task list or a manual item list' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDrawSessionDto) {
    return this.randomDrawService.create(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a draw session detail (pool + drawn history)' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.randomDrawService.findOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a session and/or add/remove pending pool items' })
  update(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDrawSessionDto) {
    return this.randomDrawService.update(user, id, dto);
  }

  @Post(':id/draw')
  @ApiOperation({ summary: 'Randomly draw N items out of the remaining pool, without replacement' })
  draw(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: DrawDto) {
    return this.randomDrawService.draw(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a draw session' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    await this.randomDrawService.remove(user, id);
    return { message: 'Draw session deleted' };
  }
}
