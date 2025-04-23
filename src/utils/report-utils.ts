
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatDate } from '@/lib/date-utils';
import { exportToPdfWithArabic } from '@/utils/pdfExport';

/**
 * Sanitizes text for CSV export, ensuring no encoding issues
 */
const sanitizeForCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  // Convert to string and ensure proper encoding
  const valueStr = String(value);
  
  // Escape quotes and wrap in quotes if contains comma or quote
  if (valueStr.includes(',') || valueStr.includes('"')) {
    return `"${valueStr.replace(/"/g, '""')}"`;
  }
  return valueStr;
};

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
      return sanitizeForCSV(item[header]);
    });
    
    csv += row.join(',') + '\n';
  });
  
  // Ensure proper UTF-8 encoding with BOM for Excel compatibility
  return '\uFEFF' + csv;
};

/**
 * Downloads data as a CSV file with proper encoding
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
 * Downloads data as an Excel file (using CSV format with proper encoding)
 * @param data Array of objects to download as Excel
 * @param filename Name for the downloaded file
 */
export const downloadExcel = (data: Record<string, any>[], filename: string): void => {
  const csv = generateCSV(data);
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
 * Generate a Traffic Fines Report with proper font encoding
 * @param trafficData Array of traffic fine data
 * @returns jsPDF document
 */
export const generateTrafficFinesReport = (trafficData: any[]): jsPDF => {
  try {
    console.log("Starting traffic fines report generation with data:", 
      Array.isArray(trafficData) ? `${trafficData.length} records` : "Invalid data format");

    if (!Array.isArray(trafficData) || trafficData.length === 0) {
      console.error("Invalid or empty traffic fine data provided");
      throw new Error("No traffic fine data available for report generation");
    }

    const doc = new jsPDF();
    
    // Add font support for non-Latin characters
    doc.addFont('helvetica', 'normal');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Traffic Fines Report', pageWidth / 2, currentY, { align: 'center' });
    
    // Add report period
    currentY += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Period: ${format(new Date(), 'MMMM dd, yyyy')} - ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 10;
    doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, currentY, { align: 'center' });
    
    // Calculate metrics
    const totalFines = trafficData.length;
    const totalAmount = trafficData.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
    const pendingAmount = trafficData
      .filter(fine => fine.paymentStatus === 'pending')
      .reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
    const completedAmount = trafficData
      .filter(fine => fine.paymentStatus === 'paid')
      .reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
    const unassignedFines = trafficData.filter(fine => !fine.customerName || fine.customerName === 'Unassigned').length;
    const unassignedAmount = trafficData
      .filter(fine => !fine.customerName || fine.customerName === 'Unassigned')
      .reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
    const vehicleCount = new Set(trafficData.map(fine => fine.licensePlate).filter(Boolean)).size;

    // Draw metrics table
    currentY += 20;
    const metrics = [
      ['Total Vehicles', vehicleCount.toString()],
      ['Total Fines', totalFines.toString()],
      ['Total Amount', `QAR ${totalAmount.toLocaleString()}`],
      ['Pending Amount', `QAR ${pendingAmount.toLocaleString()}`],
      ['Completed Amount', `QAR ${completedAmount.toLocaleString()}`],
      ['Unassigned Fines', unassignedFines.toString()],
      ['Unassigned Amount', `QAR ${unassignedAmount.toLocaleString()}`]
    ];

    // Draw header row with orange background
    doc.setFillColor(255, 140, 0);
    doc.rect(14, currentY, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Metric', 16, currentY + 6, { align: 'left' });
    doc.text('Value', pageWidth / 2, currentY + 6, { align: 'left' });

    // Draw data rows
    currentY += 8;
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    
    metrics.forEach(([label, value]) => {
      // Check if we need a new page
      if (currentY > PAGE_HEIGHT - FOOTER_HEIGHT) {
        doc.addPage();
        currentY = 20;
        addReportFooter(doc);
      }
      
      doc.rect(14, currentY, (pageWidth - 28) / 2, 8);
      doc.rect(14 + (pageWidth - 28) / 2, currentY, (pageWidth - 28) / 2, 8);
      doc.text(label, 16, currentY + 6);
      doc.text(value, 16 + (pageWidth - 28) / 2, currentY + 6);
      currentY += 8;
    });
    
    currentY += 20;

    // Group fines by customer
    const groupedFines: Record<string, any> = {};
    
    trafficData.forEach(fine => {
      const customerKey = fine.customerName || 'Unassigned';
      if (!groupedFines[customerKey]) {
        groupedFines[customerKey] = {
          fines: [],
          totalAmount: 0,
          vehicles: new Set()
        };
      }
      groupedFines[customerKey].fines.push(fine);
      groupedFines[customerKey].totalAmount += fine.fineAmount || 0;
      if (fine.licensePlate) groupedFines[customerKey].vehicles.add(fine.licensePlate);
    });

    // Add customer sections
    Object.entries(groupedFines).forEach(([customerName, data]: [string, any]) => {
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
      doc.text(customerName, 16, currentY + 6);
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
          doc.text(String(text), x + 2, currentY + 6);
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
          let date;
          try {
            date = fine.violationDate ? format(new Date(fine.violationDate), 'dd/MM/yyyy') : 'N/A';
          } catch (error) {
            console.error("Date formatting error:", error);
            date = 'Invalid date';
          }
          const amount = `${fine.fineAmount || 0} QAR`;
          
          [fine.violationNumber || 'N/A', date, amount].forEach((text, i) => {
            doc.rect(x, currentY, violationWidths[i], 8);
            doc.text(String(text), x + 2, currentY + 6);
            x += violationWidths[i];
          });
          currentY += 8;
        });
      }
      
      currentY += 12;
    });

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addReportFooter(doc);
    }

    console.log("Traffic fines report generation completed successfully");
    return doc;
  } catch (error) {
    console.error("Error generating traffic fines report:", error);
    throw error;
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
 * Generate a custom report based on report type, filters, date range, format, and callback
 * @param reportType Type of report to generate
 * @param filters Filters to apply to the report
 * @param dateRange Date range for the report
 * @param format Format of the report (default: 'pdf')
 * @param callback Callback function to handle the generated report
 */
export const generateCustomReport = async (
  reportType: string,
  filters: any,
  dateRange: { startDate: Date; endDate: Date },
  format: string = 'pdf',
  callback?: (report: any) => void
) => {
  // Implementation of generateCustomReport
};
