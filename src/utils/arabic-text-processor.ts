
/**
 * Advanced Arabic text processing utilities for PDF generation
 * Handles proper RTL text rendering, Arabic shaping, and bidirectional text
 */

// Arabic Unicode ranges
const ARABIC_RANGES = [
  [0x0600, 0x06FF], // Arabic
  [0x0750, 0x077F], // Arabic Supplement
  [0x08A0, 0x08FF], // Arabic Extended-A
  [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
  [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
];

// Arabic text direction markers
const RTL_MARK = '\u200F'; // Right-to-Left Mark
const LTR_MARK = '\u200E'; // Left-to-Right Mark
const RLO = '\u202E'; // Right-to-Left Override
const LRO = '\u202D'; // Left-to-Right Override
const PDF = '\u202C'; // Pop Directional Formatting

/**
 * Detects if text contains Arabic characters
 */
export function hasArabicCharacters(text: string): boolean {
  if (!text) return false;
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    for (const [start, end] of ARABIC_RANGES) {
      if (charCode >= start && charCode <= end) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Processes Arabic text for proper RTL rendering in PDFs
 */
export function processArabicText(text: string): string {
  if (!text || !hasArabicCharacters(text)) {
    return text;
  }

  // Clean existing directional marks
  let cleanText = text.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
  
  // For mixed content (Arabic + Latin), we need special handling
  if (hasMixedContent(cleanText)) {
    return processMixedContent(cleanText);
  }
  
  // For pure Arabic text, add RTL override
  return `${RLO}${cleanText}${PDF}`;
}

/**
 * Detects mixed Arabic and Latin content
 */
function hasMixedContent(text: string): boolean {
  const hasArabic = hasArabicCharacters(text);
  const hasLatin = /[a-zA-Z0-9]/.test(text);
  return hasArabic && hasLatin;
}

/**
 * Processes mixed Arabic/Latin content
 */
function processMixedContent(text: string): string {
  // Split text into segments and process each appropriately
  const segments = text.split(/(\s+)/).filter(Boolean);
  
  return segments.map(segment => {
    if (segment.trim() === '') return segment; // Preserve whitespace
    
    if (hasArabicCharacters(segment)) {
      return `${RLO}${segment}${PDF}`;
    } else if (/[a-zA-Z0-9]/.test(segment)) {
      return `${LRO}${segment}${PDF}`;
    }
    
    return segment;
  }).join('');
}

/**
 * Creates properly formatted Arabic text for pdfMake with enhanced RTL support
 */
export function createArabicPdfText(text: string, style?: any): any {
  const processedText = processArabicText(text);
  
  return {
    text: processedText,
    style: style || 'arabicText',
    alignment: hasArabicCharacters(text) ? 'right' : 'left',
    direction: hasArabicCharacters(text) ? 'rtl' : 'ltr'
  };
}

/**
 * Formats currency with proper Arabic text direction
 */
export function formatArabicCurrency(amount: number | null | undefined, currency: string = 'ر.ق'): string {
  if (!amount && amount !== 0) return processArabicText(`0 ${currency}`);
  
  const formattedAmount = amount.toLocaleString('ar-QA');
  return processArabicText(`${formattedAmount} ${currency}`);
}

/**
 * Formats dates with proper Arabic text direction
 */
export function formatArabicDate(date: string | Date | null | undefined): string {
  if (!date) return processArabicText('غير محدد');
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const arabicDate = dateObj.toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return processArabicText(arabicDate);
}

/**
 * Enhanced table cell creation for Arabic content
 */
export function createArabicTableCell(content: string, style?: any): any {
  return {
    text: processArabicText(content),
    style: style || 'arabicTableCell',
    alignment: hasArabicCharacters(content) ? 'right' : 'center',
    direction: hasArabicCharacters(content) ? 'rtl' : 'ltr'
  };
}

/**
 * Processes agreement status for Arabic display
 */
export function formatArabicStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'نشط',
    'pending': 'معلق',
    'completed': 'مكتمل',
    'cancelled': 'ملغي',
    'overdue': 'متأخر',
    'paid': 'مدفوع',
    'unpaid': 'غير مدفوع'
  };
  
  const arabicStatus = statusMap[status?.toLowerCase()] || status || 'غير محدد';
  return processArabicText(arabicStatus);
}

/**
 * Processes payment method for Arabic display
 */
export function formatArabicPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    'cash': 'نقداً',
    'card': 'بطاقة',
    'bank_transfer': 'تحويل بنكي',
    'cheque': 'شيك'
  };
  
  const arabicMethod = methodMap[method?.toLowerCase()] || method || 'غير محدد';
  return processArabicText(arabicMethod);
}
