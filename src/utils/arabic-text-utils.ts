
import { toEnglishNumerals } from './language-utils';

/**
 * Prepares Arabic text for PDF rendering by handling text direction and encoding
 */
export function prepareArabicForPDF(text: string): string {
  if (!text) return '';
  
  // Convert any Arabic numerals to English
  const textWithEnglishNumerals = toEnglishNumerals(text);
  
  // Handle Arabic text direction and encoding
  return textWithEnglishNumerals
    .split('')
    .reverse()
    .join('');
}

/**
 * Creates a text block with proper Arabic alignment for pdfMake
 */
export function createArabicTextBlock(text: string, style: string) {
  return {
    text: prepareArabicForPDF(text),
    style: style,
    alignment: 'right' as const,
    rtl: true
  };
}

/**
 * Formats currency in Arabic context but with English numerals
 */
export function formatArabicCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return prepareArabicForPDF('محدد غير');
  }
  
  // Format with English numerals and QAR currency
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  
  return `QAR ${formattedAmount}`;
}

/**
 * Formats dates in Arabic context but with English numerals
 */
export function formatArabicDate(date: string | Date | null | undefined): string {
  if (!date) {
    return prepareArabicForPDF('محدد غير');
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return prepareArabicForPDF('محدد غير');
    }
    
    // Format date in English format (DD/MM/YYYY)
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return prepareArabicForPDF('محدد غير');
  }
}

/**
 * Converts any text containing numbers to English numerals
 */
export function ensureEnglishNumbers(text: string): string {
  if (!text) return '';
  return toEnglishNumerals(text);
}
