// Simplified Arabic text utilities for PDF generation

/**
 * Clean Arabic text for PDF rendering
 */
export function prepareArabicForPDF(text: string): string {
  if (!text || typeof text !== 'string') return 'غير محدد';
  
  // Remove problematic characters and keep only safe ones
  return text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove bidirectional marks
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E\u000A\u000D]/g, '') // Keep only Arabic, Latin, and basic characters
    .trim() || 'غير محدد';
}

/**
 * Create safe Arabic text block
 */
export function createArabicTextBlock(text: string, style?: string) {
  return {
    text: prepareArabicForPDF(text),
    style: style || 'normal',
    alignment: 'right' as const
  };
}

/**
 * Format currency for Arabic display
 */
export function formatArabicCurrency(amount: number | undefined | null): string {
  if (!amount && amount !== 0) return 'غير محدد';
  
  try {
    return `${amount.toFixed(2)} ريال قطري`;
  } catch {
    return 'غير محدد';
  }
}

/**
 * Format date for Arabic display
 */
export function formatArabicDate(date: string | Date | undefined): string {
  if (!date) return 'غير محدد';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'غير محدد';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'غير محدد';
  }
}

/**
 * Process Arabic text safely
 */
export function processArabicText(text: string): string {
  return prepareArabicForPDF(text);
}

/**
 * Convert English numbers to Arabic numerals
 */
export function toArabicNumerals(text: string): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[0-9]/g, (digit) => arabicNumbers[parseInt(digit)]);
}
