import { randomBytes, createHash } from 'crypto';

/**
 * Refresh token utilities.
 * Refresh tokens are opaque random strings; only the SHA-256 hash is
 * persisted (`refresh_tokens.token_hash`) so a DB leak never exposes usable
 * tokens. Hashing must be deterministic (unlike Argon2) so we can look the
 * token up again on `/auth/refresh`.
 */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Parse a duration string like '15m' / '7d' into milliseconds.
 * Supports s (seconds), m (minutes), h (hours), d (days).
 */
export function parseDurationMs(duration: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * unitMs[unit];
}
