import { DateTime } from 'luxon';

export interface DateRange {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
}

/**
 * Calculate start and end of day in user's timezone, returning UTC dates
 * Used for queries like "tasks today" or "tasks in this week"
 */
export function getDayRange(timezone: string): DateRange {
  const now = DateTime.now().setZone(timezone);
  const startOfDay = now.startOf('day').toUTC().toJSDate();
  const endOfDay = now.endOf('day').toUTC().toJSDate();

  return {
    start: startOfDay,
    end: endOfDay,
    startIso: now.startOf('day').toISO() || '',
    endIso: now.endOf('day').toISO() || '',
  };
}

/**
 * Get start of week in user's timezone
 */
export function getWeekRange(timezone: string): DateRange {
  const now = DateTime.now().setZone(timezone);
  const startOfWeek = now.startOf('week').toUTC().toJSDate();
  const endOfWeek = now.endOf('week').toUTC().toJSDate();

  return {
    start: startOfWeek,
    end: endOfWeek,
    startIso: now.startOf('week').toISO() || '',
    endIso: now.endOf('week').toISO() || '',
  };
}

/**
 * Get start of month in user's timezone
 */
export function getMonthRange(timezone: string): DateRange {
  const now = DateTime.now().setZone(timezone);
  const startOfMonth = now.startOf('month').toUTC().toJSDate();
  const endOfMonth = now.endOf('month').toUTC().toJSDate();

  return {
    start: startOfMonth,
    end: endOfMonth,
    startIso: now.startOf('month').toISO() || '',
    endIso: now.endOf('month').toISO() || '',
  };
}

/**
 * Convert date range from user's timezone to UTC
 */
export function convertDateRangeToUTC(
  fromDate: string, // YYYY-MM-DD format
  toDate: string, // YYYY-MM-DD format
  timezone: string,
): DateRange {
  const fromDt = DateTime.fromISO(fromDate, { zone: timezone }).startOf('day').toUTC();
  const toDt = DateTime.fromISO(toDate, { zone: timezone }).endOf('day').toUTC();

  return {
    start: fromDt.toJSDate(),
    end: toDt.toJSDate(),
    startIso: fromDt.toISO() || '',
    endIso: toDt.toISO() || '',
  };
}

/**
 * Format date to YYYY-MM-DD in user's timezone
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  return DateTime.fromJSDate(date).setZone(timezone).toISODate() || '';
}

/**
 * Convert UTC date to user's timezone and format as readable string
 */
export function formatDatetimeInTimezone(date: Date, timezone: string): string {
  return DateTime.fromJSDate(date).setZone(timezone).toISO() || '';
}
