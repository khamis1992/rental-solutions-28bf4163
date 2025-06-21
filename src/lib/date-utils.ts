import { format, parseISO, isValid } from 'date-fns';
import { safeExecute, safeToDate } from '@/lib/utils/null-safety';

/**
 * Safely converts a date string or Date object to a Date object
 * @param dateInput Date input that might be string, Date, or invalid
 * @returns Valid Date object or null if invalid
 */
export const safelyParseDate = (dateInput: Date | string | null | undefined): Date | null => {
  return safeExecute(dateInput, (input) => {
    // If it's already a Date object
    if (input instanceof Date) {
      return isValid(input) ? input : null;
    }
    
    // If it's a string, try to parse it
    if (typeof input === 'string') {
      const trimmedInput = input.trim();
      
      // Try to handle ISO strings
      const parsed = parseISO(trimmedInput);
      if (isValid(parsed)) return parsed;
      
      // If ISO parsing failed, try creating date directly
      const fallbackDate = new Date(trimmedInput);
      return isValid(fallbackDate) ? fallbackDate : null;
    }
    
    return null;
  }, null);
};

/**
 * Formats a date into a readable string
 * @param date The date to format
 * @param formatString Optional format string (defaults to 'MMMM d, yyyy')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined, formatString = 'MMMM d, yyyy'): string => {
  const dateObject = safeToDate(date) || null;
  if (!dateObject) return 'N/A';
  
  try {
    return format(dateObject, formatString);
  } catch (error) {
    console.error('Error formatting date:', error, 'Input was:', date);
    return 'Invalid date';
  }
};

/**
 * Formats a date with time into a readable string
 * @param date The date to format
 * @param formatString Optional format string (defaults to 'MMMM d, yyyy h:mm a')
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string | null | undefined, formatString = 'MMMM d, yyyy h:mm a'): string => {
  return formatDate(date, formatString);
};

/**
 * Returns a date object from a string or date input
 * @param date Date or string to convert
 * @returns Date object or null if invalid
 */
export const getDateObject = (date: Date | string | null | undefined): Date | null => {
  return safelyParseDate(date);
};

/**
 * Formats a date for use in form inputs (YYYY-MM-DD)
 * @param date The date to format
 * @returns Formatted date string for form inputs
 */
export const formatDateForInput = (date: Date | string | null | undefined): string => {
  const parsedDate = safelyParseDate(date);
  if (!parsedDate) return '';
  
  try {
    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Parse date input
 * @param dateInput Date string
 * @returns Parsed Date object or null
 */
export const parseMixedDateInput = (dateInput: string): Date | null => {
  return safelyParseDate(dateInput);
};

/**
 * Format date for Arabic display (Gregorian calendar only)
 * @param date Date to format
 * @returns Formatted Arabic date string
 */
export const formatArabicDate = (date: Date | string | null | undefined): string => {
  const dateObject = safeToDate(date);
  if (!dateObject) return 'غير محدد';
  
  try {
    return dateObject.toLocaleDateString('ar-QA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting Arabic date:', error);
    return 'تاريخ غير صحيح';
  }
};
