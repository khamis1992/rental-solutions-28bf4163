
import { format, parseISO } from 'date-fns';

/**
 * Format a date in dd/mm/yyyy format
 * @param date Date object or ISO string to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date and time in dd/mm/yyyy HH:mm format
 * @param date Date object or ISO string to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string | undefined | null): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return '';
  }
};
