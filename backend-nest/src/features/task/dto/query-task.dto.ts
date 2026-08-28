import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto.js';
import { TaskStatus, TaskPriority, TASK_SORT_FIELDS } from '../types/task.types.js';
import type { TaskSortField } from '../types/task.types.js';

const splitCsv = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.split(',').map((v) => v.trim()).filter(Boolean) : value;

export class QueryTaskDto extends PaginationQueryDto {
  // Whitelist override — base class allows any string, tasks restrict it.
  @IsOptional()
  @IsIn(TASK_SORT_FIELDS)
  sort?: TaskSortField = undefined;

  @IsOptional()
  @Transform(splitCsv)
  @IsArray()
  @IsEnum(TaskStatus, { each: true })
  status?: TaskStatus[];

  @IsOptional()
  @Transform(splitCsv)
  @IsArray()
  @IsEnum(TaskPriority, { each: true })
  priority?: TaskPriority[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  listId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @Transform(splitCsv)
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  tagIds?: number[];

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'dueFrom must be YYYY-MM-DD' })
  dueFrom?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'dueTo must be YYYY-MM-DD' })
  dueTo?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeArchived?: boolean = false;
}
