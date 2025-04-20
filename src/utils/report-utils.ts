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
  
  // Add company name instead of logo to avoid image loading issues
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ALARAF CAR RENTAL', 14, 20);
  
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
  
  // No image to avoid loading issues
  
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
 * Generate a Traffic Fines Report
 * @param trafficData Array of traffic fine data
 * @returns jsPDF document
 */
export const generateTrafficFinesReport = (trafficData: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle traffic fines report', 14, 20);
  
  // Generation date
  doc.setFontSize(14);
  doc.text(`Generated on ${format(new Date(), 'dd/M/yyyy')}`, 14, 35);
  
  // Summary Section
  doc.setFontSize(14);
  doc.text('Summary', 14, 55);
  
  // Calculate summary data
  const totalVehicles = new Set(trafficData.map(fine => fine.licensePlate)).size;
  const totalFines = trafficData.length;
  const totalAmount = trafficData.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const pendingAmount = trafficData.reduce((sum, fine) => 
    fine.paymentStatus === 'pending' ? sum + (fine.fineAmount || 0) : sum, 0);
  const completedAmount = totalAmount - pendingAmount;
  const unassignedFines = trafficData.filter(fine => !fine.customerName).length;
  const unassignedAmount = trafficData
    .filter(fine => !fine.customerName)
    .reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);

  // Draw summary table
  const summaryData = [
    ['Total Vehicles', totalVehicles.toString()],
    ['Total Fines', totalFines.toString()],
    ['Total Amount', `QAR ${totalAmount.toLocaleString()}`],
    ['Pending Amount', `QAR ${pendingAmount.toLocaleString()}`],
    ['Completed Amount', `QAR ${completedAmount.toLocaleString()}`],
    ['Unassigned Fines', unassignedFines.toString()],
    ['Unassigned Amount', `QAR ${unassignedAmount.toLocaleString()}`]
  ];

  // Draw summary table
  let y = 65;
  const colWidth = 80;
  
  // Header row with orange background
  doc.setFillColor(255, 140, 0);
  doc.rect(14, y, colWidth, 8, 'F');
  doc.rect(14 + colWidth, y, colWidth, 8, 'F');
  
  // Header text in white
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('Metric', 16, y + 6);
  doc.text('Value', 16 + colWidth, y + 6);
  
  // Reset text color to black for data rows
  doc.setTextColor(0);
  y += 8;
  
  // Draw data rows
  summaryData.forEach(([label, value]) => {
    doc.rect(14, y, colWidth, 8);
    doc.rect(14 + colWidth, y, colWidth, 8);
    doc.text(label, 16, y + 6);
    doc.text(value, 16 + colWidth, y + 6);
    y += 8;
  });
  
  // Group fines by customer
  const groupedFines = trafficData.reduce((acc, fine) => {
    const customerKey = fine.customerName || 'Unassigned';
    if (!acc[customerKey]) {
      acc[customerKey] = {
        fines: [],
        totalAmount: 0,
        vehicles: new Set(),
        agreements: new Set()
      };
    }
    acc[customerKey].fines.push(fine);
    acc[customerKey].totalAmount += fine.fineAmount || 0;
    if (fine.licensePlate) acc[customerKey].vehicles.add(fine.licensePlate);
    if (fine.agreementNumber) acc[customerKey].agreements.add(fine.agreementNumber);
    return acc;
  }, {} as Record<string, any>);
  
  // Add customer sections
  y += 20;
  Object.entries(groupedFines).forEach(([customerName, data]: [string, any]) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    // Customer header with orange background
    doc.setFillColor(255, 140, 0);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(customerName, 16, y + 6);
    y += 12;
    
    // Vehicle and Agreement summary
    doc.setTextColor(0);
    const summaryHeaders = ['Vehicle Number', 'Agreement number', 'Total fine amount'];
    const headerWidths = [(pageWidth - 28) / 3, (pageWidth - 28) / 3, (pageWidth - 28) / 3];
    
    // Draw headers
    let x = 14;
    summaryHeaders.forEach((header, i) => {
      doc.rect(x, y, headerWidths[i], 8);
      doc.text(header, x + 2, y + 6);
      x += headerWidths[i];
    });
    y += 8;
    
    // Draw summary row
    Array.from(data.vehicles).forEach((vehicle: string) => {
      x = 14;
      const agreement = Array.from(data.agreements)[0] || '';
      const amount = `${data.totalAmount} QAR`;
      
      [vehicle, agreement, amount].forEach((text, i) => {
        doc.rect(x, y, headerWidths[i], 8);
        doc.text(text, x + 2, y + 6);
        x += headerWidths[i];
      });
      y += 8;
    });
    
    y += 4;
    
    // Violations table
    const violationHeaders = ['Violation number', 'Violation Date', 'Violation amount'];
    x = 14;
    violationHeaders.forEach((header, i) => {
      doc.rect(x, y, headerWidths[i], 8);
      doc.text(header, x + 2, y + 6);
      x += headerWidths[i];
    });
    y += 8;
    
    // Draw violations
    data.fines.forEach((fine: any) => {
      x = 14;
      const date = format(new Date(fine.violationDate), 'dd/M/yyyy');
      const amount = `${fine.fineAmount} QAR`;
      
      [fine.violationNumber, date, amount].forEach((text, i) => {
        doc.rect(x, y, headerWidths[i], 8);
        doc.text(text.toString(), x + 2, y + 6);
        x += headerWidths[i];
      });
      y += 8;
    });
    
    y += 12;
  });
  
  return doc;
};
