
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

// Configure pdfMake with Helvetica fonts (safe fallback)
export function configurePdfMakeFonts(): void {
  try {
    // Use built-in Helvetica font which is always available
    (pdfMake as any).fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    
    console.log('PDF fonts configured with Helvetica');
  } catch (error) {
    console.error('Error configuring PDF fonts:', error);
    // Fonts will fall back to browser defaults
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

// Initialize fonts
export async function initializeFonts(): Promise<boolean> {
  try {
    configurePdfMakeFonts();
    return true;
  } catch (error) {
    console.error('Font initialization failed:', error);
    return false;
  }
}
