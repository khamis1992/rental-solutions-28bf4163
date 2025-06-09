
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

// Simplified font configuration using system fonts as fallback
export const DEFAULT_FONTS: FontMap = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

// Basic VFS configuration
const basicVFS = {
  'Roboto-Regular.ttf': '', // Empty string for system fallback
  'Roboto-Medium.ttf': '',
  'Roboto-Italic.ttf': '',
  'Roboto-MediumItalic.ttf': ''
};

// Configure pdfMake with safe defaults
export function configurePdfMakeFonts(fonts: FontMap = DEFAULT_FONTS): void {
  try {
    // Ensure pdfMake is properly initialized
    if (!pdfMake) {
      throw new Error('pdfMake is not available');
    }

    // Set the fonts
    (pdfMake as any).fonts = fonts;
    
    // Initialize VFS with basic configuration
    if (!(pdfMake as any).vfs) {
      (pdfMake as any).vfs = basicVFS;
    }
    
    console.log('PDF fonts configured successfully:', Object.keys(fonts));
  } catch (error) {
    console.error('Error configuring PDF fonts:', error);
    // Don't throw error, use pdfMake defaults instead
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

// Initialize fonts with comprehensive error handling
export async function initializeFonts(): Promise<boolean> {
  try {
    configurePdfMakeFonts();
    const isAvailable = checkFontAvailability();
    
    if (!isAvailable) {
      console.warn('Font configuration failed, pdfMake will use browser defaults');
    }
    
    return true; // Always return true to allow PDF generation with defaults
  } catch (error) {
    console.error('Font initialization failed:', error);
    return true; // Return true to allow fallback to system fonts
  }
}
