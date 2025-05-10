
import { Agreement } from '@/lib/validation-schemas/agreement';
import { format } from 'date-fns';
import { generateStandardReport } from './report-utils';
import { formatCurrency } from '@/lib/utils';

export const generateAgreementReport = (
  agreement: Agreement,
  rentAmount: number | null,
  contractAmount: number | null,
  payments: any[] = []
) => {
  const doc = generateStandardReport(
    `AGREEMENT REPORT - ${agreement.agreement_number}`,
    undefined,
    async (doc, startY) => {
      let currentY = startY;
      
      // Set text color to navy blue for all sections
      doc.setTextColor(0, 51, 102);
      
      // Agreement Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('AGREEMENT INFORMATION', 20, currentY);
      currentY += 10;
      
      // Draw a table for agreement information
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY, doc.internal.pageSize.getWidth() - 40, 70, 'FD');
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Left column
      let leftX = 30;
      let rightX = 105;
      let itemHeight = 12;
      
      // Agreement information in two columns
      doc.setFont('helvetica', 'bold');
      doc.text('Agreement Number:', leftX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(agreement.agreement_number || 'N/A', leftX + 40, currentY);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', rightX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(agreement.status.toUpperCase(), rightX + 25, currentY);
      currentY += itemHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Start Date:', leftX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(format(new Date(agreement.start_date), 'dd/MM/yyyy'), leftX + 40, currentY);
      
      doc.setFont('helvetica', 'bold');
      doc.text('End Date:', rightX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(format(new Date(agreement.end_date), 'dd/MM/yyyy'), rightX + 25, currentY);
      currentY += itemHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Rent:', leftX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(rentAmount || 0), leftX + 40, currentY);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Contract Total:', rightX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(contractAmount || agreement.total_amount || 0), rightX + 40, currentY);
      currentY += itemHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Deposit Amount:', leftX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(agreement.deposit_amount || 0), leftX + 40, currentY);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Rent Due Day:', rightX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(agreement.rent_due_day?.toString() || '1', rightX + 40, currentY);
      
      // Advance Y position to after the table
      currentY += 45;
      
      // Customer Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', 20, currentY);
      currentY += 10;
      
      // Draw a table for customer information
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY, doc.internal.pageSize.getWidth() - 40, 70, 'FD');
      currentY += 10;
      
      doc.setFontSize(10);
      
      // If customer info is available, display it
      if (agreement.customers) {
        // Left column
        doc.setFont('helvetica', 'bold');
        doc.text('Name:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(agreement.customers.full_name || 'This should be filled by the system', leftX + 40, currentY);
        currentY += itemHeight;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Email:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(agreement.customers.email || 'This should be filled by the system', leftX + 40, currentY);
        currentY += itemHeight;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Phone:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(agreement.customers.phone_number || 'This should be filled by the system', leftX + 40, currentY);
        currentY += itemHeight;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Address:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(agreement.customers.address || 'This should be blank', leftX + 40, currentY);
        
        // Right column
        const rightStartY = currentY - (itemHeight * 3);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Driver License:', rightX, rightStartY);
        doc.setFont('helvetica', 'normal');
        doc.text(agreement.customers.driver_license || 'This should be blank', rightX + 40, rightStartY);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Nationality:', rightX, rightStartY + itemHeight);
        doc.setFont('helvetica', 'normal');
        doc.text(agreement.customers.nationality || 'This should be blank', rightX + 40, rightStartY + itemHeight);
      } else {
        doc.text('Customer information not available', 30, currentY);
      }
      
      // Advance Y position to after the table
      currentY += 45;
      
      // Vehicle Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('VEHICLE INFORMATION', 20, currentY);
      currentY += 10;
      
      // Draw a table for vehicle information
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY, doc.internal.pageSize.getWidth() - 40, 70, 'FD');
      currentY += 10;
      
      doc.setFontSize(10);
      
      // If vehicle info is available, display it
      if (agreement.vehicles) {
        // Left column
        doc.setFont('helvetica', 'bold');
        doc.text('Make/Model:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${agreement.vehicles.make || 'N/A'} ${agreement.vehicles.model || 'N/A'}`, leftX + 40, currentY);
        
        // Right column
        doc.setFont('helvetica', 'bold');
        doc.text('Year:', rightX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(agreement.vehicles.year?.toString() || 'N/A', rightX + 25, currentY);
        currentY += itemHeight;
        
        doc.setFont('helvetica', 'bold');
        doc.text('License Plate:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(agreement.vehicles.license_plate || 'N/A', leftX + 40, currentY);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Color:', rightX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(agreement.vehicles.color || 'N/A', rightX + 25, currentY);
        currentY += itemHeight;
        
        doc.setFont('helvetica', 'bold');
        doc.text('VIN:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(agreement.vehicles.vin || 'N/A', leftX + 40, currentY);
      } else {
        doc.text('Vehicle information not available', 30, currentY);
      }
      
      // Advance Y position to after the table
      currentY += 45;
      
      // Payment Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT SUMMARY', 20, currentY);
      currentY += 10;
      
      // Draw a table for payment summary
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY, doc.internal.pageSize.getWidth() - 40, 70, 'FD');
      currentY += 10;
      
      doc.setFontSize(10);
      
      // Calculate payment summary
      const totalPaid = payments.filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + (payment.amount_paid || payment.amount || 0), 0);
        
      const totalLateFees = payments
        .reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0);
        
      const remainingBalance = (contractAmount || agreement.total_amount || 0) - totalPaid;
      
      const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'partially_paid')
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);
      
      // Left column - Payment details
      doc.setFont('helvetica', 'bold');
      doc.text('Total Paid:', leftX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(totalPaid), leftX + 40, currentY);
      
      // Right column - Payment details
      doc.setFont('helvetica', 'bold');
      doc.text('Late Fees:', rightX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(totalLateFees), rightX + 40, currentY);
      currentY += itemHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Remaining Balance:', leftX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(remainingBalance), leftX + 40, currentY);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Pending Payments:', rightX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(pendingPayments), rightX + 40, currentY);
      currentY += itemHeight;
      
      // Add next payment date if available
      if (agreement.next_payment_date) {
        doc.setFont('helvetica', 'bold');
        doc.text('Next Payment Due:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(format(new Date(agreement.next_payment_date), 'dd/MM/yyyy'), leftX + 40, currentY);
      }
      
      // Add traffic fines placeholder as shown in the image
      doc.setFont('helvetica', 'bold');
      doc.text('Traffic Fines:', rightX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text('QAR 0.00', rightX + 40, currentY);
      
      return currentY + 45; // Return the final Y position
    }
  );
  
  return doc;
};
