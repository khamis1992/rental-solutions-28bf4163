import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

export interface FontConfig {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
}

export interface FontMap {
  [fontName: string]: FontConfig;
}

// Configure pdfMake with Roboto font for browser compatibility
export function configurePdfMakeFonts(): void {
  try {
    // Assign the vfs to pdfMake, which contains the font data
    if (pdfFonts && pdfFonts.pdfMake) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs;
    }

    // Use Roboto as the default font, pointing to the correct file names in the VFS
    (pdfMake as any).fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    
    console.log('PDF fonts configured with Roboto and VFS');
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
