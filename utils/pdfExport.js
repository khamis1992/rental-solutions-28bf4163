/**
 * PDF Export utility with Arabic language support
 */
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize pdfmake with virtual file system for fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Register custom fonts that support Arabic characters
// You'll need to include these font files in your project
const addArabicFontSupport = () => {
  pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    },
    // Add an Arabic font like Amiri, Scheherazade, or Noto Naskh Arabic
    Amiri: {
      normal: 'Amiri-Regular.ttf',
      bold: 'Amiri-Bold.ttf',
      italics: 'Amiri-Italic.ttf',
      bolditalics: 'Amiri-BoldItalic.ttf'
    }
  };
};

/**
 * Export content with Arabic text to PDF
 * @param {Object} content - The content to be exported
 * @param {String} filename - Filename for the PDF
 */
export const exportToPdfWithArabic = (content, filename) => {
  addArabicFontSupport();
  
  const docDefinition = {
    content: content,
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

  // Create and download the PDF
  pdfMake.createPdf(docDefinition).download(filename);
};

/**
 * Create text content with proper RTL support
 * @param {String} text - The text content
 * @param {Object} style - Additional styling (optional)
 */
export const createArabicText = (text, style = {}) => {
  return {
    text: text,
    font: 'Amiri',
    direction: 'rtl',
    ...style
  };
};

export default {
  exportToPdfWithArabic,
  createArabicText
};
