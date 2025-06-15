/**
 * Gregorian-only date formatting utilities
 * This file ensures all dates are displayed using the Gregorian calendar only
 */

/**
 * Arabic Gregorian month names
 */
export const ARABIC_GREGORIAN_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * Get current month name in Arabic (Gregorian only)
 */
export function getCurrentMonthArabic(): string {
  const date = new Date();
  return ARABIC_GREGORIAN_MONTHS[date.getMonth()];
}

/**
 * Format date in Arabic using Gregorian calendar only
 */
export function formatGregorianDateArabic(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use en-US locale to force Gregorian calendar, then translate month
  const englishDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Extract month name and replace with Arabic equivalent
  const monthMatch = englishDate.match(/(\w+)\s+(\d+),\s+(\d+)/);
  if (monthMatch) {
    const [, englishMonth, day, year] = monthMatch;
    const monthIndex = new Date(`${englishMonth} 1, 2000`).getMonth();
    const arabicMonth = ARABIC_GREGORIAN_MONTHS[monthIndex];
    return `${day} ${arabicMonth} ${year}`;
  }
  
  // Fallback to simple formatting
  return `${dateObj.getDate()} ${ARABIC_GREGORIAN_MONTHS[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

/**
 * Format date with weekday in Arabic (Gregorian only)
 */
export function formatGregorianDateWithWeekdayArabic(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const arabicWeekdays = [
    'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];
  
  const weekday = arabicWeekdays[dateObj.getDay()];
  const formattedDate = formatGregorianDateArabic(dateObj);
  
  return `${weekday}، ${formattedDate}`;
}

/**
 * Get current date in Arabic with weekday (Gregorian only)
 */
export function getCurrentDateArabic(): string {
  return formatGregorianDateWithWeekdayArabic(new Date());
} 