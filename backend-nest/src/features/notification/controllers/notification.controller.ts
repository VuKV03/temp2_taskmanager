import { Controller, Get, Patch, Param, ParseIntPipe, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { NotificationService } from '../services/notification.service.js';
import { QueryNotificationDto } from '../dto/query-notification.dto.js';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications (filter isRead)' })
  findMany(@CurrentUser() user: JwtPayload, @Query() query: QueryNotificationDto) {
    return this.notificationService.findMany(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread badge count' })
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationService.unreadCount(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark one notification as read' })
  async markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    await this.notificationService.markRead(id, user.id);
    return { message: 'Notification marked as read' };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() user: JwtPayload) {
    await this.notificationService.markAllRead(user.id);
    return { message: 'All notifications marked as read' };
  }
}
