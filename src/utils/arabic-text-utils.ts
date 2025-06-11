
// Arabic text processing utilities for PDF generation

/**
 * Prepare Arabic text for PDF rendering with fallback handling
 */
export function prepareArabicForPDF(text: string): string {
  if (!text) return '';
  
  try {
    // Basic text cleanup for PDF compatibility
    return text
      .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove RTL/LTR marks
      .trim();
  } catch (error) {
    console.error('Error preparing Arabic text:', error);
    return text || '';
  }
}

/**
 * Create an Arabic text block with proper styling and fallbacks
 */
export function createArabicTextBlock(text: string, style?: string) {
  const cleanText = prepareArabicForPDF(text);
  
  return {
    text: cleanText,
    style: style || 'default',
    alignment: 'right' as const,
    direction: 'rtl' as const
  };
}

/**
 * Format currency for Arabic display with fallback
 */
export function formatArabicCurrency(amount: number | undefined | null): string {
  if (!amount && amount !== 0) return 'غير محدد';
  
  try {
    const formatted = new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
    
    return formatted;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount} ر.ق`;
  }
}

/**
 * Format date for Arabic display with fallback
 */
export function formatArabicDate(date: string | Date | undefined): string {
  if (!date) return 'غير محدد';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'غير محدد';
    
    return new Intl.DateTimeFormat('ar-QA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  } catch (error) {
    console.error('Error formatting date:', error);
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString() || 'غير محدد';
  }
}

/**
 * Convert English numbers to Arabic numerals with fallback
 */
export function toArabicNumerals(text: string): string {
  try {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return text.replace(/[0-9]/g, (digit) => arabicNumbers[parseInt(digit)]);
  } catch (error) {
    console.error('Error converting to Arabic numerals:', error);
    return text;
  }
}

/**
 * Process Arabic text for better PDF rendering with error handling
 */
export function processArabicText(text: string): string {
  try {
    return prepareArabicForPDF(text);
  } catch (error) {
    console.error('Error processing Arabic text:', error);
    return text || '';
  }
}
