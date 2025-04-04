
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatDate } from '@/lib/date-utils';
import { useTranslation } from '@/contexts/TranslationContext';
import i18n from '@/i18n';
import { translateText } from '@/utils/translation-api';

/**
 * Generates a CSV string from an array of objects
 * @param data Array of objects to convert to CSV
 * @param isRTL Whether the output should be RTL formatted
 * @returns CSV formatted string
 */
export const generateCSV = (data: Record<string, any>[], isRTL: boolean = false): string => {
  if (!data || data.length === 0) return '';
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row - add RTL mark for Arabic if needed
  const rtlMark = isRTL ? '\u200F' : '';
  let csv = headers.map(header => `${rtlMark}${header}`).join(',') + '\n';
  
  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      // Handle values that might contain commas or quotes
      const value = item[header] === null || item[header] === undefined ? '' : item[header];
      let valueStr = String(value);
      
      // Add RTL mark for text content in Arabic
      if (isRTL && typeof value === 'string' && value.trim() !== '') {
        valueStr = rtlMark + valueStr;
      }
      
      // Escape quotes and wrap in quotes if contains comma or quote
      if (valueStr.includes(',') || valueStr.includes('"')) {
        return `"${valueStr.replace(/"/g, '""')}"`;
      }
      return valueStr;
    });
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
};

/**
 * Downloads data as a CSV file
 * @param data Array of objects to download as CSV
 * @param filename Name for the downloaded file
 * @param isRTL Whether the output should be RTL formatted
 */
export const downloadCSV = (data: Record<string, any>[], filename: string, isRTL: boolean = false): void => {
  const csv = generateCSV(data, isRTL);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Formats data for Excel download (uses CSV for simplicity)
 * @param data Array of objects to download as Excel
 * @param filename Name for the downloaded file
 * @param isRTL Whether the output should be RTL formatted
 */
export const downloadExcel = (data: Record<string, any>[], filename: string, isRTL: boolean = false): void => {
  // For simplicity, we're using CSV with .xlsx extension
  // In a production app, you might want to use a library like xlsx for true Excel files
  downloadCSV(data, filename, isRTL);
};

/**
 * Check if an image exists and can be loaded
 * @param imagePath Path to the image
 * @returns Promise that resolves to true if image exists, false otherwise
 */
const imageExists = (imagePath: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imagePath;
  });
};

/**
 * Safely loads an image into a PDF document with error handling
 * @param doc jsPDF document instance
 * @param imagePath Path to the image
 * @param x X position
 * @param y Y position
 * @param width Width of the image
 * @param height Height of the image
 * @returns Promise that resolves when image is loaded or rejects on error
 */
