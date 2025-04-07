
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { addReportHeader, addReportFooter } from '@/utils/report-utils';
import { TrafficFine } from '@/hooks/use-traffic-fines';

/**
 * Groups traffic fines by customer for better organization in reports
 * @param fines Array of traffic fines
 * @returns Object with customer names as keys and arrays of fines as values
 */
export const groupFinesByCustomer = (fines: TrafficFine[]) => {
  const groupedFines: Record<string, TrafficFine[]> = {};

  fines.forEach(fine => {
    const customerName = fine.customerName || 'Unassigned';
    
    if (!groupedFines[customerName]) {
      groupedFines[customerName] = [];
    }
    
    groupedFines[customerName].push(fine);
  });

  return groupedFines;
};

/**
 * Calculates summary metrics for traffic fines
 * @param fines Array of traffic fines
 * @returns Object containing summary metrics
 */
export const calculateFinesMetrics = (fines: TrafficFine[]) => {
  const totalFines = fines.length;
  const totalAmount = fines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const paidFines = fines.filter(fine => fine.paymentStatus === 'paid');
  const paidAmount = paidFines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;
  const pendingFines = totalFines - paidFines.length;
  const paymentRate = totalFines > 0 ? (paidFines.length / totalFines) * 100 : 0;

  return {
    totalFines,
    totalAmount,
    paidFines: paidFines.length,
    paidAmount,
    pendingAmount,
    pendingFines,
    paymentRate: Math.round(paymentRate)
  };
};

/**
 * Formats date for consistent display across traffic fines reports
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatFineDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
};

/**
 * Generates a detailed PDF report for traffic fines
 * @param fines Array of traffic fines to include in the report
 * @param dateRange Date range for the report
 * @returns Promise resolving to PDF document
 */
export const generateTrafficFinesPDF = async (
  fines: TrafficFine[],
  dateRange: { from: Date | undefined; to: Date | undefined }
): Promise<jsPDF> => {
  const doc = new jsPDF();
  
  // Add standard report header
  let yPos = await addReportHeader(doc, 'Traffic Fines Report', dateRange);
  yPos += 10;
  
  // Calculate summary metrics
  const metrics = calculateFinesMetrics(fines);
  
  // Add summary section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Fines: ${metrics.totalFines}`, 20, yPos); yPos += 6;
  doc.text(`Total Amount: ${formatCurrency(metrics.totalAmount)}`, 20, yPos); yPos += 6;
  doc.text(`Paid Fines: ${metrics.paidFines} (${metrics.paymentRate}%)`, 20, yPos); yPos += 6;
  doc.text(`Paid Amount: ${formatCurrency(metrics.paidAmount)}`, 20, yPos); yPos += 6;
  doc.text(`Pending Fines: ${metrics.pendingFines}`, 20, yPos); yPos += 6;
  doc.text(`Pending Amount: ${formatCurrency(metrics.pendingAmount)}`, 20, yPos); yPos += 12;
  
  // Group fines by customer for better organization
  const groupedFines = groupFinesByCustomer(fines);
  
  // Add details section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Traffic Fines Details', 14, yPos);
  yPos += 10;
  
  // Process each customer's fines
  for (const [customer, customerFines] of Object.entries(groupedFines)) {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Add customer subheading
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Customer: ${customer}`, 14, yPos);
    yPos += 8;
    
    // Table headers for this customer's fines
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const headers = ['Date', 'Violation #', 'Location', 'Violation', 'Amount', 'Status'];
    const colWidths = [25, 25, 35, 50, 25, 25];
    
    let xPos = 14;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 5;
    
    // Draw horizontal line
    doc.setLineWidth(0.2);
    doc.line(14, yPos, 196, yPos);
    yPos += 5;
    
    // Customer's fines data rows
    doc.setFont('helvetica', 'normal');
    
    for (const fine of customerFines) {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      xPos = 14;
      
      // Date
      doc.text(formatFineDate(fine.violationDate), xPos, yPos);
      xPos += colWidths[0];
      
      // Violation #
      doc.text(fine.violationNumber || 'N/A', xPos, yPos);
      xPos += colWidths[1];
      
      // Location
      const location = fine.location || 'Unknown';
      doc.text(location.length > 30 ? location.substring(0, 27) + '...' : location, xPos, yPos);
      xPos += colWidths[2];
      
      // Violation charge
      const charge = fine.violationCharge || 'N/A';
      doc.text(charge.length > 45 ? charge.substring(0, 42) + '...' : charge, xPos, yPos);
      xPos += colWidths[3];
      
      // Amount
      doc.text(formatCurrency(fine.fineAmount), xPos, yPos);
      xPos += colWidths[4];
      
      // Status
      if (fine.paymentStatus === 'paid') {
        doc.setTextColor(0, 128, 0); // Green color for paid
      } else {
        doc.setTextColor(220, 53, 69); // Red color for pending
      }
      
      doc.text(fine.paymentStatus === 'paid' ? 'Paid' : 'Pending', xPos, yPos);
      doc.setTextColor(0, 0, 0); // Reset text color
      
      yPos += 7;
    }
    
    // Add some space after each customer's section
    yPos += 5;
    doc.line(14, yPos - 2, 196, yPos - 2);
    yPos += 8;
  }
  
  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    await addReportFooter(doc);
  }
  
  return doc;
};
