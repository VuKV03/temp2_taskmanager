import { randomInt } from 'crypto';

/**
 * Fisher-Yates shuffle backed by a CSPRNG (`crypto.randomInt`) instead of
 * the classic `.sort(() => Math.random() - 0.5)`, which is both biased and
 * O(n log n) for no reason. Returns a new array — input is left untouched.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
