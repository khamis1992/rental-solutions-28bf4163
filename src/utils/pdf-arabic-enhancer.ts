
/**
 * PDF Arabic text enhancement utilities
 * Provides fallback mechanisms and enhanced Arabic support for pdfMake
 */

import { processArabicText, hasArabicCharacters } from './arabic-text-processor';

/**
 * Enhanced pdfMake configuration for Arabic text support
 */
export function getArabicPdfConfig() {
  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 80],
    defaultStyle: {
      font: 'Amiri',
      fontSize: 12,
      direction: 'rtl'
    },
    styles: {
      arabicText: {
        font: 'Amiri',
        alignment: 'right',
        direction: 'rtl'
      },
      arabicHeader: {
        font: 'Amiri',
        fontSize: 16,
        bold: true,
        alignment: 'right',
        direction: 'rtl'
      },
      arabicTableHeader: {
        font: 'Amiri',
        fontSize: 11,
        bold: true,
        alignment: 'center',
        direction: 'rtl',
        fillColor: '#f1f5f9'
      },
      arabicTableCell: {
        font: 'Amiri',
        fontSize: 10,
        alignment: 'center',
        direction: 'rtl'
      },
      mixedContent: {
        font: 'Amiri',
        fontSize: 12,
        alignment: 'justify'
      }
    }
  };
}

/**
 * Enhanced table creation with proper Arabic text handling
 */
export function createArabicTable(headers: string[], rows: string[][], options: any = {}) {
  const processedHeaders = headers.map(header => ({
    text: processArabicText(header),
    style: 'arabicTableHeader'
  }));

  const processedRows = rows.map(row => 
    row.map(cell => ({
      text: processArabicText(cell),
      style: 'arabicTableCell',
      alignment: hasArabicCharacters(cell) ? 'right' : 'center'
    }))
  );

  return {
    table: {
      headerRows: 1,
      widths: options.widths || new Array(headers.length).fill('*'),
      body: [processedHeaders, ...processedRows]
    },
    layout: options.layout || 'lightHorizontalLines',
    margin: options.margin || [0, 0, 0, 20]
  };
}

/**
 * Creates a bilingual text block (Arabic/English)
 */
export function createBilingualText(arabicText: string, englishText?: string) {
  const content = [];
  
  if (arabicText) {
    content.push({
      text: processArabicText(arabicText),
      style: 'arabicText'
    });
  }
  
  if (englishText && englishText !== arabicText) {
    content.push('\n');
    content.push({
      text: englishText,
      style: 'englishText',
      alignment: 'left'
    });
  }
  
  return content;
}

/**
 * Enhanced header creation with company information
 */
export function createArabicHeader(companyInfo: any) {
  return {
    margin: [40, 20, 40, 0],
    table: {
      widths: ['*', 'auto'],
      body: [[
        {
          stack: [
            {
              text: processArabicText('شركة العرف لتأجير السيارات ذ.م.م'),
              style: 'arabicHeader',
              color: '#1e40af'
            },
            {
              text: processArabicText('سجل تجاري: 146832'),
              style: 'arabicText',
              fontSize: 10,
              color: '#64748b'
            }
          ],
          alignment: 'right'
        },
        {
          text: '🏢',
          fontSize: 24,
          color: '#1e40af',
          alignment: 'left'
        }
      ]]
    },
    layout: 'noBorders'
  };
}

/**
 * Enhanced footer creation with proper Arabic text
 */
export function createArabicFooter(currentPage: number, pageCount: number) {
  const currentDate = new Date().toLocaleDateString('ar-QA');
  
  return {
    margin: [40, 10, 40, 20],
    table: {
      widths: ['*', 'auto', '*'],
      body: [[
        {
          text: processArabicText('سري - شركة العرف لتأجير السيارات'),
          style: 'arabicText',
          fontSize: 8,
          color: '#64748b',
          alignment: 'right'
        },
        {
          text: processArabicText(`صفحة ${currentPage} من ${pageCount}`),
          style: 'arabicText',
          fontSize: 8,
          color: '#64748b',
          alignment: 'center'
        },
        {
          text: processArabicText(`تم إنشاؤه في: ${currentDate}`),
          style: 'arabicText',
          fontSize: 8,
          color: '#64748b',
          alignment: 'left'
        }
      ]]
    },
    layout: 'noBorders'
  };
}

/**
 * Font fallback mechanism
 */
export function setupArabicFonts(pdfMake: any) {
  try {
    // Primary: Amiri font (ideal for Arabic)
    pdfMake.fonts = {
      Amiri: {
        normal: '/Amiri-Regular.ttf',
        bold: '/Amiri-Bold.ttf',
        italics: '/Amiri-Regular.ttf',
        bolditalics: '/Amiri-Bold.ttf',
      }
    };
    
    console.log('✓ Arabic fonts (Amiri) loaded successfully');
    return true;
  } catch (error) {
    console.warn('⚠ Failed to load Amiri fonts, using system fallback');
    
    // Fallback: Use system fonts
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    
    return false;
  }
}
