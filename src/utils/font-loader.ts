
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

// Font loading state management
let fontsInitialized = false;
let fontLoadingPromise: Promise<void> | null = null;
let availableFonts: Set<string> = new Set();

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Maximum retry attempts for font loading
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Sleep utility for retry mechanism
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to load font files directly as base64 with retry mechanism
async function loadFontAsBase64(url: string, retries = 0): Promise<string | null> {
  if (!isBrowser) return null;
  
  try {
    console.log(`Attempting to load font from ${url} (attempt ${retries + 1})`);
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Font file not found: ${url} (status: ${response.status})`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    console.log(`Successfully loaded font from ${url}`);
    return base64;
  } catch (error) {
    console.warn(`Failed to load font from ${url} (attempt ${retries + 1}):`, error);
    
    // Retry mechanism
    if (retries < MAX_RETRY_ATTEMPTS) {
      console.log(`Retrying font load in ${RETRY_DELAY}ms...`);
      await sleep(RETRY_DELAY);
      return loadFontAsBase64(url, retries + 1);
    }
    
    return null;
  }
}

// Load fonts with comprehensive fallback strategies
async function loadFontsWithFallback(): Promise<void> {
  if (!isBrowser) return;

  console.log('Starting font loading process...');

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

  // Strategy 2: If not available, try direct TTF loading with retry
  if (!amiriRegularBase64) {
    amiriRegularBase64 = await loadFontAsBase64('/Amiri-Regular.ttf');
  }

  if (!amiriBoldBase64) {
    amiriBoldBase64 = await loadFontAsBase64('/Amiri-Bold.ttf');
  }

  // Initialize pdfMake virtual file system
  if (!(pdfMake as any).vfs) {
    (pdfMake as any).vfs = {};
  }

  // Configure fonts based on what's available
  if (amiriRegularBase64 && amiriBoldBase64) {
    // Both fonts available
    (pdfMake as any).vfs['Amiri-Regular.ttf'] = amiriRegularBase64;
    (pdfMake as any).vfs['Amiri-Bold.ttf'] = amiriBoldBase64;
    availableFonts.add('Amiri');
    
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
    console.log('Successfully configured Amiri fonts (regular + bold)');
  } else if (amiriRegularBase64) {
    // Only regular font available
    (pdfMake as any).vfs['Amiri-Regular.ttf'] = amiriRegularBase64;
    availableFonts.add('Amiri');
    
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
    console.log('Successfully configured Amiri fonts (regular only)');
  } else {
    // No Amiri fonts available, use Roboto fallback
    console.warn('Could not load any Amiri fonts, using Roboto fallback');
    availableFonts.add('Roboto');
    
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
  console.log('Font loading process completed');
}

// Configure pdfMake fonts with proper error handling
export async function configurePdfMakeFonts(): Promise<void> {
  if (fontLoadingPromise) {
    // If already loading, wait for the existing promise
    console.log('Font loading already in progress, waiting...');
    return fontLoadingPromise;
  }

  if (fontsInitialized) {
    // Already initialized
    console.log('Fonts already initialized');
    return Promise.resolve();
  }

  console.log('Starting font configuration...');

  // Create the loading promise
  fontLoadingPromise = loadFontsWithFallback().catch(error => {
    console.error('Font loading failed with error:', error);
    
    // Fallback configuration on critical error
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
    
    availableFonts.clear();
    availableFonts.add('Roboto');
    fontsInitialized = true;
    console.log('Applied fallback font configuration');
  });

  return fontLoadingPromise;
}

// Check if a specific font is available
export function isFontAvailable(fontName: string): boolean {
  return availableFonts.has(fontName);
}

// Get the best available font for Arabic text
export function getBestArabicFont(): string {
  if (isFontAvailable('Amiri')) {
    return 'Amiri';
  }
  return 'Roboto';
}

// Get available font name for PDF generation with language preference
export function getAvailableFontName(preferArabic: boolean = false): string {
  if (preferArabic && isFontAvailable('Amiri')) {
    return 'Amiri';
  }
  if (isFontAvailable('Amiri')) {
    return 'Amiri';
  }
  return 'Roboto';
}

// Wait for fonts to be ready before proceeding
export async function waitForFontsReady(timeout: number = 10000): Promise<string> {
  const startTime = Date.now();
  
  while (!fontsInitialized && (Date.now() - startTime) < timeout) {
    if (!fontLoadingPromise) {
      await configurePdfMakeFonts();
    } else {
      await fontLoadingPromise;
    }
    
    if (!fontsInitialized) {
      await sleep(100); // Wait a bit before checking again
    }
  }
  
  if (!fontsInitialized) {
    console.warn('Font loading timed out, using fallback');
    return 'Roboto';
  }
  
  return getBestArabicFont();
}

// Initialize fonts with comprehensive error handling
export const initializeFonts = async (): Promise<string> => {
  try {
    console.log('Initializing fonts...');
    await configurePdfMakeFonts();
    const fontName = getBestArabicFont();
    console.log(`Fonts initialized successfully, using: ${fontName}`);
    return fontName;
  } catch (error) {
    console.error('Font initialization failed:', error);
    return 'Roboto';
  }
};

// Check if fonts are ready
export function areFontsReady(): boolean {
  return fontsInitialized;
}

// Get font loading status
export function getFontLoadingStatus(): {
  initialized: boolean;
  availableFonts: string[];
  loading: boolean;
} {
  return {
    initialized: fontsInitialized,
    availableFonts: Array.from(availableFonts),
    loading: fontLoadingPromise !== null && !fontsInitialized
  };
}

// Reset fonts for testing
export function resetFonts(): void {
  fontsInitialized = false;
  fontLoadingPromise = null;
  availableFonts.clear();
  console.log('Font state reset');
}

// Preload fonts early (can be called from main app)
export async function preloadFonts(): Promise<void> {
  if (!fontsInitialized && !fontLoadingPromise) {
    console.log('Preloading fonts...');
    await configurePdfMakeFonts();
  }
}

export default {
  initializeFonts,
  configurePdfMakeFonts,
  areFontsReady,
  isFontAvailable,
  getBestArabicFont,
  getAvailableFontName,
  waitForFontsReady,
  getFontLoadingStatus,
  resetFonts,
  preloadFonts
};
