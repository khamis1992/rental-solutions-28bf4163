
import { format, parseISO, isValid } from 'date-fns';
import { safeExecute, safeToDate } from '@/lib/utils/null-safety';
import { hijriToGregorian, gregorianToHijri, formatHijriDateArabic, isValidHijriDate } from '@/utils/hijri-date-utils';

/**
 * Safely converts a date string or Date object to a Date object
 * Now supports Hijri date conversion
 * @param dateInput Date input that might be string, Date, Hijri date, or invalid
 * @returns Valid Date object or null if invalid
 */
export const safelyParseDate = (dateInput: Date | string | null | undefined): Date | null => {
  return safeExecute(dateInput, (input) => {
    // If it's already a Date object
    if (input instanceof Date) {
      return isValid(input) ? input : null;
    }
    
    // If it's a string, try multiple parsing strategies
    if (typeof input === 'string') {
      const trimmedInput = input.trim();
      
      // First, check if it might be a Hijri date
      if (isValidHijriDate(trimmedInput)) {
        const gregorianDate = hijriToGregorian(trimmedInput);
        if (gregorianDate && isValid(gregorianDate)) {
          return gregorianDate;
        }
      }
      
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
 * @param showHijri Whether to also show Hijri date
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | null | undefined, 
  formatString = 'MMMM d, yyyy',
  showHijri = false
): string => {
  const dateObject = safeToDate(date);
  if (!dateObject) return 'N/A';
  
  try {
    const gregorianFormatted = format(dateObject, formatString);
    
    if (!showHijri) {
      return gregorianFormatted;
    }
    
    // Add Hijri date if requested
    const hijriDate = gregorianToHijri(dateObject);
    if (hijriDate) {
      const hijriFormatted = formatHijriDateArabic(hijriDate);
      return `${gregorianFormatted} (${hijriFormatted})`;
    }
    
    return gregorianFormatted;
  } catch (error) {
    console.error('Error formatting date:', error, 'Input was:', date);
    return 'Invalid date';
  }
};

/**
 * Formats a date with time into a readable string
 * @param date The date to format
 * @param formatString Optional format string (defaults to 'MMMM d, yyyy h:mm a')
 * @param showHijri Whether to also show Hijri date
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: Date | string | null | undefined, 
  formatString = 'MMMM d, yyyy h:mm a',
  showHijri = false
): string => {
  return formatDate(date, formatString, showHijri);
};

/**
 * Returns a date object from a string or date input
 * Now supports Hijri date conversion
 * @param date Date, Hijri date string, or Gregorian date string to convert
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
 * Parse mixed date input that could be Gregorian or Hijri
 * @param dateInput Date string in any format
 * @returns Parsed Date object or null
 */
export const parseMixedDateInput = (dateInput: string): Date | null => {
  return safelyParseDate(dateInput);
};

/**
 * Format date for Arabic display with optional Hijri
 * @param date Date to format
 * @param includeHijri Whether to include Hijri date
 * @returns Formatted Arabic date string
 */
export const formatArabicDate = (date: Date | string | null | undefined, includeHijri = true): string => {
  const dateObject = safeToDate(date);
  if (!dateObject) return 'غير محدد';
  
  try {
    const gregorianFormatted = dateObject.toLocaleDateString('ar-SA');
    
    if (!includeHijri) {
      return `${gregorianFormatted} م`;
    }
    
    const hijriDate = gregorianToHijri(dateObject);
    if (hijriDate) {
      const hijriFormatted = formatHijriDateArabic(hijriDate);
      return `${gregorianFormatted} م / ${hijriFormatted}`;
    }
    
    return `${gregorianFormatted} م`;
  } catch (error) {
    console.error('Error formatting Arabic date:', error);
    return 'تاريخ غير صحيح';
  }
};
