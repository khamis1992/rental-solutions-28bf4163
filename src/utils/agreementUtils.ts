
import { Agreement } from '@/lib/validation-schemas/agreement';
import jsPDF from 'jspdf';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';

export const generatePdfDocument = async (agreement: Agreement): Promise<boolean> => {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add company header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Rental Solutions', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Rental Agreement', 105, 30, { align: 'center' });
    
    // Add agreement details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Agreement: ${agreement.agreement_number}`, 20, 45);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Status
    doc.text(`Status: ${agreement.status.toUpperCase()}`, 20, 55);
    
    // Dates
    const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
    const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
    
    doc.text(`Rental Period: ${formatDate(startDate)} to ${formatDate(endDate)}`, 20, 65);
    
    // Customer information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information', 20, 80);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (agreement.customers) {
      doc.text(`Name: ${agreement.customers.full_name || 'N/A'}`, 20, 90);
      doc.text(`Email: ${agreement.customers.email || 'N/A'}`, 20, 100);
      doc.text(`Phone: ${agreement.customers.phone_number || 'N/A'}`, 20, 110);
    } else {
      doc.text('No customer information available', 20, 90);
    }
    
    // Vehicle information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Vehicle Information', 120, 80);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (agreement.vehicles) {
      doc.text(`Vehicle: ${agreement.vehicles.make} ${agreement.vehicles.model} (${agreement.vehicles.year})`, 120, 90);
      doc.text(`License Plate: ${agreement.vehicles.license_plate || 'N/A'}`, 120, 100);
      doc.text(`Color: ${agreement.vehicles.color || 'N/A'}`, 120, 110);
    } else {
      doc.text('No vehicle information available', 120, 90);
    }
    
    // Financial information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Details', 20, 130);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Monthly Rent: ${formatCurrency(agreement.total_amount || 0)}`, 20, 140);
    doc.text(`Deposit Amount: ${formatCurrency(agreement.deposit_amount || 0)}`, 20, 150);
    
    // Terms and conditions
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms and Conditions', 20, 170);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('1. The Lessee shall keep and maintain the vehicle in good working order and condition.', 20, 180);
    doc.text('2. The Lessee shall not use the vehicle for any illegal purposes.', 20, 185);
    doc.text('3. The Lessee shall be responsible for any traffic fines incurred during the rental period.', 20, 190);
    doc.text('4. The Lessee shall return the vehicle on the agreed date in the same condition as received.', 20, 195);
    doc.text('5. The Lessee shall be responsible for any damage to the vehicle beyond normal wear and tear.', 20, 200);
    
    // Signature section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Customer Signature: ______________________', 20, 220);
    doc.text('Date: ______________________', 20, 230);
    
    doc.text('Staff Signature: ______________________', 120, 220);
    doc.text('Date: ______________________', 120, 230);
    
    // Footer
    doc.setFontSize(8);
    doc.text('This document is automatically generated and does not require a physical signature.', 105, 280, { align: 'center' });
    
    // Save the PDF
    doc.save(`Agreement-${agreement.agreement_number}.pdf`);
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};

// Function to check if a standard template exists
export const checkStandardTemplateExists = async (): Promise<boolean> => {
  try {
    // This is a placeholder that would normally check for template existence
    return true;
  } catch (error) {
    console.error("Error checking template existence:", error);
    return false;
  }
};

// Function to diagnose template access
export const diagnosisTemplateAccess = async (): Promise<{exists: boolean; accessible: boolean}> => {
  try {
    // This is a placeholder function that would diagnose template access
    return {
      exists: true,
      accessible: true
    };
  } catch (error) {
    console.error("Error diagnosing template access:", error);
    return {
      exists: false,
      accessible: false
    };
  }
};
