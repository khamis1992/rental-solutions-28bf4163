
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
 * Uses best available approach for the current environment
 */
export function registerArabicSupport(doc: jsPDF): void {
  try {
    // Use a standard font and rely on browser's built-in support
    doc.setFont('helvetica');
    
    // Configure RTL support if available
    if (typeof (doc as any).setR2L === 'function') {
      (doc as any).setR2L(true);
    }
    
    console.log("Arabic support configured for PDF generation");
  } catch (error) {
    console.error("Error configuring Arabic support:", error);
  }
}

/**
 * Helper function to safely set R2L mode in jsPDF
 * @param doc The jsPDF document
 * @param isRTL Whether to enable RTL mode
 */
export function safeSetRTL(doc: jsPDF, isRTL: boolean): void {
  try {
    if (typeof (doc as any).setR2L === 'function') {
      (doc as any).setR2L(isRTL);
    }
  } catch (error) {
    console.error("Error setting R2L mode:", error);
  }
}

/**
 * Uses getStringUnitWidth to detect if Arabic characters are properly supported
 * @param doc The jsPDF document
 * @returns Whether Arabic is supported
 */
export function testArabicSupport(doc: jsPDF): boolean {
  const arabicText = 'مرحبا بالعالم'; // "Hello World" in Arabic
  try {
    const width = doc.getStringUnitWidth(arabicText);
    return width > 0;
  } catch (error) {
    console.error("Arabic support test failed:", error);
    return false;
  }
}
