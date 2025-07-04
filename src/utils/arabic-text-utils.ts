
// Arabic text processing utilities for PDF generation

/**
 * Prepare Arabic text for PDF rendering
 * Handles RTL text processing and special characters
 */
export function prepareArabicForPDF(text: string): string {
  if (!text) return '';
  
  // Remove problematic characters that might break PDF generation
  return text
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove RTL/LTR marks
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E]/g, ''); // Keep only Arabic and basic Latin
}

/**
 * Create an Arabic text block with proper styling
 */
export function createArabicTextBlock(text: string, style?: string) {
  return {
    text: prepareArabicForPDF(text),
    style: style || 'default',
    alignment: 'right' as const,
    direction: 'rtl' as const
  };
}

/**
 * Format currency for Arabic display
 */
export function formatArabicCurrency(amount: number | undefined | null): string {
  if (!amount && amount !== 0) return 'غير محدد';
  
  const formatted = new Intl.NumberFormat('ar-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  
  return formatted;
}

/**
 * Format currency for Arabic display (alias for compatibility)
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (!amount && amount !== 0) return 'غير محدد';
  
  const formatted = new Intl.NumberFormat('ar-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  
  return formatted.replace('QAR', 'ريال').replace('ر.ق.', 'ريال');
}

/**
 * Format date for Arabic display
 */
export function formatArabicDate(date: string | Date | undefined): string {
  if (!date) return 'تاريخ غير صحيح';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'تاريخ غير صحيح';
  
  return new Intl.DateTimeFormat('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}

/**
 * Convert English numbers to Arabic numerals
 */
export function toArabicNumerals(text: string): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[0-9]/g, (digit) => arabicNumbers[parseInt(digit)]);
}

/**
 * Convert English numbers to Arabic numerals (alias for compatibility)
 */
export function convertToArabicNumerals(text: string): string {
  if (!text) return '';
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[0-9]/g, (digit) => arabicNumbers[parseInt(digit)]);
}

/**
 * Check if text contains Arabic characters
 */
export function isArabicText(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(trimmed);
}

/**
 * Sanitize and clean Arabic text
 */
export function sanitizeArabicText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '');
}

/**
 * Process Arabic text for better PDF rendering
 */
export function processArabicText(text: string): string {
  return prepareArabicForPDF(text);
}
