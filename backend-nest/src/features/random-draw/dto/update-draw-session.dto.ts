import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, IsArray, ArrayMaxSize } from 'class-validator';

export class UpdateDrawSessionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  // Freeform labels appended to the pending pool — same shape as a manual
  // session's `items`, regardless of the session's own sourceType.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  addItems?: string[];

  // Ids of pending (not yet drawn) draw_items to drop from the pool.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  removeItemIds?: number[];
}
