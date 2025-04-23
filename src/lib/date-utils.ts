
import { format, parseISO } from 'date-fns';

/**
 * Format a date object to YYYY-MM-DD
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Format a date object to YYYY-MM-DD HH:mm
 * @param date The date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd HH:mm');
};

/**
 * Convert a date-like value to a Date object
 * @param date Date, string, or undefined
 * @returns Date object or undefined
 */
export const getDateObject = (date: Date | string | undefined): Date | undefined => {
  if (!date) return undefined;
  
  if (date instanceof Date) {
    return date;
  }
  
  try {
    return new Date(date);
  } catch (error) {
    console.error('Invalid date format:', error);
    return undefined;
  }
};
