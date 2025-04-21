
import { jsPDF } from 'jspdf';

// Unicode range for Arabic characters
const ARABIC_UNICODE_RANGE = {
  0x0600: 0x06FF, // Arabic
  0x0750: 0x077F, // Arabic Supplement
  0x08A0: 0x08FF, // Arabic Extended-A
  0xFB50: 0xFDFF, // Arabic Presentation Forms-A
  0xFE70: 0xFEFF, // Arabic Presentation Forms-B
};

/**
 * Registers Arabic support for jsPDF
 */
export function registerArabicSupport(doc: jsPDF): void {
  try {
    // Add Amiri font for better Arabic support (CDN for reliability)
    doc.addFont('https://cdn.jsdelivr.net/npm/amiri@0.114.0/amiri-regular.ttf', 'Amiri', 'normal');
    doc.addFont('https://cdn.jsdelivr.net/npm/amiri@0.114.0/amiri-bold.ttf', 'Amiri', 'bold');
    
    // Add Cairo font as another option
    doc.addFont('https://cdn.jsdelivr.net/npm/@fontsource/cairo@5.0.8/files/cairo-all-400-normal.woff', 'Cairo', 'normal');
    doc.addFont('https://cdn.jsdelivr.net/npm/@fontsource/cairo@5.0.8/files/cairo-all-700-normal.woff', 'Cairo', 'bold');
    
    // Set default font to Amiri
    doc.setFont('Amiri');
    
    // Enable RTL support
    if (typeof (doc as any).setR2L === 'function') {
      (doc as any).setR2L(true);
    }
    
    console.log("Arabic support configured for PDF generation");
  } catch (error) {
    console.error("Error configuring Arabic support:", error);
    // Fallback to built-in font
    doc.setFont('helvetica');
  }
}

/**
 * Detects if text contains Arabic characters
 */
export function containsArabicText(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
}

/**
 * Normalizes Arabic text for better display
 */
export function normalizeArabicText(text: string): string {
  // Skip if not string
  if (typeof text !== 'string') return String(text);
  
  return text
    .replace(/\u0640/g, '') // Remove tatweel
    .replace(/[\u064B-\u065F]/g, ''); // Remove diacritics
}

/**
 * Helper function to handle Arabic text in PDFs
 */
export function writeArabicText(doc: jsPDF, text: string, x: number, y: number, options: any = {}): void {
  try {
    const isRTL = containsArabicText(text);
    
    if (isRTL) {
      // Try to use Amiri font first, then Cairo as fallback
      try {
        doc.setFont('Amiri');
      } catch (e) {
        try {
          doc.setFont('Cairo');
        } catch (e2) {
          doc.setFont('helvetica');
        }
      }
      
      // Make sure the text is normalized for better display
      const normalizedText = normalizeArabicText(text);
      
      // Calculate position for RTL text
      const textWidth = doc.getTextWidth(normalizedText);
      const pageWidth = doc.internal.pageSize.getWidth();
      let finalX = x;
      
      if (options.align === 'right') {
        finalX = x;
      } else if (options.align === 'center') {
        finalX = pageWidth / 2;
      } else {
        // For left-aligned Arabic, we need to adjust
        finalX = pageWidth - x - textWidth;
      }
      
      // Enable RTL mode if available
      if (typeof (doc as any).setR2L === 'function') {
        (doc as any).setR2L(true);
      }
      
      // Write the text
      doc.text(normalizedText, finalX, y, { 
        align: options.align || 'right',
        ...options,
        isInputRtl: true,
      });
      
      // Restore RTL mode
      if (typeof (doc as any).setR2L === 'function') {
        (doc as any).setR2L(false);
      }
    } else {
      // Non-Arabic text
      doc.text(text, x, y, options);
    }
  } catch (error) {
    console.error("Error writing Arabic text:", error);
    // Fallback to standard text
    doc.text(text, x, y, options);
  }
}

/**
 * Tests if Arabic text is properly supported
 */
export function testArabicSupport(doc: jsPDF): boolean {
  const arabicText = 'مرحبا بالعالم'; // "Hello World" in Arabic
  try {
    // Try with Amiri font
    doc.setFont('Amiri');
    const width = doc.getStringUnitWidth(arabicText);
    return width > 0;
  } catch (error) {
    console.error("Arabic support test with Amiri failed, trying Cairo:", error);
    
    try {
      // Try with Cairo font
      doc.setFont('Cairo');
      const width = doc.getStringUnitWidth(arabicText);
      return width > 0;
    } catch (error2) {
      console.error("Arabic support test with Cairo failed:", error2);
      return false;
    }
  }
}

/**
 * Safely sets the R2L (Right-to-Left) mode for a PDF document
 * @param doc jsPDF document instance
 * @param isRTL boolean to enable or disable RTL mode
 * @returns boolean indicating if the operation was successful
 */
export function safeSetRTL(doc: jsPDF, isRTL: boolean): boolean {
  try {
    if (typeof (doc as any).setR2L === 'function') {
      (doc as any).setR2L(isRTL);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to set RTL mode:", error);
    return false;
  }
}
