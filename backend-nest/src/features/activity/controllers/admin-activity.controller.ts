import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../shared/decorators/roles.decorator.js';
import { ActivityService } from '../services/activity.service.js';
import { AdminQueryActivityDto } from '../dto/query-activity.dto.js';

@ApiTags('admin-activities')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin/activities')
export class AdminActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Lịch sử toàn hệ thống (filter theo userId)' })
  findAll(@Query() query: AdminQueryActivityDto) {
    return this.activityService.findAllAdmin(query);
  }
}
