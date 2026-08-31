import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  // Telegram numeric chat id, from @userinfobot or the bot's own
  // `getUpdates` after the user presses Start. Empty string unlinks.
  @IsOptional()
  @IsString()
  @MaxLength(64)
  telegramChatId?: string;
}
