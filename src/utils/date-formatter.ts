
/**
 * Date formatting utilities for consistent date handling throughout the application
 */
import { format as dateFnsFormat, parseISO, isValid } from 'date-fns';

/**
 * Safely format a date string with fallback for invalid dates
 * @param dateString The date string to format
 * @param formatString The format pattern to use (date-fns format)
 * @param fallback What to return if the date is invalid
 * @returns Formatted date string or fallback
 */
export function formatDate(dateString: string | Date | null | undefined, formatString = 'MMM dd, yyyy', fallback = 'N/A'): string {
  if (!dateString) return fallback;
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) {
      return fallback;
    }
    
    return dateFnsFormat(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return fallback;
  }
}

/**
 * Format a date as a month year string (e.g., "January 2023")
 */
export function formatMonthYear(dateString: string | Date | null | undefined, fallback = 'N/A'): string {
  return formatDate(dateString, 'MMMM yyyy', fallback);
}

/**
 * Format a date as a short date (e.g., "Jan 15, 2023")
 */
export function formatShortDate(dateString: string | Date | null | undefined, fallback = 'N/A'): string {
  return formatDate(dateString, 'MMM dd, yyyy', fallback);
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get the first day of the month for a given date
 */
export function getFirstDayOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  return result;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((startDate.getTime() - endDate.getTime()) / millisecondsPerDay));
}
