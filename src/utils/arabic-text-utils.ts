
// Simplified Arabic text utilities for PDF generation

/**
 * Prepares Arabic text for PDF generation by normalizing and cleaning the text
 */
export function prepareArabicForPDF(text: string): string {
  if (!text) return '';
  
  // Normalize Arabic text and remove problematic characters
  return text
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove directional marks
    .replace(/\u064B/g, '') // Remove fathatan
    .replace(/\u064C/g, '') // Remove dammatan  
    .replace(/\u064D/g, '') // Remove kasratan
    .replace(/\u064E/g, '') // Remove fatha
    .replace(/\u064F/g, '') // Remove damma
    .replace(/\u0650/g, '') // Remove kasra
    .replace(/\u0651/g, '') // Remove shadda
    .replace(/\u0652/g, '') // Remove sukun
    .trim();
}

/**
 * Creates a simple Arabic text block for pdfMake without complex styling
 */
export function createArabicTextBlock(text: string, style: string) {
  return {
    text: prepareArabicForPDF(text),
    style: style
  };
}

/**
 * Formats currency for Arabic display with simple formatting
 */
export function formatArabicCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ريال قطري';
  }
  
  // Use simple number formatting without complex locale features
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return `${formatter.format(amount)} ريال قطري`;
}

/**
 * Formats date for Arabic display with simple formatting
 */
export function formatArabicDate(date: string | Date | null | undefined): string {
  if (!date) return 'غير محدد';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'غير محدد';
    }
    
    // Use simple date formatting
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting Arabic date:', error);
    return 'غير محدد';
  }
}

/**
 * Simple Arabic text formatting without complex features
 */
export function formatArabicText(text: string): string {
  return prepareArabicForPDF(text);
}
