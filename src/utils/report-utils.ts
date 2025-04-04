import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatDate } from '@/lib/date-utils';
import { translateText, batchTranslate } from '@/utils/translation-api';

/**
 * Generates a CSV string from an array of objects
 * @param data Array of objects to convert to CSV
 * @param isRTL Whether to format for RTL language
 * @returns CSV formatted string
 */
export const generateCSV = (data: Record<string, any>[], isRTL: boolean = false): string => {
  if (!data || data.length === 0) return '';
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      // Handle values that might contain commas or quotes
      const value = item[header] === null || item[header] === undefined ? '' : item[header];
      const valueStr = String(value);
      
      // Escape quotes and wrap in quotes if contains comma or quote
      if (valueStr.includes(',') || valueStr.includes('"')) {
        return `"${valueStr.replace(/"/g, '""')}"`;
      }
      return valueStr;
    });
    
    csv += row.join(',') + '\n';
  });
  
  // Add RTL mark if needed for Arabic CSV
  if (isRTL) {
    // Add RTL mark at the beginning of each line
    csv = csv.split('\n').map(line => '\u200F' + line).join('\n');
  }
  
  return csv;
};

/**
 * Downloads data as a CSV file
 * @param data Array of objects to download as CSV
 * @param filename Name for the downloaded file
 * @param isRTL Whether to use RTL formatting
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
 * @param isRTL Whether to use RTL formatting
 */
export const downloadExcel = (data: Record<string, any>[], filename: string, isRTL: boolean = false): void => {
  // For simplicity, we're using CSV with .xlsx extension
  // In a production app, you might want to use a library like xlsx for true Excel files
  downloadCSV(data, filename, isRTL);
};

/**
 * Translate report data keys and values
 * @param data Array of objects to translate
 * @param targetLang Target language code
 * @returns Promise resolving to translated data
 */
export const translateReportData = async (
  data: Record<string, any>[],
  targetLang: string
): Promise<Record<string, any>[]> => {
  if (!data || data.length === 0 || targetLang === 'en') {
    return data; // No translation needed
  }
  
  try {
    console.log(`Translating report data to ${targetLang} for ${data.length} records`);
    
    // First, extract all unique keys that need translation
    const allKeys = Object.keys(data[0]);
    
    // Translate all keys first (for headers)
    const keysToTranslate = allKeys.filter(key => 
      typeof key === 'string' && 
      !key.includes('id') && 
      !key.includes('date') && 
      !key.includes('amount') &&
      !key.includes('email')
    );
    
    console.log(`Translating ${keysToTranslate.length} header keys`);
    const translatedKeys = await batchTranslate(keysToTranslate, 'en', targetLang);
    
    // Create a mapping of original keys to translated keys
    const keyMap: Record<string, string> = {};
    keysToTranslate.forEach((key, index) => {
      keyMap[key] = translatedKeys[index];
    });
    
    // Now translate the string values in batches
    const translatedData: Record<string, any>[] = [];
    
    for (const item of data) {
      const translatedItem: Record<string, any> = {};
      
      // Copy non-string values directly
      for (const key of allKeys) {
        const value = item[key];
        if (typeof value !== 'string' || 
            key.includes('id') || 
            key.includes('date') || 
            key.includes('email') ||
            key.includes('amount') ||
            !value.trim()) {
          // Skip translation for non-strings, IDs, dates, and empty strings
          translatedItem[key] = value;
        } else {
          // Mark for translation
          translatedItem[key] = value;
        }
      }
      
      // Collect all string values that need translation
      const stringsToTranslate: string[] = [];
      const stringKeys: string[] = [];
      
      for (const key of allKeys) {
        const value = item[key];
        if (typeof value === 'string' && 
            value.trim() && 
            !key.includes('id') && 
            !key.includes('date') && 
            !key.includes('email') &&
            !key.includes('amount')) {
          stringsToTranslate.push(value);
          stringKeys.push(key);
        }
      }
      
      if (stringsToTranslate.length > 0) {
        try {
          const translatedStrings = await batchTranslate(stringsToTranslate, 'en', targetLang);
          
          // Update the item with translated strings
          stringKeys.forEach((key, index) => {
            translatedItem[key] = translatedStrings[index];
          });
        } catch (error) {
          console.error('Error translating report data values:', error);
          // In case of error, keep original strings
          stringKeys.forEach((key, index) => {
            translatedItem[key] = stringsToTranslate[index];
          });
        }
      }
      
      translatedData.push(translatedItem);
    }
    
    console.log('Report data translation completed');
    return translatedData;
  } catch (error) {
    console.error('Failed to translate report data:', error);
    return data; // Return original data in case of error
  }
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
 * @param isRTL Whether to use RTL formatting
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
          await safelyAddImage(doc, logoPath, isRTL ? pageWidth - 54 : 14, 10, 40, 15);
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
      doc.text('ALARAF CAR RENTAL', isRTL ? pageWidth - 14 : 14, 20, { align: isRTL ? 'right' : 'left' });
    }
    
    // Add a separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 30, pageWidth - 14, 30);
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 40, { align: 'center' });
    
    // Add date range with updated format
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fromDate = dateRange.from ? formatDate(dateRange.from) : '';
    const toDate = dateRange.to ? formatDate(dateRange.to) : '';
    doc.text(`Report Period: ${fromDate} - ${toDate}`, pageWidth / 2, 50, { align: 'center' });
    
    // Add date of generation with updated format
    doc.text(`Generated on: ${formatDate(new Date())}`, pageWidth / 2, 55, { align: 'center' });
    
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
 * @param isRTL Whether to use RTL formatting
 * @returns Promise that resolves when the footer is added
 */
