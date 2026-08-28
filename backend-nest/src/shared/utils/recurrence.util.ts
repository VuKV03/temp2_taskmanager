import { DateTime } from 'luxon';

// Mirrors task's CreateTaskDto RRULE_PATTERN subset:
// FREQ=(DAILY|WEEKLY|MONTHLY)(;BYDAY=MO,WE,...)? — see create-task.dto.ts.
const WEEKDAY_CODE: Record<string, number> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };

export interface ParsedRecurrenceRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  /** Luxon weekday numbers (1=Monday..7=Sunday), WEEKLY only. Empty = same weekday as the previous occurrence. */
  byDay: number[];
}

export function parseRecurrenceRule(rule: string): ParsedRecurrenceRule | null {
  const parts: Record<string, string> = {};
  for (const part of rule.split(';')) {
    const [key, value] = part.split('=');
    if (key && value) parts[key.trim().toUpperCase()] = value.trim().toUpperCase();
  }

  const freq = parts.FREQ;
  if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY') return null;

  const byDay = (parts.BYDAY ?? '')
    .split(',')
    .map((code) => WEEKDAY_CODE[code])
    .filter((n): n is number => !!n);

  return { freq, byDay };
}

/** Next occurrence strictly after `fromDate`, resolved in `timezone` (needed for weekday/month-length math). */
export function computeNextOccurrence(rule: ParsedRecurrenceRule, fromDate: Date, timezone: string): Date {
  const from = DateTime.fromJSDate(fromDate).setZone(timezone);

  if (rule.freq === 'DAILY') {
    return from.plus({ days: 1 }).toJSDate();
  }

  if (rule.freq === 'MONTHLY') {
    // Luxon clamps an overflowing day (e.g. 31 Jan -> 28/29 Feb) automatically.
    return from.plus({ months: 1 }).toJSDate();
  }

  // WEEKLY — no BYDAY means "same weekday, 7 days later".
  if (rule.byDay.length === 0) {
    return from.plus({ weeks: 1 }).toJSDate();
  }
  for (let i = 1; i <= 7; i++) {
    const candidate = from.plus({ days: i });
    if (rule.byDay.includes(candidate.weekday)) {
      return candidate.toJSDate();
    }
  }
  // Unreachable (byDay is non-empty, so some day in the next 7 always matches).
  return from.plus({ weeks: 1 }).toJSDate();
}
