
import { jsPDF } from 'jspdf';
import { TrafficFine } from '@/hooks/use-traffic-fines';
import { addReportHeader, addReportFooter } from '@/utils/report-utils';
import { formatDate } from '@/lib/date-utils';

/**
 * Generates a CSV format string from traffic fines data
 */
export const generateTrafficFinesCSV = (fines: TrafficFine[]): string => {
  if (!fines || fines.length === 0) return '';
  
  // Define CSV header
  const headers = [
    'Violation Number',
    'License Plate',
    'Vehicle Model',
    'Violation Date',
    'Location',
    'Fine Amount',
    'Status',
    'Customer Name',
    'Payment Date'
  ];
  
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  fines.forEach(fine => {
    const row = [
      `"${fine.violationNumber || ''}"`,
      `"${fine.licensePlate || ''}"`,
      `"${fine.vehicleModel || ''}"`,
      `"${formatDate(fine.violationDate)}"`,
      `"${fine.location || ''}"`,
      `${fine.fineAmount || 0}`,
      `"${fine.paymentStatus || 'pending'}"`,
      `"${fine.customerName || 'Unassigned'}"`,
      `"${fine.paymentDate ? formatDate(fine.paymentDate) : ''}"`
    ];
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
};

/**
 * Generates a PDF document for traffic fines
 */
export const generateTrafficFinesPDF = async (fines: TrafficFine[]): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add header
  const startY = await addReportHeader(doc, 'Traffic Fines Report', { 
    from: fines.length > 0 ? new Date(Math.min(...fines.map(f => new Date(f.violationDate).getTime()))) : undefined,
    to: new Date()
  });
  
  let currentY = startY + 10;
  
  // Group fines by customer
  const finesByCustomer: { [key: string]: TrafficFine[] } = {};
  fines.forEach(fine => {
    const customerId = fine.customerId || 'unassigned';
    if (!finesByCustomer[customerId]) {
      finesByCustomer[customerId] = [];
    }
    finesByCustomer[customerId].push(fine);
  });
  
  // Add summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, currentY);
  currentY += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Fines: ${fines.length}`, 14, currentY);
  currentY += 5;
  
  const paidFines = fines.filter(f => f.paymentStatus === 'paid').length;
  const pendingFines = fines.filter(f => f.paymentStatus === 'pending').length;
  const disputedFines = fines.filter(f => f.paymentStatus === 'disputed').length;
  const totalAmount = fines.reduce((sum, f) => sum + f.fineAmount, 0);
  
  doc.text(`Paid: ${paidFines}  |  Pending: ${pendingFines}  |  Disputed: ${disputedFines}`, 14, currentY);
  currentY += 5;
  
  doc.text(`Total Amount: ${new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'QAR'
  }).format(totalAmount)}`, 14, currentY);
  currentY += 15;
  
  // Add fines grouped by customer
  Object.entries(finesByCustomer).forEach(([customerId, customerFines]) => {
    // Check if we need to add a new page
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    const customerName = customerFines[0].customerName || 'Unassigned Fines';
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Customer: ${customerName}`, 14, currentY);
    currentY += 7;
    
    // Add table header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    const colWidths = [25, 20, 25, 30, 20, 20, 25];
    const headers = ['Violation #', 'License', 'Date', 'Location', 'Amount', 'Status', 'Payment Date'];
    
    let xPos = 14;
    headers.forEach((header, i) => {
      doc.text(header, xPos, currentY);
      xPos += colWidths[i];
    });
    
    currentY += 5;
    doc.line(14, currentY - 2, pageWidth - 14, currentY - 2);
    
    // Add table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    customerFines.forEach(fine => {
      // Check if we need to add a new page
      if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        currentY = 20;
        
        // Re-add table header on new page
        xPos = 14;
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, i) => {
          doc.text(header, xPos, currentY);
          xPos += colWidths[i];
        });
        
        currentY += 5;
        doc.line(14, currentY - 2, pageWidth - 14, currentY - 2);
        doc.setFont('helvetica', 'normal');
      }
      
      xPos = 14;
      
      // Violation number
      doc.text(fine.violationNumber || '', xPos, currentY);
      xPos += colWidths[0];
      
      // License plate
      doc.text(fine.licensePlate || '', xPos, currentY);
      xPos += colWidths[1];
      
      // Date
      doc.text(formatDate(fine.violationDate), xPos, currentY);
      xPos += colWidths[2];
      
      // Location (truncate if needed)
      const location = fine.location || 'N/A';
      doc.text(location.length > 15 ? location.substring(0, 13) + '...' : location, xPos, currentY);
      xPos += colWidths[3];
      
      // Amount
      doc.text(fine.fineAmount.toString(), xPos, currentY);
      xPos += colWidths[4];
      
      // Status
      doc.text(fine.paymentStatus, xPos, currentY);
      xPos += colWidths[5];
      
      // Payment date
      doc.text(fine.paymentDate ? formatDate(fine.paymentDate) : '-', xPos, currentY);
      
      currentY += 5;
    });
    
    // Add customer total
    const customerTotal = customerFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
    currentY += 3;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'QAR'
    }).format(customerTotal)}`, pageWidth - 60, currentY);
    
    currentY += 15;
  });
  
  // Add footer
  await addReportFooter(doc);
  
  return doc;
};
