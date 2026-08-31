import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const API_BASE = 'https://api.telegram.org';

/**
 * Thin wrapper over the Telegram Bot API's `sendMessage` — the outbound
 * "realtime notification" channel (alternative to Zalo, which needs a
 * business Official Account + template approval; a Telegram bot needs
 * neither). Driven by `TELEGRAM_BOT_TOKEN` — unset means disabled, not
 * broken: every caller treats a `false` return as "best-effort delivery
 * failed", same tolerance as the rest of `notification`.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.token = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || undefined;
    if (!this.token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled');
    }
  }

  get isConfigured(): boolean {
    return !!this.token;
  }

  /**
   * A bot can only message a chat that has messaged it first (Telegram's own
   * restriction, not ours) — `chatId` is whatever the user got back from
   * @userinfobot or `getUpdates` after pressing Start on the bot.
   */
  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!this.token) return false;

    try {
      const res = await fetch(`${API_BASE}/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(`Telegram sendMessage failed (${res.status}): ${body}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(`Telegram sendMessage error: ${(err as Error).message}`);
      return false;
    }
  }
}
