
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  waitForFontsReady, 
  getBestArabicFont, 
  isFontAvailable,
  preloadFonts 
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
    timeout = 10000
  } = options;

  try {
    console.log('Starting PDF generation with font check...');
    
    // Ensure fonts are loaded before proceeding
    const availableFont = await waitForFontsReady(timeout);
    console.log(`Using font: ${availableFont}`);

    // Update document definition with available font
    const safeDocumentDefinition = {
      ...documentDefinition,
      defaultStyle: {
        font: availableFont,
        ...documentDefinition.defaultStyle
      }
    };

    // If document uses Arabic font but it's not available, replace it
    if (documentDefinition.defaultStyle?.font === 'Amiri' && !isFontAvailable('Amiri')) {
      console.warn('Amiri font requested but not available, using Roboto fallback');
      safeDocumentDefinition.defaultStyle.font = 'Roboto';
    }

    // Generate and download PDF
    const pdfDocGenerator = pdfMake.createPdf(safeDocumentDefinition);
    pdfDocGenerator.download(filename);
    
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('PDF generation failed:', error);
    
    // Fallback: try with Roboto font
    try {
      console.log('Attempting PDF generation with Roboto fallback...');
      const fallbackDefinition = {
        ...documentDefinition,
        defaultStyle: {
          font: 'Roboto',
          ...documentDefinition.defaultStyle
        }
      };
      
      const pdfDocGenerator = pdfMake.createPdf(fallbackDefinition);
      pdfDocGenerator.download(filename);
      console.log('PDF generated with fallback font');
    } catch (fallbackError) {
      console.error('Fallback PDF generation also failed:', fallbackError);
      throw new Error('PDF generation failed with both primary and fallback methods');
    }
  }
}

// Initialize PDF system (call this early in app lifecycle)
export async function initializePDFSystem(): Promise<void> {
  try {
    console.log('Initializing PDF system...');
    await preloadFonts();
    console.log('PDF system initialized successfully');
  } catch (error) {
    console.warn('PDF system initialization had issues, but will continue:', error);
  }
}

// Check if PDF system is ready
export function isPDFSystemReady(): boolean {
  return isFontAvailable('Amiri') || isFontAvailable('Roboto');
}

export default {
  generatePDFSafely,
  initializePDFSystem,
  isPDFSystemReady
};
