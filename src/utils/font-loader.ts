
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

// Simplified font configuration with fallbacks - ONLY Helvetica
export const HELVETICA_FONTS: FontMap = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  }
};

// Configure pdfMake with fallback fonts
export function configurePdfMakeFonts(fonts: FontMap = HELVETICA_FONTS): void {
  try {
    (pdfMake as any).fonts = fonts;
    console.log('PDF fonts configured successfully:', Object.keys(fonts));
    console.log('Font configuration details:', fonts);
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
    console.log('Applied fallback font configuration');
  }
}

// Check if fonts are loaded and available
export function checkFontAvailability(): boolean {
  try {
    const fontsAvailable = !!(pdfMake as any).fonts && Object.keys((pdfMake as any).fonts).length > 0;
    console.log('Font availability check:', fontsAvailable);
    console.log('Available fonts:', Object.keys((pdfMake as any).fonts || {}));
    return fontsAvailable;
  } catch (error) {
    console.error('Error checking font availability:', error);
    return false;
  }
}

// Initialize fonts with error handling and fallbacks
export async function initializeFonts(): Promise<boolean> {
  try {
    console.log('Starting font initialization...');
    configurePdfMakeFonts();
    const available = checkFontAvailability();
    console.log('Font initialization result:', available);
    console.log('Final font configuration:', (pdfMake as any).fonts);
    return available;
  } catch (error) {
    console.error('Font initialization failed, using fallback:', error);
    configurePdfMakeFonts();
    console.log('Fallback font configuration applied');
    return true; // Return true for fallback fonts
  }
}
