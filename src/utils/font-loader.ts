
import pdfMake from 'pdfmake/build/pdfmake';

export interface FontConfig {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
}

export interface FontMap {
  [fontName: string]: FontConfig;
}

// Simplified font configuration with fallbacks
export const ARABIC_FONTS: FontMap = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  }
};

// Configure pdfMake with fallback fonts
export function configurePdfMakeFonts(fonts: FontMap = ARABIC_FONTS): void {
  try {
    (pdfMake as any).fonts = fonts;
    console.log('PDF fonts configured successfully:', Object.keys(fonts));
  } catch (error) {
    console.error('Error configuring PDF fonts:', error);
    // Use default fonts as fallback
    (pdfMake as any).fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      }
    };
  }
}

// Check if fonts are loaded and available
export function checkFontAvailability(): boolean {
  try {
    return !!(pdfMake as any).fonts && Object.keys((pdfMake as any).fonts).length > 0;
  } catch (error) {
    console.error('Error checking font availability:', error);
    return false;
  }
}

// Initialize fonts with error handling and fallbacks
export async function initializeFonts(): Promise<boolean> {
  try {
    configurePdfMakeFonts();
    const available = checkFontAvailability();
    console.log('Font initialization result:', available);
    return available;
  } catch (error) {
    console.error('Font initialization failed, using fallback:', error);
    configurePdfMakeFonts();
    return true; // Return true for fallback fonts
  }
}
