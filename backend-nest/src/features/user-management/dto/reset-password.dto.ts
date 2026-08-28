import { IsString, MinLength } from 'class-validator';

/** Admin sets the new password directly — no email infra in this project to send a reset link. */
export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword: string;
}
