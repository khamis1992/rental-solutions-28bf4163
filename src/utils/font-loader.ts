
import pdfMake from 'pdfmake/build/pdfmake';

interface FontConfig {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
}

interface FontDefinition {
  [fontName: string]: FontConfig;
}

// Flag to track initialization
let fontsInitialized = false;
let fontLoadingPromise: Promise<void> | null = null;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Function to load font files directly as base64
async function loadFontAsBase64(url: string): Promise<string | null> {
  if (!isBrowser) return null;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Font file not found: ${url}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.warn(`Failed to load font from ${url}:`, error);
    return null;
  }
}

// Load fonts with multiple fallback strategies
async function loadFontsWithFallback(): Promise<void> {
  if (!isBrowser) return;

  let amiriRegularBase64: string | null = null;
  let amiriBoldBase64: string | null = null;

  // Strategy 1: Try to load from global variables (from JS files)
  if ((window as any).AmiriRegular) {
    amiriRegularBase64 = (window as any).AmiriRegular;
    console.log('Loaded Amiri Regular from global variable');
  }
  
  if ((window as any).AmiriBold) {
    amiriBoldBase64 = (window as any).AmiriBold;
    console.log('Loaded Amiri Bold from global variable');
  }

  // Strategy 2: If not available, try direct TTF loading
  if (!amiriRegularBase64) {
    amiriRegularBase64 = await loadFontAsBase64('/Amiri-Regular.ttf');
    if (amiriRegularBase64) {
      console.log('Loaded Amiri Regular directly from TTF');
    }
  }

  if (!amiriBoldBase64) {
    amiriBoldBase64 = await loadFontAsBase64('/Amiri-Bold.ttf');
    if (amiriBoldBase64) {
      console.log('Loaded Amiri Bold directly from TTF');
    }
  }

  // Initialize pdfMake virtual file system
  if (!(pdfMake as any).vfs) {
    (pdfMake as any).vfs = {};
  }

  // Add fonts to virtual file system if available, otherwise use fallback
  if (amiriRegularBase64 && amiriBoldBase64) {
    (pdfMake as any).vfs['Amiri-Regular.ttf'] = amiriRegularBase64;
    (pdfMake as any).vfs['Amiri-Bold.ttf'] = amiriBoldBase64;
    console.log('Added Amiri fonts to pdfMake virtual file system');
    
    // Configure font definitions with Amiri
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      },
      Amiri: {
        normal: 'Amiri-Regular.ttf',
        bold: 'Amiri-Bold.ttf',
        italics: 'Amiri-Regular.ttf',
        bolditalics: 'Amiri-Bold.ttf'
      }
    };
  } else if (amiriRegularBase64) {
    // If only regular font is available, use it for both normal and bold
    (pdfMake as any).vfs['Amiri-Regular.ttf'] = amiriRegularBase64;
    console.log('Using Amiri Regular for both normal and bold text');
    
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      },
      Amiri: {
        normal: 'Amiri-Regular.ttf',
        bold: 'Amiri-Regular.ttf', // Use regular for bold as fallback
        italics: 'Amiri-Regular.ttf',
        bolditalics: 'Amiri-Regular.ttf'
      }
    };
  } else {
    console.warn('Could not load Amiri fonts, using Roboto fallback');
    
    // Fallback to Roboto only
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
  }

  fontsInitialized = true;
}

// Configure pdfMake fonts with proper error handling
export async function configurePdfMakeFonts(): Promise<void> {
  if (fontLoadingPromise) {
    // If already loading, wait for the existing promise
    return fontLoadingPromise;
  }

  if (fontsInitialized) {
    // Already initialized
    return Promise.resolve();
  }

  // Create the loading promise
  fontLoadingPromise = loadFontsWithFallback().catch(error => {
    console.error('Font loading failed:', error);
    
    // Fallback configuration on error
    if (!(pdfMake as any).vfs) {
      (pdfMake as any).vfs = {};
    }
    
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    
    fontsInitialized = true;
  });

  return fontLoadingPromise;
}

// Initialize fonts and return success status
export async function initializeFontsStatus(): Promise<boolean> {
  try {
    await configurePdfMakeFonts();
    return true;
  } catch (error) {
    console.warn('Font initialization failed:', error);
    return false;
  }
}

// Check if fonts are initialized
export function areFontsReady(): boolean {
  return fontsInitialized;
}

// Get available font name for PDF generation
export function getAvailableFontName(): string {
  if ((pdfMake as any).vfs && (pdfMake as any).vfs['Amiri-Regular.ttf']) {
    return 'Amiri';
  }
  return 'Roboto';
}

// Wait for fonts to be ready before proceeding
export async function waitForFontsReady(): Promise<string> {
  await configurePdfMakeFonts();
  return getAvailableFontName();
}

// Initialize fonts with the best available method
export const initializeFonts = async (): Promise<string> => {
  try {
    await configurePdfMakeFonts();
    return getAvailableFontName();
  } catch (error) {
    console.error('Font initialization failed:', error);
    return 'Roboto';
  }
};

// Reset fonts for testing
export function resetFonts(): void {
  fontsInitialized = false;
  fontLoadingPromise = null;
}

export default {
  initializeFonts,
  configurePdfMakeFonts,
  initializeFontsStatus,
  areFontsReady,
  getAvailableFontName,
  waitForFontsReady,
  resetFonts
};
