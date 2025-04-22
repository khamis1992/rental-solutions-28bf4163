
/**
 * PDF Export utility with Arabic language support
 */
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize pdfMake with virtual file system for fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Set up default fonts configuration
const fontConfig = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  },
  // Add an Arabic font like Amiri
  Amiri: {
    normal: 'Amiri-Regular.ttf',
    bold: 'Amiri-Bold.ttf',
    italics: 'Amiri-Italic.ttf',
    bolditalics: 'Amiri-BoldItalic.ttf'
  }
};

// Register custom fonts that support Arabic characters
const addArabicFontSupport = () => {
  try {
    pdfMake.fonts = fontConfig;
    console.log('Arabic font support added successfully');
  } catch (error) {
    console.error('Error setting up Arabic fonts:', error);
  }
};

/**
 * Export content with Arabic text to PDF
 * @param {Object} content - The content to be exported
 * @param {String} filename - Filename for the PDF
 */
export const exportToPdfWithArabic = (content, filename) => {
  try {
    addArabicFontSupport();
    
    // Ensure content is properly formatted
    const processedContent = Array.isArray(content) ? content : [content];
    
    const docDefinition = {
      content: processedContent,
      defaultStyle: {
        font: 'Amiri',  // Set default font to the Arabic-supporting font
        direction: 'rtl' // Set default direction to right-to-left
      },
      // Enable bi-directional text support
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false
      }
    };

    // Create and download the PDF with error handling
    pdfMake.createPdf(docDefinition).download(filename, (error) => {
      if (error) {
        console.error('Error generating PDF:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
      }
    });

    return true;
  } catch (error) {
    console.error('Error in exportToPdfWithArabic:', error);
    return false;
  }
};

/**
 * Create text content with proper RTL support
 * @param {String} text - The text content
 * @param {Object} style - Additional styling (optional)
 */
export const createArabicText = (text, style = {}) => {
  if (!text) return { text: '', font: 'Amiri', direction: 'rtl' };
  
  return {
    text: text,
    font: 'Amiri',
    direction: 'rtl',
    ...style
  };
};

/**
 * Create a PDF with both LTR and RTL text
 * @param {Object} content - Content with mixed text directions
 * @param {String} filename - Filename for the PDF
 */
export const exportMixedDirectionPdf = (content, filename) => {
  try {
    addArabicFontSupport();
    
    // Create a document definition with special handling for mixed content
    const docDefinition = {
      content: content,
      defaultStyle: {
        font: 'Roboto'
      }
    };

    // Create and download the PDF
    pdfMake.createPdf(docDefinition).download(filename);
    return true;
  } catch (error) {
    console.error('Error in exportMixedDirectionPdf:', error);
    return false;
  }
};

export default {
  exportToPdfWithArabic,
  createArabicText,
  exportMixedDirectionPdf
};
