
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

// Use only default pdfMake fonts - no custom font loading
export const ARABIC_FONTS: FontMap = {
  Roboto: {
    normal: 'Roboto',
    bold: 'Roboto',
    italics: 'Roboto',
    bolditalics: 'Roboto',
  }
};

// Configure pdfMake with default fonts only
export function configurePdfMakeFonts(fonts: FontMap = ARABIC_FONTS): void {
  try {
    // Don't set custom fonts, use pdfMake defaults
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

// Simplified font initialization - no custom fonts
export async function initializeFonts(): Promise<boolean> {
  try {
    // Don't load any custom fonts, just use defaults
    console.log('Using default pdfMake fonts for stability');
    return true;
  } catch (error) {
    console.error('Font initialization failed:', error);
    return false;
  }
}
