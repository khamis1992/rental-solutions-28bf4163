
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

// Interface for payment history row
interface PaymentHistoryRow {
  description: string;
  amount: number;
  dueDate?: string;
  paymentDate?: string | null;
  status?: string;
  lateFee: number;
  total: number;
}

/**
 * Generate a standard report with consistent styling and headers
 * @param title Title of the report
 * @param dateRange Optional date range for the report
 * @param contentRenderer Function to render the content of the report
 * @returns jsPDF document
 */
export const generateStandardReport = (
  title: string,
  dateRange: { from: Date | undefined; to: Date | undefined } = { from: undefined, to: undefined },
  contentRenderer: (doc: jsPDF, startY: number) => number
): jsPDF => {
  // Initialize PDF document
  const doc = new jsPDF();
  
  // Set document properties
  doc.setProperties({
    title: title,
    subject: 'Report',
    author: 'Alaraf Car Rental',
    creator: 'Alaraf Car Rental System'
  });
  
  // Set fonts and styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(44, 62, 80); // Dark blue text
  
  // Add title
  doc.text(title.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
  // Add date range if provided
  let dateText = `Generated on: ${format(new Date(), 'dd/MM/yyyy')}`;
  if (dateRange.from && dateRange.to) {
    dateText = `Period: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`;
  } else if (dateRange.from) {
    dateText = `From: ${format(dateRange.from, 'dd/MM/yyyy')}`;
  } else if (dateRange.to) {
    dateText = `To: ${format(dateRange.to, 'dd/MM/yyyy')}`;
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100); // Gray text
  doc.text(dateText, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  
  // Add company logo or watermark
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180); // Light gray text
  doc.text('ALARAF CAR RENTAL', doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });
  
  // Add horizontal line
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 35, doc.internal.pageSize.getWidth() - 20, 35);
  
  // Let the content renderer render the actual report content
  const endY = contentRenderer(doc, 45);
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    doc.text('CONFIDENTIAL - ALARAF CAR RENTAL', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
  }
  
  return doc;
};

export const generatePaymentHistoryPdf = (
  payments: PaymentHistoryRow[],
  title: string = "Payment History",
  dateRange: { from: Date | undefined; to: Date | undefined } = { from: undefined, to: undefined }
): jsPDF => {
  return generateStandardReport(title, dateRange, (doc, startY) => {
    // Initialize document in landscape orientation
    doc.setProperties({
      orientation: 'landscape'
    });
    
    // Set document styles
    doc.setFillColor(247, 250, 252); // Light blue-gray background
    doc.setTextColor(44, 62, 80); // Dark blue text
    doc.setFontSize(10);
    
    // Calculate totals for summary
    const totals = payments.reduce((acc, payment) => ({
      total: acc.total + payment.total,
      lateFees: acc.lateFees + payment.lateFee,
      baseAmount: acc.baseAmount + payment.amount
    }), { total: 0, lateFees: 0, baseAmount: 0 });

    // Add summary section with adjusted positioning for landscape
    doc.setFillColor(236, 239, 241); // Lighter gray for summary
    doc.roundedRect(14, startY, doc.internal.pageSize.getWidth() - 28, 30, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    
    const summaryY = startY + 10;
    doc.text("Total Amount:", 20, summaryY);
    doc.text(`QAR ${totals.total.toLocaleString()}`, 100, summaryY);
    
    doc.text("Base Amount:", 180, summaryY);
    doc.text(`QAR ${totals.baseAmount.toLocaleString()}`, 260, summaryY);
    
    doc.text("Late Fees:", 20, summaryY + 12);
    doc.text(`QAR ${totals.lateFees.toLocaleString()}`, 100, summaryY + 12);

    // Table header with adjusted column widths for landscape
    const tableStartY = startY + 45;
    const headers = ["Description", "Amount", "Payment Date", "Late Fee", "Total"];
    const columnWidths = [120, 40, 40, 40, 40]; // Increased Description column width
    doc.setFillColor(52, 73, 94); // Dark blue header
    
    let currentX = 14;
    headers.forEach((header, i) => {
      // Header background
      doc.setFillColor(52, 73, 94);
      doc.roundedRect(currentX, tableStartY, columnWidths[i], 12, 1, 1, 'F');
      
      // Header text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(header, currentX + 2, tableStartY + 8);
      currentX += columnWidths[i];
    });

    // Table rows
    let currentY = tableStartY + 12;
    doc.setTextColor(44, 62, 80);
    doc.setFont("helvetica", "normal");

    payments.forEach((payment, index) => {
      if (currentY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        currentY = 20;
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(247, 250, 252);
        doc.rect(14, currentY, doc.internal.pageSize.getWidth() - 28, 10, 'F');
      }

      currentX = 14;
      const row = [
        payment.description,
        `QAR ${payment.amount.toLocaleString()}`,
        payment.paymentDate || 'Pending',
        payment.lateFee > 0 ? `QAR ${payment.lateFee.toLocaleString()}` : '-',
        `QAR ${payment.total.toLocaleString()}`
      ];

      row.forEach((cell, i) => {
        const textColor = i === 3 && payment.lateFee > 0 ? '#e74c3c' : '#2c3e50';
        doc.setTextColor(textColor);
        doc.text(cell, currentX + 2, currentY + 7);
        currentX += columnWidths[i];
      });

      // Add subtle line between rows
      doc.setDrawColor(236, 239, 241);
      doc.line(14, currentY + 10, doc.internal.pageSize.getWidth() - 14, currentY + 10);

      currentY += 10;
    });

    // Add footer note
    const footerY = currentY + 15;
    doc.setFontSize(9);
    doc.setTextColor(127, 140, 141);
    doc.text("* All amounts are in QAR (Qatari Riyal)", 14, footerY);
    
    return footerY;
  });
};

