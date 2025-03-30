
import { format, parseISO, isValid } from 'date-fns';

/**
 * Formats a date into a readable string
 * @param date The date to format
 * @param formatString Optional format string (defaults to 'MMMM d, yyyy')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined, formatString = 'MMMM d, yyyy'): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
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
  if (!date) return null;
  
  try {
    if (typeof date === 'string') {
      const parsedDate = parseISO(date);
      return isValid(parsedDate) ? parsedDate : null;
    }
    
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Formats a date for use in form inputs (YYYY-MM-DD)
 * @param date The date to format
 * @returns Formatted date string for form inputs
 */
export const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};
