
// Unified Arabic text utilities for PDF generation and display

/**
 * Prepares Arabic text for PDF generation by handling RTL and special characters
 */
export function prepareArabicForPDF(text: string): string {
  if (!text) return '';
  
  // Basic Arabic text preparation
  // Remove any problematic characters and normalize the text
  return text
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove directional marks
    .trim();
}

/**
 * Creates an Arabic text block for pdfMake with proper styling
 */
export function createArabicTextBlock(text: string, style: string) {
  return {
    text: prepareArabicForPDF(text),
    style: style,
    alignment: 'right',
    rtl: true
  };
}

/**
 * Formats currency for Arabic display
 */
export function formatArabicCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return prepareArabicForPDF('0 ريال قطري');
  }
  
  const formatted = new Intl.NumberFormat('ar-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  
  return prepareArabicForPDF(formatted);
}

/**
 * Formats date for Arabic display
 */
export function formatArabicDate(date: string | Date | null | undefined): string {
  if (!date) return prepareArabicForPDF('محدد غير');
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return prepareArabicForPDF('محدد غير');
    }
    
    const formatted = new Intl.DateTimeFormat('ar-QA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
    
    return prepareArabicForPDF(formatted);
  } catch (error) {
    console.error('Error formatting Arabic date:', error);
    return prepareArabicForPDF('محدد غير');
  }
}

/**
 * Handles Arabic text direction and formatting for RTL display
 */
export function formatArabicText(text: string): string {
  return prepareArabicForPDF(text);
}
