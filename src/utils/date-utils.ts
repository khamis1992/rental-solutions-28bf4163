/**
 * Formats a date object into a string
 * @param date - Date object or string to format
 * @param format - Format string (default: 'yyyy-MM-dd')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, format = 'yyyy-MM-dd'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const pad = (num: number) => num.toString().padStart(2, '0');

  return format
    .replace('yyyy', d.getFullYear().toString())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('dd', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()))
    .replace('MMMM', d.toLocaleString('default', { month: 'long' }))
    .replace('MMM', d.toLocaleString('default', { month: 'short' }))
    .replace('EEEE', d.toLocaleString('default', { weekday: 'long' }))
    .replace('EEE', d.toLocaleString('default', { weekday: 'short' }));
}

/**
 * Parses a date string into a Date object
 * @param dateString - Date string to parse
 * @returns Date object
 */
export function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
}

/**
 * Adds days to a date
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
