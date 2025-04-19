
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatDate } from '@/lib/date-utils';
import { ArabicTextService } from './arabic-text-service';

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
 * Processes text for PDF rendering, with special handling for Arabic text
 * @param text The text to process
 * @returns Promise resolving to processed text ready for PDF
 */
export const processPdfText = async (text: string): Promise<string> => {
  if (!text) return '';
  
  try {
    // Process text with DeepSeek AI for Arabic text rendering
    return await ArabicTextService.processText(text, 'PDF Report');
  } catch (error) {
    console.error('Error processing text for PDF:', error);
    return text; // Return original text on error
  }
};

/**
 * Generates a PDF report header with company logo
 * @param doc jsPDF document instance
 * @param title Report title
 * @param dateRange Date range for the report
 * @returns Y position after adding header elements
 */
export const addReportHeader = async (
  doc: jsPDF, 
  title: string, 
  dateRange: { from: Date | undefined; to: Date | undefined }
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add company logo
  doc.addImage('/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png', 'PNG', 14, 10, 40, 15);
  
  // Add a separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 30, pageWidth - 14, 30);
  
  // Process title for Arabic text rendering
  const processedTitle = await processPdfText(title);
  
  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(processedTitle, pageWidth / 2, 40, { align: 'center' });
  
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
export const addReportFooter = async (doc: jsPDF): Promise<void> => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Process company name for Arabic text rendering
  const companyName = await processPdfText('© 2025 ALARAF CAR RENTAL');
  const tagline = await processPdfText('Quality Service, Premium Experience');
  const confidential = await processPdfText('CONFIDENTIAL');
  
  // Add footer text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, pageWidth / 2, pageHeight - 30, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(tagline, pageWidth / 2, pageHeight - 25, { align: 'center' });
  
  // Add footer logo - removed as per image example
  // Only show the Arabic text image at the right side
  doc.addImage('/lovable-uploads/d6cc5f20-2b4e-4882-a50c-2377f75ff46d.png', 'PNG', pageWidth - 80, pageHeight - 30, 70, 15);
  
  // Add page bottom elements with correct spacing/positioning
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(confidential, 14, pageHeight - 10);
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
export const generateStandardReport = async (
  title: string,
  dateRange: { from: Date | undefined; to: Date | undefined },
  contentGenerator: (doc: jsPDF, startY: number) => Promise<number>
): Promise<jsPDF> => {
  // Process title for Arabic text handling
  const processedTitle = await processPdfText(title);
  
  // Initialize the PDF document
  const doc = new jsPDF();
  
  // Add Arabic font support
  doc.addFont('https://unpkg.com/amiri@0.114.0/amiri-regular.ttf', 'Amiri', 'normal');
  doc.addFont('https://unpkg.com/amiri@0.114.0/amiri-bold.ttf', 'Amiri', 'bold');
  
  // Add header and get the Y position to start content
  const startY = await addReportHeader(doc, processedTitle, dateRange);
  
  // Add content using the provided generator function
  await contentGenerator(doc, startY);
  
  // Apply footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    await addReportFooter(doc);
  }
  
  return doc;
};

/**
 * Process text for PDF rendering with right-to-left (RTL) support
 * @param doc PDF document
 * @param text Text to render
 * @param x X position
 * @param y Y position
 * @param options Text options
 */
export const addTextWithRtlSupport = async (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: {
    align?: 'left' | 'center' | 'right',
    useArabicFont?: boolean
  }
): Promise<void> => {
  const processedText = await processPdfText(text);
  const isRtl = containsRtlCharacters(processedText);
  
  // Always add Arabic font for RTL text
  if (isRtl || options?.useArabicFont) {
    // Add Arabic font support
    doc.addFont('https://cdn.jsdelivr.net/npm/@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-400-normal.woff', 'Noto Naskh Arabic', 'normal');
    doc.setFont('Noto Naskh Arabic');
    
    // Calculate position for RTL text
    const textWidth = doc.getTextWidth(processedText);
    let finalX = x;
    
    if (options?.align === 'right' || (!options?.align && isRtl)) {
      finalX = doc.internal.pageSize.getWidth() - x - textWidth;
    } else if (options?.align === 'center') {
      finalX = (doc.internal.pageSize.getWidth() - textWidth) / 2;
    }
    
    // Add the text with RTL support
    doc.text(processedText, finalX, y, { 
      align: 'left', // We handle alignment manually for RTL
      isInputRtl: true
    });
    
    // Switch back to default font
    doc.setFont('helvetica', 'normal');
  } else {
    // Non-RTL text handling
    doc.text(processedText, x, y, { 
      align: options?.align || 'left'
    });
  }
};

/**
 * Check if text contains RTL characters
 * @param text Text to check
 * @returns True if contains RTL characters
 */
function containsRtlCharacters(text: string): boolean {
  // RTL characters include Arabic, Hebrew, etc.
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF]/;
  return rtlRegex.test(text);
}
