
import { format, formatDistance, formatRelative, Locale } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from '@/contexts/TranslationContext';

const locales: Record<string, Locale> = {
  en: enUS,
  ar: ar
};

/**
 * Format a date with the current locale
 * @param date Date to format
 * @param formatString Format string (default: 'PPP')
 * @param options Additional options
 * @returns Formatted date string
 */
export function formatDate(date: Date | number, formatString: string = 'PPP', options?: {
  locale?: string;
}): string {
  // Get the stored language from localStorage or default to 'en'
  const currentLocale = options?.locale || localStorage.getItem('language') || 'en';
  
  try {
    return format(date, formatString, {
      locale: locales[currentLocale] || enUS
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return format(date, formatString); // Fallback to default locale
  }
}

/**
 * Format distance between dates with the current locale
 * @param date Date to compare
 * @param baseDate Base date to compare against
 * @returns Formatted distance string
 */
export function formatDateDistance(date: Date | number, baseDate: Date | number): string {
  const currentLocale = localStorage.getItem('language') || 'en';
  
  try {
    return formatDistance(date, baseDate, {
      locale: locales[currentLocale] || enUS,
      addSuffix: true
    });
  } catch (error) {
    console.error('Error formatting date distance:', error);
    return formatDistance(date, baseDate, { addSuffix: true }); // Fallback
  }
}

/**
 * Get the appropriate date-fns locale
 * @returns The current locale object
 */
export function getDateLocale(): Locale {
  const currentLocale = localStorage.getItem('language') || 'en';
  return locales[currentLocale] || enUS;
}

/**
 * Hook to provide date formatting utilities with current locale
 */
export function useDateFormatter() {
  const { language, isRTL } = useTranslation();
  
  return {
    formatDate: (date: Date | number, formatString: string = 'PPP') => 
      formatDate(date, formatString, { locale: language }),
    
    formatDistance: (date: Date | number, baseDate: Date | number) => 
      formatDateDistance(date, baseDate),
    
    getLocale: () => locales[language] || enUS,
    
    isRTL,
    
    // Helper method for formatting in agreement contexts
    formatAgreementDate: (date: Date | number) => {
      try {
        return formatDate(date, 'MMMM d, yyyy', { locale: language });
      } catch (error) {
        console.error('Error formatting agreement date:', error);
        return format(date, 'MMM d, yyyy');
      }
    }
  };
}
