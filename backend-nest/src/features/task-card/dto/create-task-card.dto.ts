import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTaskCardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
