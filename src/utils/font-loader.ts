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

// Default Arabic fonts configuration with fallbacks
const getArabicFonts = (): FontDefinition => {
  // If we have the base64 data, use it
  if (AmiriRegularBase64 && AmiriBoldBase64) {
    return {
      Amiri: {
        normal: AmiriRegularBase64,
        bold: AmiriBoldBase64,
        italics: AmiriRegularBase64,
        bolditalics: AmiriBoldBase64
      }
    };
  }

  // Fallback to TTF files in public directory
  return {
    Amiri: {
      normal: '/Amiri-Regular.ttf',
      bold: '/Amiri-Bold.ttf',
      italics: '/Amiri-Regular.ttf',
      bolditalics: '/Amiri-Bold.ttf'
    }
  };
};

// Configure fonts with pdfMake
export async function configurePdfMakeFonts(): Promise<void> {
  try {
    if (!isBrowser) {
      // Server-side: just set basic configuration
      pdfMake.fonts = {
        Amiri: {
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

    // Get font configuration
    const fonts = getArabicFonts();

    // Configure pdfMake fonts
    if (pdfMake) {
      pdfMake.fonts = fonts;
      
      // Also set on window object if needed
      if ((window as any).pdfMake) {
        (window as any).pdfMake.fonts = fonts;
      }
    }

    fontsInitialized = true;
    console.log('Arabic fonts configured successfully');
  } catch (error) {
    console.warn('Font configuration failed, using fallback:', error);
    
    // Fallback configuration
    pdfMake.fonts = {
      Amiri: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
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

// Export font configuration
export const ARABIC_FONTS = getArabicFonts();

// Initialize fonts on module load if in browser
if (isBrowser) {
  // Don't block module loading, initialize in background
  setTimeout(() => {
    configurePdfMakeFonts().catch(console.warn);
  }, 100);
}

// Convert TTF file to base64 for pdfMake virtual file system
const loadTTFToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error(`Failed to load font from ${url}:`, error);
    throw error;
  }
};

// Load Amiri fonts into pdfMake virtual file system
export const loadAmiriFonts = async (): Promise<string> => {
  try {
    console.log('Loading Amiri fonts...');
    
    // تحديد مهلة زمنية للتحميل
    const loadWithTimeout = (url: string, timeout = 3000) => {
      return Promise.race([
        loadTTFToBase64(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout loading ${url}`)), timeout)
        )
      ]);
    };
    
    // Load both font files with timeout
    const [regularBase64, boldBase64] = await Promise.all([
      loadWithTimeout('/Amiri-Regular.ttf').catch(() => {
        console.warn('Failed to load Amiri-Regular.ttf, creating fallback');
        return 'fallback-regular';
      }),
      loadWithTimeout('/Amiri-Bold.ttf').catch(() => {
        console.warn('Failed to load Amiri-Bold.ttf, creating fallback');
        return 'fallback-bold';
      })
    ]);
    
    // إذا فشل تحميل أي من الملفات، استخدم Roboto
    if (regularBase64 === 'fallback-regular' || boldBase64 === 'fallback-bold') {
      console.log('Font files not available, using Roboto');
      return 'Roboto';
    }
    
    // Update pdfMake virtual file system
    (pdfMake as any).vfs = {
      ...(pdfMake as any).vfs,
      'Amiri-Regular.ttf': regularBase64 as string,
      'Amiri-Bold.ttf': boldBase64 as string
    };
    
    // Configure font definitions
    const fontDefinitions: FontDefinition = {
      Amiri: {
        normal: 'Amiri-Regular.ttf',
        bold: 'Amiri-Bold.ttf',
        italics: 'Amiri-Regular.ttf',
        bolditalics: 'Amiri-Bold.ttf'
      },
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    
    (pdfMake as any).fonts = fontDefinitions;
    
    console.log('Amiri fonts loaded successfully');
    return 'Amiri';
    
  } catch (error) {
    console.warn('Failed to load Amiri fonts, using Roboto fallback:', error);
    return 'Roboto';
  }
};

// Alternative method using preloaded fonts (if available from JS files)
export const loadAmiriFontsFromJS = (): string => {
  try {
    if (typeof window !== 'undefined') {
      // انتظار قصير للتأكد من تحميل الخطوط من ملفات JS
      setTimeout(() => {
        const amiriRegular = (window as any).AmiriRegular;
        const amiriBold = (window as any).AmiriBold;
        
        if (amiriRegular && amiriBold && amiriRegular !== null && amiriBold !== null) {
          console.log('Found Amiri fonts in window object');
          
          if (!(pdfMake as any).vfs) {
            (pdfMake as any).vfs = {};
          }
          
          (pdfMake as any).vfs = {
            ...(pdfMake as any).vfs,
            'Amiri-Regular.ttf': amiriRegular,
            'Amiri-Bold.ttf': amiriBold
          };
          
          (pdfMake as any).fonts = {
            Amiri: {
              normal: 'Amiri-Regular.ttf',
              bold: 'Amiri-Bold.ttf',
              italics: 'Amiri-Regular.ttf',
              bolditalics: 'Amiri-Bold.ttf'
            },
            Roboto: {
              normal: 'Roboto-Regular.ttf',
              bold: 'Roboto-Medium.ttf',
              italics: 'Roboto-Italic.ttf',
              bolditalics: 'Roboto-MediumItalic.ttf'
            }
          };
          
          console.log('Amiri fonts configured successfully from JS files');
        } else {
          console.log('Amiri fonts not available in window object, using Roboto');
        }
      }, 1000);
      
      // فحص فوري للخطوط المحملة مسبقاً
      const amiriRegular = (window as any).AmiriRegular;
      const amiriBold = (window as any).AmiriBold;
      
      if (amiriRegular && amiriBold && amiriRegular !== null && amiriBold !== null) {
        if (!(pdfMake as any).vfs) {
          (pdfMake as any).vfs = {};
        }
        
        (pdfMake as any).vfs = {
          ...(pdfMake as any).vfs,
          'Amiri-Regular.ttf': amiriRegular,
          'Amiri-Bold.ttf': amiriBold
        };
        
        (pdfMake as any).fonts = {
          Amiri: {
            normal: 'Amiri-Regular.ttf',
            bold: 'Amiri-Bold.ttf',
            italics: 'Amiri-Regular.ttf',
            bolditalics: 'Amiri-Bold.ttf'
          },
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf'
          }
        };
        
        console.log('Amiri fonts loaded from JS files (immediate)');
        return 'Amiri';
      }
    }
  } catch (error) {
    console.warn('Failed to load Amiri fonts from JS files:', error);
  }
  
  // Fallback to Roboto
  console.log('Using Roboto font as fallback');
  return 'Roboto';
};

// Initialize fonts with the best available method
export const initializeFonts = async (): Promise<string> => {
  try {
    // تجربة تحميل الخطوط من ملفات JS أولاً
    const jsFont = loadAmiriFontsFromJS();
    if (jsFont === 'Amiri') {
      // التحقق من أن الخطوط تم تحميلها فعلاً في vfs
      if ((pdfMake as any).vfs && (pdfMake as any).vfs['Amiri-Regular.ttf'] && (pdfMake as any).vfs['Amiri-Bold.ttf']) {
        console.log('Amiri fonts verified in vfs');
        return 'Amiri';
      }
    }
    
    // محاولة تحميل من ملفات TTF
    const ttfFont = await loadAmiriFonts();
    if (ttfFont === 'Amiri') {
      // التحقق مرة أخرى من وجود الخطوط في vfs
      if ((pdfMake as any).vfs && (pdfMake as any).vfs['Amiri-Regular.ttf'] && (pdfMake as any).vfs['Amiri-Bold.ttf']) {
        console.log('Amiri fonts verified in vfs from TTF');
        return 'Amiri';
      }
    }
    
    // إذا فشل كل شيء، استخدم Roboto
    console.warn('Failed to load Amiri fonts, configuring Roboto');
    configureRobotoFont();
    return 'Roboto';
    
  } catch (error) {
    console.error('Font initialization failed:', error);
    configureRobotoFont();
    return 'Roboto';
  }
};

// دالة لتكوين خط Roboto فقط
const configureRobotoFont = () => {
  if (!(pdfMake as any).vfs) {
    (pdfMake as any).vfs = {};
  }
  
  // تأكد من تكوين Roboto فقط
  (pdfMake as any).fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };
  
  console.log('Roboto font configured as fallback');
};

export default {
  loadAmiriFonts,
  loadAmiriFontsFromJS,
  initializeFonts
};
