import { DateTime } from 'luxon';

/**
 * Convert date to UTC ISO string for API
 */
export function toUtcIso(date: Date | DateTime): string {
  if (date instanceof Date) {
    return DateTime.fromJSDate(date).toUTC().toISO() || '';
  }
  return date.toUTC().toISO() || '';
}

/**
 * Format date for display (e.g., "28/08/2026")
 */
export function formatDate(dateStr: string, userTimezone: string = 'Asia/Ho_Chi_Minh'): string {
  return DateTime.fromISO(dateStr).setZone(userTimezone).toFormat('dd/MM/yyyy');
}

/**
 * Format datetime for display (e.g., "28/08/2026 14:30")
 */
export function formatDateTime(dateStr: string, userTimezone: string = 'Asia/Ho_Chi_Minh'): string {
  return DateTime.fromISO(dateStr).setZone(userTimezone).toFormat('dd/MM/yyyy HH:mm');
}

/**
 * Get relative due date label (e.g., "Hôm nay", "Quá hạn 2 ngày", "Trong 3 ngày")
 */
export function getDueLabel(dueDate: string, userTimezone: string = 'Asia/Ho_Chi_Minh'): string {
  const now = DateTime.now().setZone(userTimezone).startOf('day');
  const due = DateTime.fromISO(dueDate).setZone(userTimezone).startOf('day');
  const diff = due.diff(now, 'days').days;

  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Ngày mai';
  if (diff === -1) return 'Hôm qua';
  if (diff < 0) return `Quá hạn ${Math.abs(Math.floor(diff))} ngày`;
  if (diff > 0) return `Trong ${Math.floor(diff)} ngày`;

  return '';
}

/**
 * Get time ago string (e.g., "2 giờ trước")
 */
export function getTimeAgo(dateStr: string, userTimezone: string = 'Asia/Ho_Chi_Minh'): string {
  const dt = DateTime.fromISO(dateStr).setZone(userTimezone);
  const now = DateTime.now().setZone(userTimezone);
  const diff = now.diff(dt);

  const minutes = Math.floor(diff.as('minutes'));
  const hours = Math.floor(diff.as('hours'));
  const days = Math.floor(diff.as('days'));

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 30) return `${days} ngày trước`;

  return dt.toFormat('dd/MM/yyyy');
}
