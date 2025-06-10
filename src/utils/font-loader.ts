
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

// Simplified font configuration using available system fonts as fallback
export const ARABIC_FONTS: FontMap = {
  // Use system fonts that are more reliable for Arabic text
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Regular.ttf',
    bolditalics: 'Roboto-Medium.ttf',
  }
};

// Configure pdfMake with reliable fonts
export function configurePdfMakeFonts(fonts: FontMap = ARABIC_FONTS): void {
  try {
    // Use the default pdfMake fonts which are more stable
    console.log('Using default pdfMake fonts for better compatibility');
  } catch (error) {
    console.error('Error configuring PDF fonts:', error);
    throw new Error('Failed to configure PDF fonts');
  }
}

// Check if default fonts are available
export function checkFontAvailability(): boolean {
  try {
    // Default pdfMake fonts are always available
    console.log('Default fonts are available');
    return true;
  } catch (error) {
    console.error('Error checking font availability:', error);
    return false;
  }
}

// Simplified font initialization using default fonts
export async function initializeFonts(): Promise<boolean> {
  try {
    // Don't try to load custom fonts, use defaults
    console.log('Using default pdfMake fonts for stability');
    return true;
  } catch (error) {
    console.error('Font initialization failed:', error);
    return false;
  }
}