const safelyAddImage = (
  doc: jsPDF,
  imagePath: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> => {
  return new Promise((resolve) => {
    console.log(`Attempting to load image: ${imagePath}`);
    const img = new Image();
    
    img.onload = () => {
      try {
        doc.addImage(img, 'PNG', x, y, width, height);
        console.log(`Successfully added image: ${imagePath}`);
        resolve();
      } catch (error) {
        console.error(`Error adding image to PDF: ${imagePath}`, error);
        // Resolve anyway to continue with report generation
        resolve();
      }
    };
    
    img.onerror = () => {
      console.warn(`Image not found or unable to load: ${imagePath}`);
      // Resolve anyway to continue with report generation
      resolve();
    };
    
    img.src = imagePath;
  });
};

/**
 * Generates a PDF report header with company logo
 * @param doc jsPDF document instance
 * @param title Report title
 * @param dateRange Date range for the report
 * @param isRTL Whether the document should be RTL
 * @returns Promise resolving to Y position after adding header elements
 */
export const addReportHeader = async (
  doc: jsPDF, 
  title: string, 
  dateRange: { from: Date | undefined; to: Date | undefined },
  isRTL: boolean = false
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  try {
    // Set text alignment direction based on language
    const textAlign = isRTL ? 'right' : 'left';
    const centerX = pageWidth / 2;
    
    // Company logo paths - we'll try multiple locations in case paths change
    const logoPaths = [
      '/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png',
      '/assets/logo.png',
      '/logo.png'
    ];
    
    let logoLoaded = false;
    
    // Try each logo path until one works
    for (const logoPath of logoPaths) {
      if (await imageExists(logoPath)) {
        try {
          // Position logo based on text direction
          const logoX = isRTL ? pageWidth - 54 : 14;
          await safelyAddImage(doc, logoPath, logoX, 10, 40, 15);
          logoLoaded = true;
          console.log(`Successfully loaded logo from: ${logoPath}`);
          break;
        } catch (error) {
          console.error(`Error adding company logo from ${logoPath}:`, error);
          // Continue to next path
        }
      } else {
        console.log(`Logo not found at path: ${logoPath}`);
      }
    }
    
    // Fallback - if no logo could be loaded, add company name as text
    if (!logoLoaded) {
      console.log('Using text fallback for logo');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const companyName = isRTL ? 'تأجير سيارات العراف' : 'ALARAF CAR RENTAL';
      const companyNameX = isRTL ? pageWidth - 14 : 14;
      doc.text(companyName, companyNameX, 20, { align: textAlign });
    }
    
    // Add a separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 30, pageWidth - 14, 30);
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, centerX, 40, { align: 'center' });
    
    // Add date range with updated format
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Get the appropriate labels based on the language
    const reportPeriodLabel = isRTL ? 'فترة التقرير:' : 'Report Period:';
    const generatedOnLabel = isRTL ? 'تم الإنشاء في:' : 'Generated on:';
    
    const fromDate = dateRange.from ? formatDate(dateRange.from) : '';
    const toDate = dateRange.to ? formatDate(dateRange.to) : '';
    
    // If RTL, we need to restructure the date text
    const dateRangeText = isRTL
      ? `${reportPeriodLabel} ${toDate} - ${fromDate}`
      : `${reportPeriodLabel} ${fromDate} - ${toDate}`;
    
    doc.text(dateRangeText, centerX, 50, { align: 'center' });
    
    // Add date of generation with updated format
    const generationDate = formatDate(new Date());
    const generationText = `${generatedOnLabel} ${generationDate}`;
    doc.text(generationText, centerX, 55, { align: 'center' });
    
    return 65; // Return next Y position
  } catch (error) {
    console.error("Error in addReportHeader:", error);
    
    // Fallback simple header if something went wrong
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${formatDate(new Date())}`, pageWidth / 2, 30, { align: 'center' });
    
    return 40; // Return next Y position for fallback header
  }
};

/**
 * Adds footer to PDF report
 * @param doc jsPDF document instance
 * @param isRTL Whether the document should be RTL
 * @returns Promise that resolves when the footer is added
 */
export const addReportFooter = async (doc: jsPDF, isRTL: boolean = false): Promise<void> => {
  try {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add footer text with appropriate alignment
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const copyrightText = isRTL ? '© 2025 تأجير سيارات العراف' : '© 2025 ALARAF CAR RENTAL';
    doc.text(copyrightText, pageWidth / 2, pageHeight - 30, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const taglineText = isRTL ? 'خدمة عالية الجودة، تجربة متميزة' : 'Quality Service, Premium Experience';
    doc.text(taglineText, pageWidth / 2, pageHeight - 25, { align: 'center' });
    
    // Position for Arabic text image depends on language direction
    const arabicTextX = isRTL ? 10 : pageWidth - 80;
    
    // Arabic text image paths - we'll try multiple locations
    const arabicTextPaths = [
      '/lovable-uploads/d6cc5f20-2b4e-4882-a50c-2377f75ff46d.png',
      '/assets/arabic-text.png',
      '/arabic-text.png'
    ];
    
    let arabicTextLoaded = false;
    
    // Only try to load Arabic text image if not already in Arabic mode
    if (!isRTL) {
      // Try each Arabic text path until one works
      for (const arabicTextPath of arabicTextPaths) {
        if (await imageExists(arabicTextPath)) {
          try {
            await safelyAddImage(doc, arabicTextPath, arabicTextX, pageHeight - 30, 70, 15);
            arabicTextLoaded = true;
            console.log(`Successfully loaded Arabic text from: ${arabicTextPath}`);
            break;
          } catch (error) {
            console.error(`Error adding Arabic text from ${arabicTextPath}:`, error);
            // Continue to next path
          }
        }
      }
    }
    
    // Add page bottom elements with correct spacing/positioning
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    // Position confidential text based on language direction
    const confidentialText = isRTL ? 'سري' : 'CONFIDENTIAL';
    const confidentialX = isRTL ? pageWidth - 14 : 14;
    doc.text(confidentialText, confidentialX, pageHeight - 10, { align: isRTL ? 'right' : 'left' });
    
    // Page number always centered
    const pageText = isRTL ? `صفحة ${doc.getNumberOfPages()}` : `Page ${doc.getNumberOfPages()}`;
    doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Date position based on language direction
    const dateText = formatDate(new Date());
    const dateX = isRTL ? 14 : pageWidth - 14;
    doc.text(dateText, dateX, pageHeight - 10, { align: isRTL ? 'left' : 'right' });
  } catch (error) {
    console.error("Error in addReportFooter:", error);
    
    // Fallback simple footer if something went wrong
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
};

/**
 * Helper function to format currency (for consistency across reports)
 * @param amount Amount to format as currency
 * @param currency Currency code (default: QAR)
 * @param isRTL Whether to format in RTL style
 * @returns Formatted currency string
 */
export const formatReportCurrency = (amount: number, currency = 'QAR', isRTL: boolean = false): string => {
  if (isRTL) {
    // Use Arabic numeral system and RTL formatting
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Translates report content
 * @param content Text to translate
 * @param targetLang Target language code
 * @returns Promise with translated text
 */
export const translateReportContent = async (
  content: string,
  targetLang: string = 'ar'
): Promise<string> => {
  if (!content || content.trim() === '') return content;
  if (targetLang === 'en') return content; // No translation needed for English
  
  try {
    return await translateText(content, 'en', targetLang);
  } catch (error) {
    console.error('Error translating report content:', error);
    return content; // Return original content on error
  }
};

/**
 * Translates object properties
 * @param obj Object with properties to translate
 * @param targetLang Target language code
 * @returns Promise with object containing translated properties
 */
export const translateReportObject = async (
  obj: Record<string, any>,
  targetLang: string = 'ar'
): Promise<Record<string, any>> => {
  if (targetLang === 'en') return obj; // No translation needed for English
  
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      result[key] = await translateReportContent(obj[key], targetLang);
    } else {
      result[key] = obj[key];
    }
  }
  
  return result;
};

/**
 * Generate a complete PDF report with standard header and footer
 * @param title Report title
 * @param dateRange Date range for the report 
 * @param contentGenerator Function that adds content to the document
 * @param language Language for the report (default: 'en')
 * @returns Promise resolving to PDF document
 */
export const generateStandardReport = async (
  title: string,
  dateRange: { from: Date | undefined; to: Date | undefined },
  contentGenerator: (doc: jsPDF, startY: number, isRTL: boolean) => number | Promise<number>,
  language: string = 'en'
): Promise<jsPDF> => {
  try {
    console.log(`Starting report generation process in ${language}`);
    
    // Determine if we need RTL layout
    const isRTL = language === 'ar';
    
    // If needed, translate the title
    let translatedTitle = title;
    if (isRTL) {
      translatedTitle = await translateReportContent(title, 'ar');
      console.log(`Translated title: ${translatedTitle}`);
    }
    
    // Initialize the PDF document with appropriate settings
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16 // For better text positioning
    });
    
    // For RTL documents, we need special handling
    if (isRTL) {
      // Add Arabic font support (uses default available fonts in jsPDF)
      // In a production app, you'd want to use a proper Arabic font
      console.log('Setting up document for RTL support');
    }
    
    // Add header and get the Y position to start content
    console.log("Adding report header");
    const startY = await addReportHeader(doc, translatedTitle, dateRange, isRTL);
    
    // Add content using the provided generator function
    console.log("Adding report content");
    await contentGenerator(doc, startY, isRTL);
    
    // Apply footer to all pages
    console.log("Adding footer to all pages");
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      await addReportFooter(doc, isRTL);
    }
    
    console.log("Report generation completed successfully");
    return doc;
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate report: ' + (error instanceof Error ? error.message : String(error)));
  }
};
