
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

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Base64 encoded fonts from the JavaScript files
let AmiriRegularBase64: string | null = null;
let AmiriBoldBase64: string | null = null;

// Function to load base64 font data from the JS files
async function loadFontData(): Promise<void> {
  if (!isBrowser) return;

  try {
    // Try to load the font data from global variables if available
    if ((window as any).AmiriRegular) {
      AmiriRegularBase64 = (window as any).AmiriRegular;
    }
    if ((window as any).AmiriBold) {
      AmiriBoldBase64 = (window as any).AmiriBold;
    }

    // If not available globally, try to load from scripts
    if (!AmiriRegularBase64 || !AmiriBoldBase64) {
      await loadFontScripts();
    }
  } catch (error) {
    console.warn('Failed to load font data:', error);
  }
}

// Load font scripts dynamically
async function loadFontScripts(): Promise<void> {
  if (!isBrowser) return;

  return new Promise((resolve, reject) => {
    let scriptsLoaded = 0;
    const totalScripts = 2;

    const onScriptLoad = () => {
      scriptsLoaded++;
      if (scriptsLoaded === totalScripts) {
        // Extract font data from global variables
        AmiriRegularBase64 = (window as any).AmiriRegular || null;
        AmiriBoldBase64 = (window as any).AmiriBold || null;
        resolve();
      }
    };

    const onScriptError = (error: any) => {
      console.warn('Font script load failed:', error);
      scriptsLoaded++;
      if (scriptsLoaded === totalScripts) {
        resolve(); // Continue even if some fonts fail
      }
    };

    // Load Amiri Regular
    const script1 = document.createElement('script');
    script1.src = '/Amiri-Regular.js';
    script1.onload = onScriptLoad;
    script1.onerror = onScriptError;
    document.head.appendChild(script1);

    // Load Amiri Bold
    const script2 = document.createElement('script');
    script2.src = '/Amiri-Bold.js';
    script2.onload = onScriptLoad;
    script2.onerror = onScriptError;
    document.head.appendChild(script2);
  });
}

// Initialize pdfMake virtual file system with fonts
function initializePdfMakeVFS(): void {
  if (!isBrowser) return;

  // Initialize vfs if it doesn't exist
  if (!(pdfMake as any).vfs) {
    (pdfMake as any).vfs = {};
  }

  // Add fonts to virtual file system if available
  if (AmiriRegularBase64 && AmiriBoldBase64) {
    (pdfMake as any).vfs['Amiri-Regular.ttf'] = AmiriRegularBase64;
    (pdfMake as any).vfs['Amiri-Bold.ttf'] = AmiriBoldBase64;
    console.log('Amiri fonts added to pdfMake virtual file system');
  } else {
    console.warn('Amiri fonts not available, using Roboto fallback');
  }
}

// Configure fonts with pdfMake
export async function configurePdfMakeFonts(): Promise<void> {
  try {
    if (!isBrowser) {
      // Server-side: just set basic configuration
      pdfMake.fonts = {
        Roboto: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };
      return;
    }

    // Load font data first
    await loadFontData();

    // Initialize virtual file system
    initializePdfMakeVFS();

    // Configure font definitions
    const fontDefinitions: FontDefinition = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };

    // Add Amiri if available in VFS
    if ((pdfMake as any).vfs && (pdfMake as any).vfs['Amiri-Regular.ttf'] && (pdfMake as any).vfs['Amiri-Bold.ttf']) {
      fontDefinitions.Amiri = {
        normal: 'Amiri-Regular.ttf',
        bold: 'Amiri-Bold.ttf',
        italics: 'Amiri-Regular.ttf',
        bolditalics: 'Amiri-Bold.ttf'
      };
      console.log('Amiri font configuration added');
    }

    // Set font definitions
    pdfMake.fonts = fontDefinitions;
    
    fontsInitialized = true;
    console.log('PDF fonts configured successfully');
  } catch (error) {
    console.warn('Font configuration failed, using fallback:', error);
    
    // Fallback configuration
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    
    fontsInitialized = true;
  }
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
  if ((pdfMake as any).vfs && (pdfMake as any).vfs['Amiri-Regular.ttf'] && (pdfMake as any).vfs['Amiri-Bold.ttf']) {
    return 'Amiri';
  }
  return 'Roboto';
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

// Initialize fonts on module load if in browser
if (isBrowser) {
  // Don't block module loading, initialize in background
  setTimeout(() => {
    configurePdfMakeFonts().catch(console.warn);
  }, 100);
}

export default {
  initializeFonts,
  configurePdfMakeFonts,
  initializeFontsStatus,
  areFontsReady,
  getAvailableFontName
};
