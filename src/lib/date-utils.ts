
import { format, parseISO, isValid } from 'date-fns';
import { logOperation } from '@/utils/monitoring-utils';

/**
 * Safely converts a date string or Date object to a Date object
 * @param dateInput Date input that might be string, Date, or invalid
 * @returns Valid Date object or null if invalid
 */
const safelyParseDate = (dateInput: Date | string | null | undefined): Date | null => {
  if (!dateInput) return null;
  
  try {
    // If it's already a Date object
    if (dateInput instanceof Date) {
      return isValid(dateInput) ? dateInput : null;
    }
    
    // If it's a string, try to parse it
    if (typeof dateInput === 'string') {
      // Try to handle ISO strings
      const parsed = parseISO(dateInput);
      if (isValid(parsed)) return parsed;
      
      // If ISO parsing failed, try creating date directly
      const fallbackDate = new Date(dateInput);
      return isValid(fallbackDate) ? fallbackDate : null;
    }
    
    return null;
  } catch (error) {
    logOperation('dateUtils.safelyParseDate', 'error', 
      { input: String(dateInput) }, error instanceof Error ? error.message : String(error));
    return null;
  }
};

/**
 * Formats a date into a readable string
 * @param date The date to format
 * @param formatString Optional format string (defaults to 'MMMM d, yyyy')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined, formatString = 'MMMM d, yyyy'): string => {
  const parsedDate = safelyParseDate(date);
  if (!parsedDate) return 'N/A';
  
  try {
    return format(parsedDate, formatString);
  } catch (error) {
    logOperation('dateUtils.formatDate', 'error', 
      { input: String(date) }, error instanceof Error ? error.message : String(error));
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
    logOperation('dateUtils.formatDateForInput', 'error', 
      { input: String(date) }, error instanceof Error ? error.message : String(error));
    return '';
  }
};
