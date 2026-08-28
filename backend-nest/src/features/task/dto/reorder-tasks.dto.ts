import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';

export class ReorderTaskItemDto {
  @IsInt()
  id: number;

  @IsInt()
  sortOrder: number;
}

export class ReorderTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderTaskItemDto)
  items: ReorderTaskItemDto[];
}
