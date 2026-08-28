import { Controller, Get, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { TaskViewService } from '../services/task-view.service.js';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Timezone', required: false, description: 'Override users.timezone' })
@Controller('tasks')
export class TaskViewController {
  constructor(private readonly taskViewService: TaskViewService) {}

  @Get('today')
  @ApiOperation({ summary: "Công việc hôm nay (today + overdue, by user timezone)" })
  getToday(@CurrentUser() user: JwtPayload, @Headers('x-timezone') timezone?: string) {
    return this.taskViewService.getToday(user, timezone);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Overdue tasks' })
  getOverdue(@CurrentUser() user: JwtPayload, @Headers('x-timezone') timezone?: string) {
    return this.taskViewService.getOverdue(user, timezone);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Next 7 days' })
  getUpcoming(@CurrentUser() user: JwtPayload, @Headers('x-timezone') timezone?: string) {
    return this.taskViewService.getUpcoming(user, timezone);
  }
}
