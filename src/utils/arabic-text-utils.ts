
import { getTextAlignmentAndDirection, toEnglishNumerals } from './language-utils';

// Utility functions for proper Arabic text handling in PDFs

/**
 * Reverses the word order in Arabic text to counteract pdfMake's incorrect RTL handling
 * This is a workaround for pdfMake's text ordering issues with Arabic
 */
export function fixArabicTextOrder(text: string): string {
  if (!text) return text;
  
  // Check if text contains Arabic characters
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  
  if (!hasArabic) return text;
  
  // Remove any existing directional marks that might interfere
  const cleaned = text.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
  
  // For Arabic text, reverse the word order to counteract pdfMake's incorrect handling
  // Split by spaces, reverse the array, then join back
  const words = cleaned.split(' ');
  const reversedWords = words.reverse();
  return reversedWords.join(' ');
}

/**
 * Prepares Arabic text for PDF rendering with word order correction
 */
export function prepareArabicForPDF(text: string): string {
  if (!text) return text;
  
  // Check if text contains Arabic characters
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  
  if (!hasArabic) return text;
  
  // Apply word order reversal for Arabic content
  return fixArabicTextOrder(text);
}

/**
 * Creates a properly formatted text block for PDF tables, with correct alignment for Arabic or English
 */
export function createArabicTextBlock(text: string, style?: any): any {
  const { alignment, rtl } = getTextAlignmentAndDirection(text);
  return {
    text: toEnglishNumerals(prepareArabicForPDF(text)),
    style: style || (alignment === 'right' ? 'arabicText' : undefined),
    alignment,
    rtl: false // Disable pdfMake's RTL to use our custom handling
  };
}

/**
 * Formats currency amounts in Arabic with proper text direction
 */
export function formatArabicCurrency(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return toEnglishNumerals('0 QAR');
  // Format without directional marks since we're handling order manually
  return toEnglishNumerals(`${amount.toLocaleString('en-US')} QAR`);
}

/**
 * Formats dates in Arabic with proper text direction
 */
export function formatArabicDate(date: string | Date | null | undefined): string {
  if (!date) return prepareArabicForPDF('غير محدد');
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return prepareArabicForPDF(dateObj.toLocaleDateString('ar-QA'));
}
