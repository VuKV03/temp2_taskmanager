import { IsEnum } from 'class-validator';
import { TaskStatus } from '../types/task.types.js';

export class UpdateStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
