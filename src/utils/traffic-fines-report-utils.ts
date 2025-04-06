
import { jsPDF } from 'jspdf';
import { TrafficFine } from '@/hooks/use-traffic-fines';
import { addReportHeader, addReportFooter } from '@/utils/report-utils';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';

/**
 * Generates a CSV format string from traffic fines data
 */
export const generateTrafficFinesCSV = (fines: TrafficFine[]): string => {
  if (!fines || fines.length === 0) return '';
  
  // Filter fines to only include those assigned to customers
  const assignedFines = fines.filter(fine => fine.customerId);
  
  if (assignedFines.length === 0) return '';
  
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
  assignedFines.forEach(fine => {
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
  // Filter fines to only include those assigned to customers
  const assignedFines = fines.filter(fine => fine.customerId);
  
  // Create PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Define some custom colors for better aesthetics
  const primaryColor = "#9b87f5";
  const secondaryColor = "#7E69AB";
  const textColor = "#1A1F2C";
  const highlightColor = "#D6BCFA";
  const pendingColor = "#FEF7CD";
  const paidColor = "#F2FCE2";
  const disputedColor = "#FFDEE2";
  
  // Add header with enhanced styling
  const startY = await addReportHeader(doc, 'Traffic Fines Report', { 
    from: assignedFines.length > 0 ? new Date(Math.min(...assignedFines.map(f => new Date(f.violationDate).getTime()))) : undefined,
    to: new Date()
  });
  
  let currentY = startY + 15;
  
  // Group fines by customer for better organization
  const finesByCustomer: { [key: string]: TrafficFine[] } = {};
  assignedFines.forEach(fine => {
    const customerId = fine.customerId || 'unassigned';
    if (!finesByCustomer[customerId]) {
      finesByCustomer[customerId] = [];
    }
    finesByCustomer[customerId].push(fine);
  });
  
  // If there are no fines, show a message
  if (assignedFines.length === 0) {
    currentY += 10;
    doc.setFontSize(12);
    doc.text("No traffic fines found for the selected period.", pageWidth/2, currentY, { align: 'center' });
    
    // Add footer and return
    await addReportFooter(doc);
    return doc;
  }
  
  // Process each customer's fines
  Object.entries(finesByCustomer).forEach(([customerId, customerFines], index) => {
    // Check if we need to add a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }
    
    const customerName = customerFines[0].customerName || 'Unassigned Fines';
    
    // Style customer header with alternating colors
    doc.setFillColor(index % 2 === 0 ? secondaryColor : primaryColor);
    doc.rect(14, currentY - 5, pageWidth - 28, 10, 'F');
    
    // Customer name
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White for contrast
    doc.text(`Customer: ${customerName}`, 20, currentY + 2);
    
    // Add vehicle info if available
    const uniquePlates = [...new Set(customerFines.map(f => f.licensePlate))].filter(Boolean);
    if (uniquePlates.length > 0) {
      doc.setTextColor(255, 255, 255);
      doc.text(`Vehicles: ${uniquePlates.join(', ')}`, pageWidth - 20, currentY + 2, { align: 'right' });
    }
    
    currentY += 10;
    doc.setTextColor(textColor); // Reset text color
    
    // Add table header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Define column settings - REMOVED Location column as requested
    const columns = [
      { header: 'Violation #', width: 35 },
      { header: 'Date', width: 30 },
      { header: 'Amount', width: 30, align: 'right' as const },
      { header: 'Status', width: 30, align: 'center' as const },
      { header: 'Payment Date', width: 35, align: 'center' as const }
    ];
    
    // Calculate positions
    let xPos = 15;
    const colPositions = columns.map(col => {
      const pos = xPos;
      xPos += col.width;
      return pos;
    });
    
    // Draw header background
    doc.setFillColor(245, 245, 245);
    doc.rect(14, currentY - 3, pageWidth - 28, 8, 'F');
    
    // Draw header text
    columns.forEach((col, i) => {
      const align = col.align || 'left';
      doc.text(col.header, 
        align === 'right' ? colPositions[i] + col.width - 2 : 
        align === 'center' ? colPositions[i] + col.width/2 : 
        colPositions[i] + 1, 
        currentY + 1,
        { align });
    });
    
    currentY += 8;
    
    // Draw a line under the header
    doc.setDrawColor(200, 200, 200);
    doc.line(14, currentY - 2, pageWidth - 14, currentY - 2);
    
    // Add table rows with alternating background
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Calculate customer totals
    const customerTotal = customerFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
    const customerPaidFines = customerFines.filter(f => f.paymentStatus === 'paid').length;
    const customerPendingFines = customerFines.filter(f => f.paymentStatus === 'pending').length;
    
    // Increased row height for more spacing between rows (from 6 to 12 for better spacing)
    const rowHeight = 12;
    
    // Customer fine details with alternating row colors and status highlighting
    customerFines.forEach((fine, fineIndex) => {
      // Check if we need to add a new page
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
        
        // Re-add column headers on new page
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        // Draw header background
        doc.setFillColor(245, 245, 245);
        doc.rect(14, currentY - 3, pageWidth - 28, 8, 'F');
        
        // Draw header text
        columns.forEach((col, i) => {
          const align = col.align || 'left';
          doc.text(col.header, 
            align === 'right' ? colPositions[i] + col.width - 2 : 
            align === 'center' ? colPositions[i] + col.width/2 : 
            colPositions[i] + 1, 
            currentY + 1,
            { align });
        });
        
        currentY += 8;
        
        // Draw a line under the header
        doc.setDrawColor(200, 200, 200);
        doc.line(14, currentY - 2, pageWidth - 14, currentY - 2);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }
      
      // Row background (alternating)
      if (fineIndex % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(14, currentY - 3, pageWidth - 28, rowHeight, 'F');
      }
      
      // Highlight status with color for better visual cues
      let statusFill;
      switch(fine.paymentStatus) {
        case 'paid':
          statusFill = paidColor;
          break;
        case 'disputed':
          statusFill = disputedColor;
          break;
        default:
          statusFill = pendingColor;
      }
      
      // Draw status background
      const statusColIndex = 3; // Updated index since we removed location
      doc.setFillColor(statusFill);
      doc.rect(
        colPositions[statusColIndex], 
        currentY - 3, 
        columns[statusColIndex].width, 
        rowHeight, 
        'F'
      );
      
      // Draw table cell data
      // Violation number
      doc.text(fine.violationNumber || '', colPositions[0] + 1, currentY + 2);
      
      // Date
      doc.text(formatDate(fine.violationDate), colPositions[1] + 1, currentY + 2);
      
      // Amount (right-aligned)
      doc.text(
        formatCurrency(fine.fineAmount), 
        colPositions[2] + columns[2].width - 2, 
        currentY + 2, 
        { align: 'right' }
      );
      
      // Status (center-aligned)
      doc.text(
        fine.paymentStatus, 
        colPositions[3] + columns[3].width/2, 
        currentY + 2, 
        { align: 'center' }
      );
      
      // Payment date (center-aligned)
      doc.text(
        fine.paymentDate ? formatDate(fine.paymentDate) : '-', 
        colPositions[4] + columns[4].width/2, 
        currentY + 2, 
        { align: 'center' }
      );
      
      // Increase current Y position by row height
      currentY += rowHeight;
    });
    
    // Add customer total with styled background
    currentY += 2;
    doc.setFillColor(highlightColor);
    doc.rect(pageWidth - 80, currentY - 3, 66, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Total: ${formatCurrency(customerTotal)} (${customerPaidFines} paid, ${customerPendingFines} pending)`, 
      pageWidth - 16, 
      currentY + 2, 
      { align: 'right' }
    );
    
    currentY += 15; // Space between customer sections
  });
  
  // Final notes section
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 10;
  }
  
  // Final notes section
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text("Notes:", 14, currentY);
  currentY += 5;
  doc.text("1. All traffic fines should be addressed within 30 days of receipt.", 16, currentY);
  currentY += 5;
  doc.text("2. Disputed fines require supporting documentation and review.", 16, currentY);
  currentY += 5;
  doc.text("3. For questions regarding this report, please contact the traffic fines department.", 16, currentY);
  
  // Add a page number to each page
  const totalPages = doc.getNumberOfPages();
  for(let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
  }
  
  // Add footer with company information
  await addReportFooter(doc);
  
  return doc;
};
