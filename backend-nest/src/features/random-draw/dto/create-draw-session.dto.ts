import { IsString, IsNotEmpty, MaxLength, IsIn, IsInt, IsArray, ArrayMinSize, ArrayMaxSize, ValidateIf } from 'class-validator';
import { DrawSourceType } from '../types/random-draw.types.js';

export class CreateDrawSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsIn([DrawSourceType.TASK_LIST, DrawSourceType.MANUAL])
  sourceType: DrawSourceType;

  // Required (and only meaningful) when sourceType = 'task_list'.
  @ValidateIf((dto: CreateDrawSessionDto) => dto.sourceType === DrawSourceType.TASK_LIST)
  @IsInt()
  sourceListId?: number;

  // Required (and only meaningful) when sourceType = 'manual' — one entry
  // per line/item, e.g. ["Voc 1", "Voc 2", ..., "Voc 100"].
  @ValidateIf((dto: CreateDrawSessionDto) => dto.sourceType === DrawSourceType.MANUAL)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  items?: string[];
}
