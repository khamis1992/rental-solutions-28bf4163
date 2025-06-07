
import { getTextAlignmentAndDirection, toEnglishNumerals } from './language-utils';

// Simplified Arabic text handling utilities for PDFs

/**
 * Basic Arabic text preparation for PDF rendering
 * Simplified to avoid complex text processing that causes issues
 */
export function prepareArabicForPDF(text: string): string {
  if (!text) return text;
  
  // Just convert numerals and clean up basic formatting
  return toEnglishNumerals(text).trim();
}

/**
 * Creates a text block for PDF with proper alignment
 */
export function createArabicTextBlock(text: string, style?: any): any {
  const { alignment } = getTextAlignmentAndDirection(text);
  return {
    text: prepareArabicForPDF(text),
    style: style || (alignment === 'right' ? 'arabicText' : undefined),
    alignment,
  };
}

/**
 * Formats currency amounts with proper numeral conversion
 */
export function formatArabicCurrency(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return toEnglishNumerals('0 QAR');
  return toEnglishNumerals(`${amount.toLocaleString('en-US')} QAR`);
}

/**
 * Formats dates with proper conversion
 */
export function formatArabicDate(date: string | Date | null | undefined): string {
  if (!date) return prepareArabicForPDF('غير محدد');
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return prepareArabicForPDF(dateObj.toLocaleDateString('ar-QA'));
}
