import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../shared/decorators/roles.decorator.js';
import { StatsService } from '../services/stats.service.js';
import { QueryStatsDto } from '../dto/query-stats.dto.js';

@ApiTags('admin-stats')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Tổng quan toàn hệ thống' })
  getOverview(@Query() query: QueryStatsDto) {
    return this.statsService.getAdminOverview(query);
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Hiệu suất theo từng user' })
  getByUser(@Query() query: QueryStatsDto) {
    return this.statsService.getByUserPerformance(query);
  }
}
