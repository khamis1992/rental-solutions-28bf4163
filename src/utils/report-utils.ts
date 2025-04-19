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
  
  // Add company logo
  doc.addImage('/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png', 'PNG', 14, 10, 40, 15);
  
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
  
  // Add footer logo - removed as per image example
  // Only show the Arabic text image at the right side
  doc.addImage('/lovable-uploads/d6cc5f20-2b4e-4882-a50c-2377f75ff46d.png', 'PNG', pageWidth - 80, pageHeight - 30, 70, 15);
  
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
  const doc = new jsPDF();
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
 * Generate a Vehicle Traffic Fines Report
 * @param finesData Array of fines data
 * @returns PDF document
 */
export const generateTrafficFinesReport = (finesData: any[]) => {
  const doc = new jsPDF();
  
  // Add report title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle Traffic Fines Report', 14, 20);
  
  // Add generation date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 30);
  
  // Add summary section title
  doc.setFontSize(12);
  doc.text('Summary', 14, 45);
  
  // Calculate summary data
  const totalVehicles = new Set(finesData.map(fine => fine.licensePlate)).size;
  const totalFines = finesData.length;
  const totalAmount = finesData.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const pendingAmount = finesData
    .filter(fine => fine.paymentStatus === 'pending')
    .reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const completedAmount = finesData
    .filter(fine => fine.paymentStatus === 'paid')
    .reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const unassignedFines = finesData.filter(fine => !fine.customerId).length;
  const unassignedAmount = finesData
    .filter(fine => !fine.customerId)
    .reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  
  // Draw summary table
  const summaryData = [
    ['Total Vehicles', totalVehicles.toString()],
    ['Total Fines', totalFines.toString()],
    ['Total Amount', `QAR ${totalAmount.toFixed(2)}`],
    ['Pending Amount', `QAR ${pendingAmount.toFixed(2)}`],
    ['Completed Amount', `QAR ${completedAmount.toFixed(2)}`],
    ['Unassigned Fines', unassignedFines.toString()],
    ['Unassigned Amount', `QAR ${unassignedAmount.toFixed(2)}`]
  ];
  
  let y = 55;
  doc.setFillColor(255, 140, 0); // Orange header background
  doc.rect(14, y, 80, 7, 'F');
  doc.rect(94, y, 80, 7, 'F');
  
  // Add header
  doc.setTextColor(255, 255, 255); // White text for header
  doc.text('Metric', 16, y + 5);
  doc.text('Value', 96, y + 5);
  
  // Add data rows
  doc.setTextColor(0); // Reset to black text
  y += 7;
  summaryData.forEach(row => {
    doc.rect(14, y, 80, 7);
    doc.rect(94, y, 80, 7);
    doc.text(row[0], 16, y + 5);
    doc.text(row[1], 96, y + 5);
    y += 7;
  });
  
  // Add details table
  y += 15;
  
  // Table headers
  const headers = ['Vehicle', 'License Plate', 'Customer', 'Agreement #', 'Fine Count', 'Total Fine'];
  const columnWidths = [40, 25, 40, 30, 20, 30];
  
  doc.setFillColor(255, 140, 0);
  let x = 14;
  headers.forEach((header, i) => {
    doc.rect(x, y, columnWidths[i], 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(header, x + 2, y + 5);
    x += columnWidths[i];
  });
  
  // Table data
  y += 7;
  doc.setTextColor(0);
  
  finesData.forEach(fine => {
    if (y > 270) {
      doc.addPage();
      y = 20;
      
      // Add headers to new page
      x = 14;
      doc.setFillColor(255, 140, 0);
      headers.forEach((header, i) => {
        doc.rect(x, y, columnWidths[i], 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(header, x + 2, y + 5);
        x += columnWidths[i];
      });
      doc.setTextColor(0);
      y += 7;
    }
    
    x = 14;
    const rowData = [
      fine.vehicleModel || 'N/A',
      fine.licensePlate || 'N/A',
      fine.customerName || 'N/A',
      fine.agreementNumber || 'N/A',
      fine.fineCount?.toString() || '1',
      `QAR ${fine.fineAmount?.toFixed(2) || '0.00'}`
    ];
    
    rowData.forEach((text, i) => {
      doc.rect(x, y, columnWidths[i], 7);
      doc.text(text, x + 2, y + 5);
      x += columnWidths[i];
    });
    y += 7;
  });
  
  return doc;
};
