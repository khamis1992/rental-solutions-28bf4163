
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
    // Add Amiri font for better Arabic support
    doc.addFont('https://cdn.jsdelivr.net/npm/amiri@0.114.0/amiri-regular.ttf', 'Amiri', 'normal');
    doc.addFont('https://cdn.jsdelivr.net/npm/amiri@0.114.0/amiri-bold.ttf', 'Amiri', 'bold');
    
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
 * Helper function to handle Arabic text in PDFs
 */
export function writeArabicText(doc: jsPDF, text: string, x: number, y: number, options: any = {}): void {
  try {
    const isRTL = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
    
    if (isRTL) {
      doc.setFont('Amiri');
      // Calculate position for RTL text
      const textWidth = doc.getTextWidth(text);
      const finalX = options.align === 'right' ? x : (doc.internal.pageSize.getWidth() - x - textWidth);
      
      doc.text(text, finalX, y, { 
        align: 'left',
        isInputRtl: true,
        ...options
      });
    } else {
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
  const arabicText = 'مرحبا بالعالم';
  try {
    const width = doc.getStringUnitWidth(arabicText);
    return width > 0;
  } catch (error) {
    console.error("Arabic support test failed:", error);
    return false;
  }
}
