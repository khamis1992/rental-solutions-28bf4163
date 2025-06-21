
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  waitForFontsReady, 
  getBestArabicFont, 
  isFontAvailable,
  preloadFonts,
  areFontsReady 
} from './font-loader';

interface PDFGenerationOptions {
  filename?: string;
  preferArabic?: boolean;
  timeout?: number;
}

// Safe PDF generation with font loading
export async function generatePDFSafely(
  documentDefinition: any,
  options: PDFGenerationOptions = {}
): Promise<void> {
  const {
    filename = 'document.pdf',
    preferArabic = false,
    timeout = 15000
  } = options;

  try {
    console.log('Starting PDF generation with comprehensive font check...');
    
    // First check if fonts are already ready
    if (!areFontsReady()) {
      console.log('Fonts not ready, waiting for font loading...');
      
      // Wait for fonts to be loaded
      const availableFont = await waitForFontsReady(timeout);
      console.log(`Fonts loaded, using font: ${availableFont}`);
    } else {
      console.log('Fonts already ready for PDF generation');
    }

    // Get the best available font
    const selectedFont = getBestArabicFont();
    console.log(`Selected font for PDF: ${selectedFont}`);

    // Update document definition with available font
    const safeDocumentDefinition = {
      ...documentDefinition,
      defaultStyle: {
        font: selectedFont,
        ...documentDefinition.defaultStyle
      }
    };

    // If document specifically requests Arabic font but it's not available, show warning
    if (preferArabic && !isFontAvailable('Amiri')) {
      console.warn('Arabic font requested but not available, using fallback font');
    }

    // Generate and download PDF
    console.log('Creating PDF document...');
    const pdfDocGenerator = pdfMake.createPdf(safeDocumentDefinition);
    
    pdfDocGenerator.download(filename);
    console.log(`PDF generated successfully: ${filename}`);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    
    // Enhanced fallback: try with minimal Roboto configuration
    try {
      console.log('Attempting PDF generation with minimal Roboto fallback...');
      
      // Ensure basic pdfMake configuration
      if (!(pdfMake as any).fonts || !pdfMake.fonts.Roboto) {
        pdfMake.fonts = {
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf'
          }
        };
      }
      
      const fallbackDefinition = {
        ...documentDefinition,
        defaultStyle: {
          font: 'Roboto',
          fontSize: 10,
          ...documentDefinition.defaultStyle
        }
      };
      
      const pdfDocGenerator = pdfMake.createPdf(fallbackDefinition);
      pdfDocGenerator.download(filename);
      console.log('PDF generated with minimal fallback configuration');
      
    } catch (fallbackError) {
      console.error('Even fallback PDF generation failed:', fallbackError);
      throw new Error(`PDF generation failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    }
  }
}

// Initialize PDF system (call this early in app lifecycle)
export async function initializePDFSystem(): Promise<void> {
  try {
    console.log('Initializing PDF system with enhanced font loading...');
    await preloadFonts();
    console.log('PDF system initialized successfully');
  } catch (error) {
    console.warn('PDF system initialization had issues, but will continue:', error);
  }
}

// Check if PDF system is ready
export function isPDFSystemReady(): boolean {
  const fontsReady = areFontsReady();
  const hasAmiri = isFontAvailable('Amiri');
  const hasRoboto = isFontAvailable('Roboto') || true; // Roboto is always available as fallback
  
  console.log('PDF System Status:', {
    fontsReady,
    hasAmiri,
    hasRoboto,
    overall: fontsReady && (hasAmiri || hasRoboto)
  });
  
  return fontsReady && (hasAmiri || hasRoboto);
}

// Get PDF system status for debugging
export function getPDFSystemStatus(): {
  ready: boolean;
  fontsReady: boolean;
  availableFonts: string[];
  selectedFont: string;
} {
  return {
    ready: isPDFSystemReady(),
    fontsReady: areFontsReady(),
    availableFonts: [
      ...(isFontAvailable('Amiri') ? ['Amiri'] : []),
      'Roboto'
    ],
    selectedFont: getBestArabicFont()
  };
}

export default {
  generatePDFSafely,
  initializePDFSystem,
  isPDFSystemReady,
  getPDFSystemStatus
};
