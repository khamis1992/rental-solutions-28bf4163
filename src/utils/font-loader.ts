
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

// Configure pdfMake to use built-in fonts only - NO custom font configuration
export function configurePdfMakeFonts(): void {
  try {
    // Do NOT configure custom fonts - let PDFMake use its built-in fonts
    console.log('Using PDFMake built-in fonts (no custom configuration)');
  } catch (error) {
    console.error('Error in configurePdfMakeFonts:', error);
  }
}

// Check if fonts are available (always return true for built-in fonts)
export function checkFontAvailability(): boolean {
  try {
    console.log('Font availability check: using built-in fonts');
    return true;
  } catch (error) {
    console.error('Error checking font availability:', error);
    return true; // Always return true for built-in fonts
  }
}

// Initialize fonts with built-in font support
export async function initializeFonts(): Promise<boolean> {
  try {
    console.log('Starting font initialization with built-in fonts...');
    configurePdfMakeFonts();
    const available = checkFontAvailability();
    console.log('Font initialization result:', available);
    return available;
  } catch (error) {
    console.error('Font initialization failed, using built-in fonts:', error);
    return true; // Return true since built-in fonts are always available
  }
}
