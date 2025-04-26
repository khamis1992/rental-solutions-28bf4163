
import { Agreement } from '@/lib/validation-schemas/agreement';
import { format } from 'date-fns';
import { generateStandardReport } from './report-utils';
import { formatCurrency } from './utils';

export const generateAgreementReport = (
  agreement: Agreement,
  rentAmount: number | null,
  contractAmount: number | null,
  payments: any[] = []
) => {
  const doc = generateStandardReport(
    `Agreement Report - ${agreement.agreement_number}`,
    undefined,
    async (doc, startY) => {
      let currentY = startY;
      
      // Agreement Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('AGREEMENT INFORMATION', 20, currentY);
      currentY += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const agreementInfo = [
        `Agreement Number: ${agreement.agreement_number}`,
        `Status: ${agreement.status.toUpperCase()}`,
        `Start Date: ${format(new Date(agreement.start_date), 'dd/MM/yyyy')}`,
        `End Date: ${format(new Date(agreement.end_date), 'dd/MM/yyyy')}`,
        `Monthly Rent: ${formatCurrency(rentAmount || 0)}`,
        `Contract Total: ${formatCurrency(contractAmount || agreement.total_amount || 0)}`,
        `Deposit Amount: ${formatCurrency(agreement.deposit_amount || 0)}`
      ];
      
      agreementInfo.forEach(info => {
        doc.text(info, 20, currentY);
        currentY += 7;
      });
      
      currentY += 10;
      
      // Customer Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', 20, currentY);
      currentY += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (agreement.customers) {
        const customerInfo = [
          `Name: ${agreement.customers.full_name}`,
          `Email: ${agreement.customers.email || 'N/A'}`,
          `Phone: ${agreement.customers.phone_number || 'N/A'}`,
          `Driver License: ${agreement.customers.driver_license || 'N/A'}`,
          `Address: ${agreement.customers.address || 'N/A'}`
        ];
        
        customerInfo.forEach(info => {
          doc.text(info, 20, currentY);
          currentY += 7;
        });
      } else {
        doc.text('Customer information not available', 20, currentY);
        currentY += 7;
      }
      
      currentY += 10;
      
      // Vehicle Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('VEHICLE INFORMATION', 20, currentY);
      currentY += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (agreement.vehicles) {
        const vehicleInfo = [
          `Vehicle: ${agreement.vehicles.make} ${agreement.vehicles.model} (${agreement.vehicles.year || 'N/A'})`,
          `License Plate: ${agreement.vehicles.license_plate}`,
          `Color: ${agreement.vehicles.color || 'N/A'}`,
          `VIN: ${agreement.vehicles.vin || 'N/A'}`
        ];
        
        vehicleInfo.forEach(info => {
          doc.text(info, 20, currentY);
          currentY += 7;
        });
      } else {
        doc.text('Vehicle information not available', 20, currentY);
        currentY += 7;
      }
      
      currentY += 10;
      
      // Payment Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT SUMMARY', 20, currentY);
      currentY += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
      const totalLateFees = payments.reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0);
      const remainingBalance = (agreement.total_amount || 0) - totalPaid;
      
      const paymentSummary = [
        `Total Paid: ${formatCurrency(totalPaid)}`,
        `Late Fees: ${formatCurrency(totalLateFees)}`,
        `Remaining Balance: ${formatCurrency(remainingBalance)}`,
        `Next Payment Due: ${agreement.next_payment_date ? format(new Date(agreement.next_payment_date), 'dd/MM/yyyy') : 'N/A'}`
      ];
      
      paymentSummary.forEach(info => {
        doc.text(info, 20, currentY);
        currentY += 7;
      });
      
      return currentY;
    }
  );
  
  return doc;
};
