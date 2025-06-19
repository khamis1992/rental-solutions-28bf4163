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

// Flag to track initialization
let fontsInitialized = false;
let pdfMakeReady = false;

// Initialize pdfMake globally
function initializePdfMake() {
  if (typeof window !== 'undefined' && !pdfMakeReady) {
    (window as any).pdfMake = pdfMake;
    pdfMakeReady = true;
  }
}

// Dynamic font loading function
async function loadFontFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    // Ensure pdfMake is available globally
    initializePdfMake();

    // Check if file already loaded
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load font: ${url}`));
    document.head.appendChild(script);
  });
}

// Configure fonts with pdfMake
export async function configurePdfMakeFonts(fonts: FontMap = ARABIC_FONTS): Promise<void> {
  try {
    // Ensure pdfMake is initialized
    initializePdfMake();

    // For server-side rendering or if window is not available
    if (typeof window === 'undefined') {
      return;
    }

    // Load font files dynamically
    try {
      await Promise.all([
        loadFontFile('/Amiri-Regular.js'),
        loadFontFile('/Amiri-Bold.js')
      ]);
    } catch (error) {
      console.warn('Failed to load font files:', error);
      // Continue with fallback fonts
    }

    // Configure fonts with pdfMake
    if (pdfMake && pdfMake.fonts) {
      Object.assign(pdfMake.fonts, fonts);
    }

    // Set global fonts if available
    if ((window as any).pdfMake && (window as any).pdfMake.fonts) {
      Object.assign((window as any).pdfMake.fonts, fonts);
    }

    fontsInitialized = true;
  } catch (error) {
    console.warn('Font configuration failed:', error);
    throw error;
  }
}

// Initialize fonts and return success status
export async function initializeFonts(): Promise<boolean> {
  try {
    await configurePdfMakeFonts();
    return fontsInitialized;
  } catch (error) {
    console.warn('Font initialization failed:', error);
    return false;
  }
}

// Default Arabic fonts configuration
const ARABIC_FONTS: FontMap = {
  Amiri: {
    normal: 'Amiri-Regular.ttf',
    bold: 'Amiri-Bold.ttf',
    italics: 'Amiri-Regular.ttf',
    bolditalics: 'Amiri-Bold.ttf'
  },
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
};

// Set default font
pdfMake.fonts = ARABIC_FONTS;

// Export for external use
export { ARABIC_FONTS };
