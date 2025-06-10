
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

// Font configuration for Arabic support using Amiri
export const ARABIC_FONTS: FontMap = {
  Amiri: {
    normal: '/Amiri-Regular.ttf',
    bold: '/Amiri-Bold.ttf',
    italics: '/Amiri-Regular.ttf',
    bolditalics: '/Amiri-Bold.ttf',
  }
};

// Configure pdfMake with Amiri fonts
export function configurePdfMakeFonts(fonts: FontMap = ARABIC_FONTS): void {
  try {
    // Set the fonts
    (pdfMake as any).fonts = fonts;
    
    // Initialize VFS if not present
    if (!(pdfMake as any).vfs) {
      (pdfMake as any).vfs = {};
    }
    
    console.log('PDF fonts configured successfully:', Object.keys(fonts));
  } catch (error) {
    console.error('Error configuring PDF fonts:', error);
    throw new Error('Failed to configure PDF fonts');
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

// Initialize fonts with error handling
export async function initializeFonts(): Promise<boolean> {
  try {
    configurePdfMakeFonts();
    return checkFontAvailability();
  } catch (error) {
    console.error('Font initialization failed:', error);
    return false;
  }
}
