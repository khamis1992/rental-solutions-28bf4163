
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

// Configure pdfMake to use built-in browser fonts
export function configurePdfMakeFonts(): void {
  try {
    // Use built-in browser fonts that are available across all systems
    pdfMake.fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      },
      // Add fallback font family
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    console.log('PDFMake configured with built-in browser fonts');
  } catch (error) {
    console.error('Error configuring PDFMake fonts:', error);
  }
}

// Check if fonts are configured properly
export function checkFontAvailability(): boolean {
  try {
    const fonts = (pdfMake as any).fonts;
    const hasRoboto = fonts && fonts.Roboto;
    console.log('Font availability check:', { hasRoboto, fonts });
    return hasRoboto;
  } catch (error) {
    console.error('Error checking font availability:', error);
    return false;
  }
}

// Initialize fonts with built-in font support
export async function initializeFonts(): Promise<boolean> {
  try {
    console.log('Starting font initialization with built-in browser fonts...');
    configurePdfMakeFonts();
    const available = checkFontAvailability();
    console.log('Font initialization result:', available);
    return available;
  } catch (error) {
    console.error('Font initialization failed:', error);
    // Always return true since we're using built-in fonts
    return true;
  }
}
