
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';

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
 * Safely adds an image to the PDF, with error handling
 * @param doc PDF document
 * @param imgPath Image path
 * @param x X position
 * @param y Y position
 * @param w Width
 * @param h Height
 * @returns boolean indicating success
 */
const safelyAddImage = (doc: jsPDF, imgPath: string, x: number, y: number, w: number, h: number): boolean => {
  try {
    doc.addImage(imgPath, 'PNG', x, y, w, h);
    return true;
  } catch (error) {
    console.warn(`Failed to add image ${imgPath} to PDF:`, error);
    return false;
  }
};

/**
 * Generates a PDF report header with company logo
 * @param doc jsPDF document instance
 * @param title Report title
 * @param dateRange Date range for the report
 * @returns Y position after adding header elements
 */
export const addReportHeader = (
  doc: jsPDF, 
  title: string, 
  dateRange: { from: Date | undefined; to: Date | undefined }
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Set logo coordinates and dimensions
  const logoX = 14;
  const logoY = 10;
  const logoWidth = 40;
  const logoHeight = 15;
  
  // Try to add company logo with fallback
  try {
    // Use absolute path for logo to prevent issues with relative paths
    const logoPath = '/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png';
    doc.addImage(logoPath, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.warn('Failed to add logo to PDF header:', error);
    // Add text instead of image as fallback
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ALARAF CAR RENTAL', logoX, logoY + 10);
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
 */
export const addReportFooter = (doc: jsPDF): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add footer text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('© 2025 ALARAF CAR RENTAL', pageWidth / 2, pageHeight - 30, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Quality Service, Premium Experience', pageWidth / 2, pageHeight - 25, { align: 'center' });
  
  // Add horizontal line instead of the Arabic text image
  doc.setDrawColor(200, 200, 200);
  doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
  
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
 * @returns PDF document
 */
export const generateStandardReport = (
  title: string,
  dateRange: { from: Date | undefined; to: Date | undefined },
  contentGenerator: (doc: jsPDF, startY: number) => number
): jsPDF => {
  // Initialize the PDF document with better error handling
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  try {
    // Add header and get the Y position to start content
    const startY = addReportHeader(doc, title, dateRange);
    
    // Add content using the provided generator function
    const finalY = contentGenerator(doc, startY);
    
    // Apply footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addReportFooter(doc);
    }
    
    return doc;
  } catch (error) {
    console.error("Error generating standard report:", error);
    // Create a simple error document
    doc.deletePage(1);
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(255, 0, 0);
    doc.text("Error Generating Report", 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("An error occurred while generating this report.", 20, 30);
    doc.text("Please try again or contact support.", 20, 40);
    return doc;
  }
};