export const addReportFooter = async (doc: jsPDF, isRTL: boolean = false): Promise<void> => {
  try {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add footer text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('© 2025 ALARAF CAR RENTAL', pageWidth / 2, pageHeight - 30, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Quality Service, Premium Experience', pageWidth / 2, pageHeight - 25, { align: 'center' });
    
    // Arabic text image paths - we'll try multiple locations
    const arabicTextPaths = [
      '/lovable-uploads/d6cc5f20-2b4e-4882-a50c-2377f75ff46d.png',
      '/assets/arabic-text.png',
      '/arabic-text.png'
    ];
    
    let arabicTextLoaded = false;
    
    // Try each Arabic text path until one works
    for (const arabicTextPath of arabicTextPaths) {
      if (await imageExists(arabicTextPath)) {
        try {
          // Position it on the right for LTR, on the left for RTL
          const xPosition = isRTL ? 10 : pageWidth - 80;
          await safelyAddImage(doc, arabicTextPath, xPosition, pageHeight - 30, 70, 15);
          arabicTextLoaded = true;
          console.log(`Successfully loaded Arabic text from: ${arabicTextPath}`);
          break;
        } catch (error) {
          console.error(`Error adding Arabic text from ${arabicTextPath}:`, error);
          // Continue to next path
        }
      }
    }
    
    // Add page bottom elements with correct spacing/positioning based on direction
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('CONFIDENTIAL', isRTL ? pageWidth - 14 : 14, pageHeight - 10, { align: isRTL ? 'right' : 'left' });
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(formatDate(new Date()), isRTL ? 14 : pageWidth - 14, pageHeight - 10, { align: isRTL ? 'left' : 'right' });
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
 * @returns Formatted currency string
 */
export const formatReportCurrency = (amount: number, currency = 'QAR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Generate a complete PDF report with standard header and footer
 * @param title Report title
 * @param dateRange Date range for the report 
 * @param contentGenerator Function that adds content to the document
 * @param language Language code (default: 'en')
 * @returns Promise resolving to PDF document
 */
export const generateStandardReport = async (
  title: string,
  dateRange: { from: Date | undefined; to: Date | undefined },
  contentGenerator: (doc: jsPDF, startY: number, isRTL: boolean) => number | Promise<number>,
  language: string = 'en'
): Promise<jsPDF> => {
  try {
    console.log(`Starting report generation process in language: ${language}`);
    
    // Determine if we should use RTL layout
    const isRTL = language === 'ar';
    
    // Translate the title if needed
    let translatedTitle = title;
    if (isRTL) {
      try {
        translatedTitle = await translateText(title, 'en', 'ar');
        console.log(`Translated title: ${translatedTitle}`);
      } catch (error) {
        console.error('Error translating title:', error);
        // Keep original title on error
      }
    }
    
    // Initialize the PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      // Do not set direction here, we'll handle RTL manually to ensure proper component positioning
    });
    
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
