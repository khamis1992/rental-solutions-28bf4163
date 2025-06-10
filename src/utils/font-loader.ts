
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

// Default pdfMake font configuration - matches what pdfMake expects
export const DEFAULT_FONTS: FontMap = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Bold.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-BoldItalic.ttf',
  }
};

// Load VFS fonts from the public directory
async function loadVfsFonts(): Promise<void> {
  try {
    // Check if VFS is already loaded
    if (pdfMake.vfs && Object.keys(pdfMake.vfs).length > 0) {
      console.log('VFS fonts already loaded');
      return;
    }

    // Load the VFS fonts script
    const script = document.createElement('script');
    script.src = '/vfs_fonts.js';
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        // Check if the VFS was loaded properly
        if (window.pdfMake && window.pdfMake.vfs) {
          pdfMake.vfs = window.pdfMake.vfs;
          console.log('VFS fonts loaded successfully');
          resolve();
        } else {
          console.warn('VFS fonts script loaded but no fonts found');
          resolve(); // Don't reject, continue with defaults
        }
      };
      
      script.onerror = () => {
        console.warn('Failed to load VFS fonts script, using defaults');
        resolve(); // Don't reject, continue with defaults
      };
      
      document.head.appendChild(script);
    });
  } catch (error) {
    console.warn('Error loading VFS fonts:', error);
    // Don't throw, continue with defaults
  }
}

// Configure pdfMake with default fonts
export function configurePdfMakeFonts(fonts: FontMap = DEFAULT_FONTS): void {
  try {
    // Set the fonts configuration
    pdfMake.fonts = fonts;
    console.log('PDF fonts configured:', Object.keys(fonts));
  } catch (error) {
    console.error('Error configuring PDF fonts:', error);
    throw new Error('Failed to configure PDF fonts');
  }
}

// Check if fonts are available in the VFS
export function checkFontAvailability(): boolean {
  try {
    // Check if VFS has the required Roboto fonts
    const requiredFonts = [
      'Roboto-Regular.ttf',
      'Roboto-Bold.ttf', 
      'Roboto-Italic.ttf',
      'Roboto-BoldItalic.ttf'
    ];
    
    if (!pdfMake.vfs) {
      console.log('No VFS available, using browser default fonts');
      return false;
    }
    
    const availableFonts = Object.keys(pdfMake.vfs);
    const hasFonts = requiredFonts.some(font => availableFonts.includes(font));
    
    console.log('Font availability check:', {
      required: requiredFonts,
      available: availableFonts,
      hasFonts
    });
    
    return hasFonts;
  } catch (error) {
    console.error('Error checking font availability:', error);
    return false;
  }
}

// Initialize fonts for PDF generation
export async function initializeFonts(): Promise<boolean> {
  try {
    console.log('Initializing PDF fonts...');
    
    // Load VFS fonts first
    await loadVfsFonts();
    
    // Configure pdfMake with default fonts
    configurePdfMakeFonts(DEFAULT_FONTS);
    
    // Check if fonts are available
    const fontsAvailable = checkFontAvailability();
    
    if (!fontsAvailable) {
      console.warn('VFS fonts not available, using browser defaults');
    }
    
    console.log('Font initialization completed');
    return true;
  } catch (error) {
    console.error('Font initialization failed:', error);
    // Even if initialization fails, configure with defaults to prevent errors
    try {
      configurePdfMakeFonts(DEFAULT_FONTS);
    } catch (configError) {
      console.error('Failed to configure default fonts:', configError);
    }
    return false;
  }
}

// Declare global types for the VFS
declare global {
  interface Window {
    pdfMake?: {
      vfs?: { [key: string]: string };
    };
  }
}
