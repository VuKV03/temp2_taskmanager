import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { StatsService } from '../services/stats.service.js';
import { QueryStatsDto, QueryCompletionStatsDto } from '../dto/query-stats.dto.js';

@ApiTags('stats')
@ApiBearerAuth('access-token')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Thống kê tổng quan cá nhân' })
  getSummary(@CurrentUser() user: JwtPayload, @Query() query: QueryStatsDto) {
    return this.statsService.getSummary(user, query);
  }

  @Get('completion')
  @ApiOperation({ summary: 'Chuỗi hoàn thành theo ngày/tuần/tháng' })
  getCompletion(@CurrentUser() user: JwtPayload, @Query() query: QueryCompletionStatsDto) {
    return this.statsService.getCompletionTrend(user, query);
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Phân bố theo status' })
  getByStatus(@CurrentUser() user: JwtPayload, @Query() query: QueryStatsDto) {
    return this.statsService.getByStatus(user, query);
  }

  @Get('by-priority')
  @ApiOperation({ summary: 'Phân bố theo priority' })
  getByPriority(@CurrentUser() user: JwtPayload, @Query() query: QueryStatsDto) {
    return this.statsService.getByPriority(user, query);
  }
}
