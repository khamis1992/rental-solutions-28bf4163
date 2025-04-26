
export const generatePaymentHistoryPdf = (
  payments: PaymentHistoryRow[],
  title: string = "Payment History",
  dateRange: { from: Date | undefined; to: Date | undefined } = { from: undefined, to: undefined }
): jsPDF => {
  return generateStandardReport(title, dateRange, (doc, startY) => {
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

    // Add summary section
    doc.setFillColor(236, 239, 241); // Lighter gray for summary
    doc.roundedRect(14, startY, doc.internal.pageSize.getWidth() - 28, 30, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    
    const summaryY = startY + 10;
    doc.text("Total Amount:", 20, summaryY);
    doc.text(`QAR ${totals.total.toLocaleString()}`, 70, summaryY);
    
    doc.text("Base Amount:", 120, summaryY);
    doc.text(`QAR ${totals.baseAmount.toLocaleString()}`, 170, summaryY);
    
    doc.text("Late Fees:", 20, summaryY + 12);
    doc.text(`QAR ${totals.lateFees.toLocaleString()}`, 70, summaryY + 12);

    // Table header - Removed Due Date column
    const tableStartY = startY + 45;
    const headers = ["Description", "Amount", "Payment Date", "Late Fee", "Total"];
    const columnWidths = [45, 30, 30, 30, 30];
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
