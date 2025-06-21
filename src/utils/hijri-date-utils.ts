
import moment from 'moment';
import 'moment-hijri';

// Extend moment with Hijri functionality
declare module 'moment' {
  interface Moment {
    iHijri(): Moment;
    format(format?: string): string;
  }
  
  interface MomentStatic {
    iHijri(input?: moment.MomentInput, format?: moment.MomentFormatSpecification): Moment;
  }
}

/**
 * Convert Hijri date to Gregorian date
 * @param hijriDate - Hijri date string in format 'YYYY/MM/DD' or 'YYYY-MM-DD'
 * @returns Gregorian Date object or null if invalid
 */
export const hijriToGregorian = (hijriDate: string): Date | null => {
  try {
    if (!hijriDate || typeof hijriDate !== 'string') {
      return null;
    }

    // Clean the input and normalize format
    const cleanDate = hijriDate.trim();
    if (!cleanDate) return null;

    // Parse Hijri date using moment-hijri
    const hijriMoment = moment.iHijri(cleanDate, ['iYYYY/iMM/iDD', 'iYYYY-iMM-iDD', 'iYYYY/iM/iD', 'iYYYY-iM-iD']);
    
    if (!hijriMoment.isValid()) {
      console.warn('Invalid Hijri date:', hijriDate);
      return null;
    }

    // Convert to Gregorian
    const gregorianDate = hijriMoment.toDate();
    
    // Validate the result
    if (isNaN(gregorianDate.getTime())) {
      console.warn('Invalid conversion result for Hijri date:', hijriDate);
      return null;
    }

    return gregorianDate;
  } catch (error) {
    console.error('Error converting Hijri to Gregorian:', error, 'Input:', hijriDate);
    return null;
  }
};

/**
 * Convert Gregorian date to Hijri date
 * @param gregorianDate - Gregorian Date object or date string
 * @returns Hijri date string in format 'YYYY/MM/DD' or null if invalid
 */
export const gregorianToHijri = (gregorianDate: Date | string): string | null => {
  try {
    if (!gregorianDate) return null;

    const gregorianMoment = moment(gregorianDate);
    
    if (!gregorianMoment.isValid()) {
      console.warn('Invalid Gregorian date:', gregorianDate);
      return null;
    }

    // Convert to Hijri
    const hijriMoment = gregorianMoment.iHijri();
    const hijriString = hijriMoment.format('iYYYY/iMM/iDD');
    
    return hijriString;
  } catch (error) {
    console.error('Error converting Gregorian to Hijri:', error, 'Input:', gregorianDate);
    return null;
  }
};

/**
 * Format Hijri date for display in Arabic
 * @param hijriDate - Hijri date string
 * @returns Formatted Arabic date string
 */
export const formatHijriDateArabic = (hijriDate: string): string => {
  try {
    if (!hijriDate) return '';

    const hijriMoment = moment.iHijri(hijriDate, ['iYYYY/iMM/iDD', 'iYYYY-iMM-iDD']);
    
    if (!hijriMoment.isValid()) {
      return hijriDate; // Return original if can't format
    }

    // Format in Arabic style
    return hijriMoment.format('iDD/iMM/iYYYY هـ');
  } catch (error) {
    console.error('Error formatting Hijri date:', error);
    return hijriDate;
  }
};

/**
 * Validate if a string is a valid Hijri date
 * @param hijriDate - Date string to validate
 * @returns boolean indicating validity
 */
export const isValidHijriDate = (hijriDate: string): boolean => {
  try {
    if (!hijriDate || typeof hijriDate !== 'string') {
      return false;
    }

    const hijriMoment = moment.iHijri(hijriDate.trim(), ['iYYYY/iMM/iDD', 'iYYYY-iMM-iDD', 'iYYYY/iM/iD', 'iYYYY-iM-iD']);
    return hijriMoment.isValid();
  } catch (error) {
    return false;
  }
};

/**
 * Get current Hijri date
 * @returns Current Hijri date string in format 'YYYY/MM/DD'
 */
export const getCurrentHijriDate = (): string => {
  try {
    const now = moment().iHijri();
    return now.format('iYYYY/iMM/iDD');
  } catch (error) {
    console.error('Error getting current Hijri date:', error);
    return '';
  }
};

/**
 * Parse mixed date input (could be Hijri or Gregorian)
 * @param dateInput - Date string that could be in either format
 * @returns Object with both Hijri and Gregorian representations
 */
export const parseMixedDate = (dateInput: string): {
  hijri: string | null;
  gregorian: Date | null;
  isHijri: boolean;
} => {
  if (!dateInput) {
    return { hijri: null, gregorian: null, isHijri: false };
  }

  // First, check if it's a valid Hijri date
  if (isValidHijriDate(dateInput)) {
    const gregorianDate = hijriToGregorian(dateInput);
    return {
      hijri: dateInput,
      gregorian: gregorianDate,
      isHijri: true
    };
  }

  // If not Hijri, try to parse as Gregorian
  const gregorianMoment = moment(dateInput);
  if (gregorianMoment.isValid()) {
    const gregorianDate = gregorianMoment.toDate();
    const hijriDate = gregorianToHijri(gregorianDate);
    return {
      hijri: hijriDate,
      gregorian: gregorianDate,
      isHijri: false
    };
  }

  // If neither format works
  return { hijri: null, gregorian: null, isHijri: false };
};

/**
 * Hijri month names in Arabic
 */
export const HIJRI_MONTHS_ARABIC = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

/**
 * Get Hijri month name in Arabic
 * @param monthNumber - Month number (1-12)
 * @returns Arabic month name
 */
export const getHijriMonthNameArabic = (monthNumber: number): string => {
  if (monthNumber < 1 || monthNumber > 12) {
    return '';
  }
  return HIJRI_MONTHS_ARABIC[monthNumber - 1];
};
