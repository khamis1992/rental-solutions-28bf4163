import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

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
  const doc = new jsPDF();
  
  doc.setProperties({
    title: title,
    subject: 'Report',
    author: 'Alaraf Car Rental',
    creator: 'Alaraf Car Rental System'
  });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(44, 62, 80);
  
  doc.text(title.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
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
  doc.setTextColor(100, 100, 100);
  doc.text(dateText, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('ALARAF CAR RENTAL', doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });
  
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 35, doc.internal.pageSize.getWidth() - 20, 35);
  
  const endY = contentRenderer(doc, 45);
  
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
  title: string = "Invoice",
  dateRange: { from: Date | undefined; to: Date | undefined } = { from: undefined, to: undefined }
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm'
  });
  
  doc.setProperties({
    title: title,
    subject: 'Invoice',
    author: 'Alaraf Car Rental',
    creator: 'Alaraf Car Rental System'
  });
  
  doc.setFontSize(24);
  doc.setTextColor(44, 62, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('ALARAF CAR RENTAL', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text([
    'P.O. Box 12345, Doha, Qatar',
    'Tel: +974 4444 5555',
    'Email: info@alarafcarrental.com',
    'Website: www.alarafcarrental.com'
  ], 20, 30);
  
  doc.setTextColor(44, 62, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', doc.internal.pageSize.getWidth() - 60, 20);
  
  const today = format(new Date(), 'dd/MM/yyyy');
  doc.setFont('helvetica', 'normal');
  doc.text([
    `Date: ${today}`,
    `Invoice #: INV-${Math.floor(Math.random() * 10000)}`,
    `Due Date: ${format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}`
  ], doc.internal.pageSize.getWidth() - 60, 30);
  
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 50, doc.internal.pageSize.getWidth() - 20, 50);
  
  const totals = payments.reduce((acc, payment) => ({
    total: acc.total + payment.total,
    lateFees: acc.lateFees + payment.lateFee,
    baseAmount: acc.baseAmount + payment.amount
  }), { total: 0, lateFees: 0, baseAmount: 0 });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLING SUMMARY', 20, 65);
  
  const summaryY = 75;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text([
    'Base Amount:',
    'Late Fees:',
    'Total Amount Due:'
  ], 20, summaryY);
  
  doc.setFont('helvetica', 'bold');
  doc.text([
    `QAR ${totals.baseAmount.toLocaleString()}`,
    `QAR ${totals.lateFees.toLocaleString()}`,
    `QAR ${totals.total.toLocaleString()}`
  ], 80, summaryY);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', 20, 100);
  
  const headers = ['Description', 'Due Date', 'Amount', 'Late Fee', 'Total'];
  const columnWidths = [120, 35, 35, 35, 35];
  let currentY = 110;
  
  doc.setFillColor(247, 250, 252);
  doc.rect(20, currentY - 5, doc.internal.pageSize.getWidth() - 40, 10, 'F');
  
  doc.setTextColor(44, 62, 80);
  doc.setFontSize(10);
  let currentX = 20;
  headers.forEach((header, i) => {
    doc.text(header, currentX, currentY);
    currentX += columnWidths[i];
  });
  
  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  
  payments.forEach((payment, index) => {
    if (currentY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      currentY = 20;
    }
    
    if (index % 2 === 1) {
      doc.setFillColor(252, 252, 252);
      doc.rect(20, currentY - 5, doc.internal.pageSize.getWidth() - 40, 10, 'F');
    }
    
    currentX = 20;
    const row = [
      payment.description,
      payment.dueDate || '-',
      `QAR ${payment.amount.toLocaleString()}`,
      payment.lateFee > 0 ? `QAR ${payment.lateFee.toLocaleString()}` : '-',
      `QAR ${payment.total.toLocaleString()}`
    ];
    
    row.forEach((cell, i) => {
      doc.text(cell, currentX, currentY);
      currentX += columnWidths[i];
    });
    
    currentY += 10;
  });
  
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const pageText = `Page ${i} of ${pageCount}`;
    doc.text(pageText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    
    if (i === pageCount) {
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Terms:', 20, doc.internal.pageSize.getHeight() - 30);
      doc.setFont('helvetica', 'normal');
      doc.text([
        '1. Payment is due within 30 days of invoice date',
        '2. Please include invoice number in payment reference',
        '3. Late payments are subject to additional fees'
      ], 20, doc.internal.pageSize.getHeight() - 25);
    }
    
    doc.text('CONFIDENTIAL - ALARAF CAR RENTAL', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
  }
  
  return doc;
};
