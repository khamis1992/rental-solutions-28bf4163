
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
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
      
      // Handle date objects
      let valueStr: string;
      if (value instanceof Date && !isNaN(value.getTime())) {
        valueStr = format(value, 'yyyy-MM-dd');
      } else {
        valueStr = String(value);
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
 */
export const downloadCSV = (data: Record<string, any>[], filename: string): void => {
  try {
    const csv = generateCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading CSV:", error);
    toast.error("Failed to download CSV file");
  }
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
    // Use full URL path for logo to prevent issues
    const logoPath = '/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png';
    console.log('Attempting to add logo from path:', logoPath);
    
    // First check if we can access the image
    const img = new Image();
    img.src = logoPath;
    
    // Add text instead of image as reliable fallback
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text('ALARAF CAR RENTAL', logoX, logoY + 10);
    
    // Try to add the image if it's available
    if (img.complete) {
      safelyAddImage(doc, logoPath, logoX, logoY, logoWidth, logoHeight);
    }
  } catch (error) {
    console.warn('Failed to add logo to PDF header:', error);
    // Add text instead of image as fallback
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('ALARAF CAR RENTAL', logoX, logoY + 10);
  }
  
  // Add a separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageWidth - 14, 30);
  
  // Add title with improved styling
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text(title, pageWidth / 2, 45, { align: 'center' });
  
  // Add date range with updated format
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  // Safely format dates with error handling
  let fromDateStr = 'N/A';
  let toDateStr = 'N/A';
  
  try {
    if (dateRange.from && dateRange.from instanceof Date && !isNaN(dateRange.from.getTime())) {
      fromDateStr = formatDate(dateRange.from);
    }
  } catch (err) {
    console.error("Error formatting from date:", err);
  }
  
  try {
    if (dateRange.to && dateRange.to instanceof Date && !isNaN(dateRange.to.getTime())) {
      toDateStr = formatDate(dateRange.to);
    }
  } catch (err) {
    console.error("Error formatting to date:", err);
  }
  
  doc.text(`Report Period: ${fromDateStr} - ${toDateStr}`, pageWidth / 2, 55, { align: 'center' });
  
  // Add date of generation with updated format
  doc.text(`Generated on: ${formatDate(new Date())}`, pageWidth / 2, 62, { align: 'center' });
  
  return 75; // Return next Y position with more space
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
  doc.setTextColor(100, 100, 100);
  doc.text('© 2025 ALARAF CAR RENTAL', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Quality Service, Premium Experience', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // Add horizontal line (slightly higher to avoid overlap)
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
  
  // Add page bottom elements with correct spacing/positioning
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('CONFIDENTIAL', 14, pageHeight - 5);
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  doc.text(formatDate(new Date()), pageWidth - 14, pageHeight - 5, { align: 'right' });
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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  try {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Improved Header
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Company Logo or Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text('ALARAF CAR RENTAL', pageWidth / 2, 15, { align: 'center' });
    
    // Report Title
    doc.setFontSize(14);
    doc.setTextColor(70, 70, 70);
    doc.text(title, pageWidth / 2, 35, { align: 'center' });
    
    // Date Range
    doc.setFontSize(10);
    const fromDateStr = dateRange.from ? formatDate(dateRange.from) : 'N/A';
    const toDateStr = dateRange.to ? formatDate(dateRange.to) : 'N/A';
    doc.text(`Report Period: ${fromDateStr} - ${toDateStr}`, pageWidth / 2, 42, { align: 'center' });
    
    // Generate content
    const startY = 50;
    const finalY = contentGenerator(doc, startY);
    
    // Footer for each page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer background - ensure it's properly positioned
      doc.setFillColor(240, 240, 240);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      // Footer text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      doc.text('© 2025 ALARAF CAR RENTAL', 15, pageHeight - 6);
      doc.text('Quality Service, Premium Experience', pageWidth / 2, pageHeight - 6, { align: 'center' });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 6, { align: 'right' });
    }
    
    return doc;
  } catch (error) {
    console.error("Error generating standard report:", error);
    
    // Error page
    doc.deletePage(1);
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(255, 0, 0);
    doc.text("Error Generating Report", 20, 20);
    
    return doc;
  }
};
