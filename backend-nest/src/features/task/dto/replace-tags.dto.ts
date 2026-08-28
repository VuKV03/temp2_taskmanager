import { IsArray, IsInt } from 'class-validator';

export class ReplaceTagsDto {
  @IsArray()
  @IsInt({ each: true })
  tagIds: number[];
}
