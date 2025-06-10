
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

// Updated font configuration to use correct .ttf names that match the JavaScript font files
export const ARABIC_FONTS: FontMap = {
  Amiri: {
    normal: 'Amiri-Regular.ttf',
    bold: 'Amiri-Bold.ttf',
    italics: 'Amiri-Regular.ttf', // Use regular for italics as fallback
    bolditalics: 'Amiri-Bold.ttf', // Use bold for bold italics as fallback
  }
};

// Configure pdfMake with Arabic fonts using the correct font names
export function configurePdfMakeFonts(fonts: FontMap = ARABIC_FONTS): void {
  try {
    // Set the fonts - the JavaScript files have already populated pdfMake.vfs
    (pdfMake as any).fonts = fonts;
    
    console.log('PDF fonts configured successfully:', Object.keys(fonts));
    console.log('Available fonts in VFS:', Object.keys((pdfMake as any).vfs || {}));
  } catch (error) {
    console.error('Error configuring PDF fonts:', error);
    throw new Error('Failed to configure PDF fonts');
  }
}

// Check if fonts are loaded and available
export function checkFontAvailability(): boolean {
  try {
    const hasVfs = !!(pdfMake as any).vfs;
    const hasAmiriRegular = hasVfs && (pdfMake as any).vfs['Amiri-Regular.ttf'];
    const hasAmiriBold = hasVfs && (pdfMake as any).vfs['Amiri-Bold.ttf'];
    const hasFontsConfig = !!(pdfMake as any).fonts && Object.keys((pdfMake as any).fonts).length > 0;
    
    console.log('Font availability check:', {
      hasVfs,
      hasAmiriRegular,
      hasAmiriBold,
      hasFontsConfig
    });
    
    return hasVfs && hasAmiriRegular && hasAmiriBold && hasFontsConfig;
  } catch (error) {
    console.error('Error checking font availability:', error);
    return false;
  }
}

// Simplified font initialization - no manual loading needed since JS files handle it
export async function initializeFonts(): Promise<boolean> {
  try {
    // Just configure the fonts - the JavaScript files have already loaded the font data
    configurePdfMakeFonts();
    
    // Check if fonts are available
    const available = checkFontAvailability();
    
    if (available) {
      console.log('Fonts initialized successfully');
    } else {
      console.warn('Font initialization completed but fonts may not be fully available');
    }
    
    return available;
  } catch (error) {
    console.error('Font initialization failed:', error);
    return false;
  }
}
