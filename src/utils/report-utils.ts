
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatDate } from '@/lib/date-utils';

/**
 * Generates a CSV string from an array of objects
 * @param data Array of objects to convert to CSV
 * @returns CSV formatted string
 */
export const generateCSV = (data: Record<string, any>[]): string => {
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
  
  return csv;
};

/**
 * Downloads data as a CSV file
 * @param data Array of objects to download as CSV
 * @param filename Name for the downloaded file
 */
export const downloadCSV = (data: Record<string, any>[], filename: string): void => {
  const csv = generateCSV(data);
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
 */
export const downloadExcel = (data: Record<string, any>[], filename: string): void => {
  // For simplicity, we're using CSV with .xlsx extension
  // In a production app, you might want to use a library like xlsx for true Excel files
  downloadCSV(data, filename);
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
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        doc.addImage(img, 'PNG', x, y, width, height);
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
 * Generates a PDF report header with company logo
 * @param doc jsPDF document instance
 * @param title Report title
 * @param dateRange Date range for the report
 * @returns Promise resolving to Y position after adding header elements
 */
export const addReportHeader = async (
  doc: jsPDF, 
  title: string, 
  dateRange: { from: Date | undefined; to: Date | undefined }
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Company logo path - could be made configurable in the future
  const logoPath = '/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png';
  
  // Check if logo exists
  const logoExists = await imageExists(logoPath);
  
  // Add company logo if it exists
  if (logoExists) {
    try {
      await safelyAddImage(doc, logoPath, 14, 10, 40, 15);
    } catch (error) {
      console.error('Error adding company logo:', error);
      // Continue without logo
    }
  } else {
    // Fallback - add company name as text instead of logo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ALARAF CAR RENTAL', 14, 20);
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
};

/**
 * Adds footer to PDF report
 * @param doc jsPDF document instance
 * @returns Promise that resolves when the footer is added
 */
export const addReportFooter = async (doc: jsPDF): Promise<void> => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add footer text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('© 2025 ALARAF CAR RENTAL', pageWidth / 2, pageHeight - 30, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Quality Service, Premium Experience', pageWidth / 2, pageHeight - 25, { align: 'center' });
  
  // Arabic text image path - could be made configurable in the future
  const arabicTextPath = '/lovable-uploads/d6cc5f20-2b4e-4882-a50c-2377f75ff46d.png';
  
  // Check if Arabic text image exists
  const arabicTextExists = await imageExists(arabicTextPath);
  
  // Add Arabic text image if it exists
  if (arabicTextExists) {
    try {
      await safelyAddImage(doc, arabicTextPath, pageWidth - 80, pageHeight - 30, 70, 15);
    } catch (error) {
      console.error('Error adding Arabic text image:', error);
      // Continue without the image
    }
  }
  
  // Add page bottom elements with correct spacing/positioning
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CONFIDENTIAL', 14, pageHeight - 10);
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text(formatDate(new Date()), pageWidth - 14, pageHeight - 10, { align: 'right' });
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
 * @returns Promise resolving to PDF document
 */
export const generateStandardReport = async (
  title: string,
  dateRange: { from: Date | undefined; to: Date | undefined },
  contentGenerator: (doc: jsPDF, startY: number) => number | Promise<number>
): Promise<jsPDF> => {
  try {
    // Initialize the PDF document
    const doc = new jsPDF();
    
    // Add header and get the Y position to start content
    const startY = await addReportHeader(doc, title, dateRange);
    
    // Add content using the provided generator function
    await contentGenerator(doc, startY);
    
    // Apply footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      await addReportFooter(doc);
    }
    
    return doc;
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate report: ' + (error instanceof Error ? error.message : String(error)));
  }
};
