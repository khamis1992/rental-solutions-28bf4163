
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

// Configure pdfMake with only Helvetica fonts (most basic setup)
export function configurePdfMakeFonts(): void {
  try {
    // Use only the most basic Helvetica configuration
    (pdfMake as any).fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    
    console.log('PDF fonts configured with basic Helvetica only');
  } catch (error) {
    console.error('Error configuring PDF fonts:', error);
    // Leave fonts undefined to use browser defaults
  }
}

// Check if fonts are available
export function checkFontAvailability(): boolean {
  try {
    return !!(pdfMake as any).fonts;
  } catch (error) {
    console.error('Error checking font availability:', error);
    return false;
  }
}

// Initialize fonts with minimal setup
export async function initializeFonts(): Promise<boolean> {
  try {
    configurePdfMakeFonts();
    return true;
  } catch (error) {
    console.error('Font initialization failed:', error);
    return false;
  }
}
