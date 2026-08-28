import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { ActivityService } from '../services/activity.service.js';
import { QueryActivityDto } from '../dto/query-activity.dto.js';

@ApiTags('activities')
@ApiBearerAuth('access-token')
@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('activities')
  @ApiOperation({ summary: 'Lịch sử của chính user hiện tại' })
  findMine(@CurrentUser() user: JwtPayload, @Query() query: QueryActivityDto) {
    return this.activityService.findMine(user, query);
  }

  @Get('tasks/:id/activities')
  @ApiOperation({ summary: 'Lịch sử của 1 task' })
  findForTask(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryActivityDto,
  ) {
    return this.activityService.findForTask(id, user, query);
  }
}
