
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatDate } from '@/lib/date-utils';
import { prepareArabicText, containsArabic, configureArabicPDF, formatMixedText } from '@/utils/arabic-text-utils';

/**
 * Generates a CSV string from an array of objects
 * @param data Array of objects to convert to CSV
 * @returns CSV formatted string
 */
export const generateCSV = (data: Record<string, any>[]): string => {
  if (!data || data.length === 0) return '';

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Add BOM for UTF-8 encoding support for Arabic text
  let csv = '\uFEFF' + headers.join(',') + '\n';

  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      // Handle values that might contain commas or quotes
      const value = item[header] === null || item[header] === undefined ? '' : item[header];
      const valueStr = String(value);
      
      // Properly encode text that might contain Arabic characters
      const processedValue = containsArabic(valueStr) ? prepareArabicText(valueStr) : valueStr;

      // Escape quotes and wrap in quotes if contains comma or quote
      if (processedValue.includes(',') || processedValue.includes('"')) {
        return `"${processedValue.replace(/"/g, '""')}"`;
      }
      return processedValue;
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
  URL.revokeObjectURL(url);
};

/**
 * Downloads data as an Excel file
 * @param data Array of objects to download as Excel
 * @param filename Name for the downloaded file
 */
export const downloadExcel = (data: Record<string, any>[], filename: string): void => {
  // For simplicity, we're using CSV with .xlsx extension
  // Make sure we add the BOM character for Excel to recognize UTF-8
  const csv = generateCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const PAGE_HEIGHT = 297; // A4 height in mm
const FOOTER_HEIGHT = 30; // Space reserved for footer in mm
const CONTENT_MARGIN = 14; // Left/right margin in mm

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

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  // Add report period and generation date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const fromDate = dateRange.from ? formatDate(dateRange.from) : '';
  const toDate = dateRange.to ? formatDate(dateRange.to) : '';
  doc.text(`Report Period: ${fromDate} - ${toDate}`, pageWidth / 2, 35, { align: 'center' });
  doc.text(`Generated on: ${formatDate(new Date())}`, pageWidth / 2, 45, { align: 'center' });

  return 60;
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
  doc.setFont('helvetica', 'normal');
  doc.text('© 2025 ALARAF CAR RENTAL', pageWidth / 2, pageHeight - 25, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Quality Service, Premium Experience', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // Add page bottom elements with proper spacing
  doc.text('CONFIDENTIAL', 14, pageHeight - 10);
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  doc.text(formatDate(new Date()), pageWidth - 14, pageHeight - 15, { align: 'right' });
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
  contentGenerator: (doc: jsPDF, startY: number) => number
): Promise<jsPDF> => {
  const doc = new jsPDF();
  
  // Configure document for Arabic support
  await configureArabicPDF(doc);
  
  const startY = addReportHeader(doc, title, dateRange);
  contentGenerator(doc, startY);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addReportFooter(doc);
  }

  return doc;
};

/**
 * Generate a Traffic Fines Report
 * @param trafficData Array of traffic fine data
 * @returns jsPDF document
 */
