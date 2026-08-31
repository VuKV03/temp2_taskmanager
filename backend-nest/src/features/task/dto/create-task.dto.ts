import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  IsISO8601,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { TaskPriority } from '../types/task.types.js';

// Rudimentary RRULE subset validation — matches the examples in
// API_SPEC.md (`FREQ=DAILY`, `FREQ=WEEKLY;BYDAY=MO,WE`). Full RFC 5545
// parsing is not needed for v1.
const RRULE_PATTERN =
  /^FREQ=(DAILY|WEEKLY|MONTHLY)(;BYDAY=(MO|TU|WE|TH|FR|SA|SU)(,(MO|TU|WE|TH|FR|SA|SU))*)?$/;

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  listId?: number;

  @IsOptional()
  @IsInt()
  cardId?: number;

  @IsOptional()
  @IsInt()
  parentTaskId?: number;

  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimateMinutes?: number;

  // Workload — required going forward (existing tasks predate this field
  // and stay NULL in the DB; see task.entity.ts). 1 point = 1 day, per the
  // user's own convention, not enforced server-side.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  points: number;

  @IsOptional()
  @Matches(RRULE_PATTERN, { message: 'recurrenceRule must be a valid RRULE, e.g. FREQ=DAILY' })
  recurrenceRule?: string;

  @IsOptional()
  @IsInt({ each: true })
  tagIds?: number[];
}
