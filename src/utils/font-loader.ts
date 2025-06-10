
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

// Updated font configuration for JavaScript font files
export const ARABIC_FONTS: FontMap = {
  Amiri: {
    normal: 'Amiri-normal.js',
    bold: 'Amiri-bold.js',
    italics: 'Amiri-normal.js',
    bolditalics: 'Amiri-bold.js',
  }
};

// Configure pdfMake with Arabic fonts using JavaScript files
export function configurePdfMakeFonts(fonts: FontMap = ARABIC_FONTS): void {
  try {
    // Set the fonts
    (pdfMake as any).fonts = fonts;
    
    // Initialize VFS if not present
    if (!(pdfMake as any).vfs) {
      (pdfMake as any).vfs = {};
    }
    
    console.log('PDF fonts configured successfully with JS files:', Object.keys(fonts));
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

// Enhanced font initialization with proper JavaScript font handling
export async function initializeFonts(): Promise<boolean> {
  try {
    // First configure the fonts
    configurePdfMakeFonts();
    
    // Try to load font files from public directory
    const fontFiles = [
      '/fonts/Amiri-normal.js',
      '/fonts/Amiri-bold.js'
    ];
    
    // Attempt to load fonts if they exist
    for (const fontFile of fontFiles) {
      try {
        const response = await fetch(fontFile);
        if (response.ok) {
          const fontData = await response.text();
          // Extract font name from file path
          const fontName = fontFile.split('/').pop() || '';
          if (!(pdfMake as any).vfs) {
            (pdfMake as any).vfs = {};
          }
          (pdfMake as any).vfs[fontName] = fontData;
          console.log(`Loaded font: ${fontName}`);
        }
      } catch (fontError) {
        console.warn(`Could not load font ${fontFile}:`, fontError);
      }
    }
    
    return checkFontAvailability();
  } catch (error) {
    console.error('Font initialization failed:', error);
    // Don't throw error, just return false to allow fallback
    return false;
  }
}
