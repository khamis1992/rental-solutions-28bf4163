
import { getTextAlignmentAndDirection, toEnglishNumerals } from './language-utils';

// Utility functions for proper Arabic text handling in PDFs

/**
 * Fixes Arabic text order and ensures proper RTL rendering
 * Uses Unicode Bidirectional Algorithm to maintain correct word order
 */
export function fixArabicTextOrder(text: string): string {
  if (!text) return text;
  
  // Check if text contains Arabic characters
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  
  if (!hasArabic) return text;
  
  // Remove any existing directional marks that might interfere
  const cleaned = text.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
  
  // For Arabic text in PDF, we need to preserve the logical order
  // Add RLE (Right-to-Left Embedding) and PDF (Pop Directional Formatting)
  // This ensures the text maintains correct order when rendered
  return '\u202B' + cleaned + '\u202C';
}

/**
 * Prepares Arabic text for PDF rendering with proper bidirectional handling
 * Ensures text appears in correct reading order
 */
export function prepareArabicForPDF(text: string): string {
  if (!text) return text;
  
  // Check if text contains Arabic characters
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  
  if (!hasArabic) return text;
  
  // Apply proper text ordering for Arabic content
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
    rtl
  };
}

/**
 * Formats currency amounts in Arabic with proper text direction
 */
export function formatArabicCurrency(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return toEnglishNumerals('\u200E0 QAR');
  // Use LTR mark to force left-to-right display for numbers and currency
  return '\u200E' + toEnglishNumerals(`${amount.toLocaleString('en-US')} QAR`);
}

/**
 * Formats dates in Arabic with proper text direction
 */
export function formatArabicDate(date: string | Date | null | undefined): string {
  if (!date) return prepareArabicForPDF('غير محدد');
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return prepareArabicForPDF(dateObj.toLocaleDateString('ar-QA'));
}
