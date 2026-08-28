import { IsInt } from 'class-validator';

export class UpdateAssigneeDto {
  @IsInt()
  assigneeId: number;
}
