import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto.js';
import type { ActivityAction } from '../entities/task-activity.entity.js';

const ACTIVITY_ACTIONS: ActivityAction[] = [
  'created',
  'updated',
  'status_changed',
  'assigned',
  'commented',
  'archived',
  'deleted',
];

export class QueryActivityDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ACTIVITY_ACTIONS)
  action?: ActivityAction;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}

/** Admin-only extra filter on top of QueryActivityDto. */
export class AdminQueryActivityDto extends QueryActivityDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}
