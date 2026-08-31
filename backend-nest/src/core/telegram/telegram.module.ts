import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service.js';

/**
 * Outbound Telegram bot messaging. See `telegram.service.ts` — driven by
 * `TELEGRAM_BOT_TOKEN` env var, same "core infra, optional driver" shape as
 * `StorageModule`.
 */
@Module({
  imports: [ConfigModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
