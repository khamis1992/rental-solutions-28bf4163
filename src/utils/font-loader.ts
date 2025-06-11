
// Simplified font loader that doesn't configure custom fonts
// PDFMake will use its default Roboto fonts

export interface FontConfig {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
}

export interface FontMap {
  [fontName: string]: FontConfig;
}

// No-op font configuration - let PDFMake use defaults
export function configurePdfMakeFonts(): void {
  console.log('Using PDFMake default fonts (no custom configuration)');
}

// Simple availability check
export function checkFontAvailability(): boolean {
  console.log('Using PDFMake default fonts');
  return true;
}

// Initialize with default fonts
export async function initializeFonts(): Promise<boolean> {
  try {
    console.log('PDFMake will use default Roboto fonts');
    return true;
  } catch (error) {
    console.error('Font initialization failed:', error);
    return true; // Always return true since we're using defaults
  }
}
