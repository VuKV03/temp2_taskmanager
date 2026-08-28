import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
    message: 'newPassword must be at least 8 characters and include letters and numbers',
  })
  newPassword: string;
}
