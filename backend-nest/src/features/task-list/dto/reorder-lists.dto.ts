import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';

export class ReorderListItemDto {
  @IsInt()
  id: number;

  @IsInt()
  sortOrder: number;
}

export class ReorderListsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderListItemDto)
  items: ReorderListItemDto[];
}
