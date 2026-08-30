import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class BulkDeleteTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids: number[];
}
