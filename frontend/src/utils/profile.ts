export function normalizeDateForInput(value?: string | null): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === 'string' && value.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateForDisplay(value?: string | null): string {
  if (!value) return 'N/A';

  const normalized = normalizeDateForInput(value);
  if (!normalized) return 'N/A';

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getAttendanceRatingValue(
  attendance?: number,
  totalClasses?: number,
  attendanceRating?: number,
): number {
  if (typeof attendanceRating === 'number' && Number.isFinite(attendanceRating)) {
    return Math.max(0, Math.min(5, attendanceRating));
  }

  const attendanceCount = Number(attendance ?? 0);
  const classCount = Number(totalClasses ?? 0);
  if (classCount > 0) {
    return Math.max(0, Math.min(5, (attendanceCount / classCount) * 5));
  }

  return Math.max(0, Math.min(5, attendanceCount));
}