export const generateTrafficFinesReport = async (trafficData: any[] = []) => {
  if (!Array.isArray(trafficData)) {
    console.error('Invalid traffic data provided');
    throw new Error('Invalid traffic data format');
  }
  const doc = new jsPDF();
  
  // Configure document for Arabic support
  await configureArabicPDF(doc);
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Add header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Fleet Report', pageWidth / 2, currentY, { align: 'center' });

  // Add report period
  currentY += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Period: ${format(new Date(), 'MMMM dd, yyyy')} - ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, currentY, { align: 'center' });

  currentY += 10;
  doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, currentY, { align: 'center' });

  // Draw metrics table
  currentY += 20;
  // Calculate metrics from actual data
  const totalFines = trafficData.length;
  const totalAmount = trafficData.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const pendingFines = trafficData.filter(fine => fine.paymentStatus === 'pending');
  const pendingAmount = pendingFines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const completedAmount = totalAmount - pendingAmount;
  const unassignedFines = trafficData.filter(fine => !fine.customerId);
  const unassignedAmount = unassignedFines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);

  // Add try-catch blocks for database operations
  let metrics = [];
  try {
    metrics = [
      ['Total Fines', totalFines.toString()],
      ['Total Amount', `QAR ${totalAmount.toLocaleString()}`],
      ['Pending Amount', `QAR ${pendingAmount.toLocaleString()}`],
      ['Completed Amount', `QAR ${completedAmount.toLocaleString()}`],
      ['Unassigned Fines', unassignedFines.length.toString()],
      ['Unassigned Amount', `QAR ${unassignedAmount.toLocaleString()}`]
    ];
  } catch (error) {
    console.error('Error preparing metrics:', error);
    metrics = [
      ['Total Fines', '0'],
      ['Total Amount', 'QAR 0'],
      ['Pending Amount', 'QAR 0'],
      ['Completed Amount', 'QAR 0'],
      ['Unassigned Fines', '0'],
      ['Unassigned Amount', 'QAR 0']
    ];
  }

  // Draw header row with orange background
  doc.setFillColor(255, 140, 0);
  doc.rect(14, currentY, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Metric', 16, currentY + 6);
  doc.text('Value', pageWidth / 2, currentY + 6);

  // Draw data rows
  currentY += 8;
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');

  // Format metrics
  for (const [label, value] of metrics) {
    // Check if we need a new page
    if (currentY > PAGE_HEIGHT - FOOTER_HEIGHT) {
      doc.addPage();
      currentY = 20;
      addReportFooter(doc);
    }

    doc.rect(14, currentY, (pageWidth - 28) / 2, 8);
    doc.rect(14 + (pageWidth - 28) / 2, currentY, (pageWidth - 28) / 2, 8);

    // Apply text formatting for potential Arabic content
    doc.text(label, pageWidth / 2 - 2, currentY + 6, { align: 'right' });
    doc.text(value, pageWidth - 16, currentY + 6, { align: 'right' });
    currentY += 8;
  }

  currentY += 20;

  // Group fines by customer with error handling
  const groupedFines = (trafficData || []).reduce((acc, fine) => {
    try {
      const customerKey = fine.customerName || 'Unassigned';
      if (!acc[customerKey]) {
        acc[customerKey] = {
          fines: [],
          totalAmount: 0,
          vehicles: new Set()
        };
      }
      acc[customerKey].fines.push(fine);
      acc[customerKey].totalAmount += fine.fineAmount || 0;
      if (fine.licensePlate) acc[customerKey].vehicles.add(fine.licensePlate);
      return acc;
    } catch (error) {
      console.error('Error processing fine:', error, fine);
      return acc;
    }
  }, {} as { [key: string]: { fines: any[], totalAmount: number, vehicles: Set<string> } });

  // Add customer sections
  for (const [customerName, data] of Object.entries(groupedFines)) {
    // Check if we need a new page
    if (currentY > PAGE_HEIGHT - FOOTER_HEIGHT - 40) {
      doc.addPage();
      currentY = 20;
      addReportFooter(doc);
    }

    // Draw customer header with orange background
    doc.setFillColor(255, 140, 0);
    doc.rect(14, currentY, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    
    // Format customer name properly
    const processedCustomerName = containsArabic(customerName) ? 
      formatMixedText(prepareArabicText(customerName)) : 
      customerName;
    doc.text(processedCustomerName, 16, currentY + 6);
    currentY += 12;

    // Vehicle summary header
    const headerWidths = [(pageWidth - 28) / 2, (pageWidth - 28) / 2];

    // Draw headers
    Array.from(data.vehicles).forEach((vehicle: string) => {
      if (currentY > PAGE_HEIGHT - FOOTER_HEIGHT - 20) {
        doc.addPage();
        currentY = 20;
        addReportFooter(doc);
      }

      let x = 14;
      const vehicleData = [vehicle, `${data.totalAmount} QAR`];

      vehicleData.forEach((text, i) => {
        doc.rect(x, currentY, headerWidths[i], 8);
        doc.setTextColor(0);
        
        // Process text for potential Arabic content
        const processedText = containsArabic(text.toString()) ? 
          formatMixedText(prepareArabicText(text.toString())) : 
          text.toString();
        doc.text(processedText, x + 2, currentY + 6);
        x += headerWidths[i];
      });
      currentY += 8;
    });

    currentY += 4;

    // Violations table
    if (data.fines.length > 0) {
      if (currentY > PAGE_HEIGHT - FOOTER_HEIGHT - 40) {
        doc.addPage();
        currentY = 20;
        addReportFooter(doc);
      }

      // Headers for violations
      const violationHeaders = ['Violation number', 'Violation Date', 'Violation amount'];
      const violationWidths = [(pageWidth - 28) / 3, (pageWidth - 28) / 3, (pageWidth - 28) / 3];

      let x = 14;
      violationHeaders.forEach((header, i) => {
        doc.rect(x, currentY, violationWidths[i], 8);
        doc.text(header, x + 2, currentY + 6);
        x += violationWidths[i];
      });
      currentY += 8;

      // Draw violations
      data.fines.forEach((fine: any) => {
        if (currentY > PAGE_HEIGHT - FOOTER_HEIGHT - 10) {
          doc.addPage();
          currentY = 20;
          addReportFooter(doc);
        }

        x = 14;
        const date = format(new Date(fine.violationDate), 'dd/MM/yyyy');
        const amount = `${fine.fineAmount} QAR`;

        [fine.violationNumber, date, amount].forEach((text, i) => {
          doc.rect(x, currentY, violationWidths[i], 8);
          
          // Process text for potential Arabic content
          const processedText = containsArabic(text.toString()) ? 
            formatMixedText(prepareArabicText(text.toString())) : 
            text.toString();
          doc.text(processedText, x + 2, currentY + 6);
          x += violationWidths[i];
        });
        currentY += 8;
      });
    }

    currentY += 12;
  }

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addReportFooter(doc);
  }

  return doc;
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
