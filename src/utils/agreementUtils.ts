
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { Agreement } from '@/lib/validation-schemas/agreement';

// Add the missing type definition for jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Generate a PDF document for an agreement
export const generatePdfDocument = async (agreement: Agreement): Promise<boolean> => {
  try {
    const doc = new jsPDF();
    
    // Add company header
    doc.setFontSize(18);
    doc.text('RENTAL AGREEMENT', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Agreement #: ${agreement.agreement_number || 'N/A'}`, 105, 30, { align: 'center' });
    
    // Add customer information
    doc.setFontSize(14);
    doc.text('Customer Information', 20, 40);
    doc.setFontSize(10);
    
    const customerInfo = [
      ['Name', agreement.customers?.full_name || 'N/A'],
      ['Email', agreement.customers?.email || 'N/A'],
      ['Phone', agreement.customers?.phone || agreement.customers?.phone_number || 'N/A'],
      ['Address', agreement.customers?.address || 'N/A'],
      ['ID/License', agreement.customers?.driver_license || 'N/A']
    ];
    
    doc.autoTable({
      startY: 45,
      head: [],
      body: customerInfo,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220] },
      styles: { overflow: 'linebreak', cellWidth: 'auto' },
      columnStyles: { 
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' }
      }
    });
    
    // Add vehicle information
    doc.setFontSize(14);
    doc.text('Vehicle Information', 20, doc.lastAutoTable.finalY + 15);
    doc.setFontSize(10);
    
    const vehicleInfo = [
      ['Make/Model', `${agreement.vehicles?.make || 'N/A'} ${agreement.vehicles?.model || ''}`],
      ['License Plate', agreement.vehicles?.license_plate || 'N/A'],
      ['Year', agreement.vehicles?.year?.toString() || 'N/A'],
      ['Color', agreement.vehicles?.color || 'N/A'],
      ['VIN', agreement.vehicles?.vin || 'N/A']
    ];
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [],
      body: vehicleInfo,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220] },
      styles: { overflow: 'linebreak', cellWidth: 'auto' },
      columnStyles: { 
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' }
      }
    });
    
    // Add agreement details
    doc.setFontSize(14);
    doc.text('Agreement Details', 20, doc.lastAutoTable.finalY + 15);
    doc.setFontSize(10);
    
    const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
    const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
    
    const agreementInfo = [
      ['Start Date', format(startDate, 'MMM d, yyyy')],
      ['End Date', format(endDate, 'MMM d, yyyy')],
      ['Status', agreement.status.toUpperCase()],
      ['Monthly Rate', `QAR ${agreement.rent_amount?.toLocaleString() || '0'}`],
      ['Total Amount', `QAR ${agreement.total_amount?.toLocaleString() || '0'}`],
      ['Deposit Amount', `QAR ${agreement.deposit_amount?.toLocaleString() || '0'}`],
      ['Late Fee (Daily)', `QAR ${agreement.daily_late_fee?.toLocaleString() || '0'}`],
    ];
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [],
      body: agreementInfo,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220] },
      styles: { overflow: 'linebreak', cellWidth: 'auto' },
      columnStyles: { 
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' }
      }
    });
    
    // Add notes if any
    if (agreement.notes) {
      doc.setFontSize(14);
      doc.text('Notes', 20, doc.lastAutoTable.finalY + 15);
      doc.setFontSize(10);
      doc.text(agreement.notes, 20, doc.lastAutoTable.finalY + 25, {
        maxWidth: 170
      });
    }
    
    // Add signature fields
    doc.setFontSize(14);
    doc.text('Signatures', 20, doc.lastAutoTable.finalY + 50);
    
    doc.line(20, doc.lastAutoTable.finalY + 70, 90, doc.lastAutoTable.finalY + 70);
    doc.text('Customer Signature', 20, doc.lastAutoTable.finalY + 80);
    
    doc.line(120, doc.lastAutoTable.finalY + 70, 190, doc.lastAutoTable.finalY + 70);
    doc.text('Company Signature', 120, doc.lastAutoTable.finalY + 80);
    
    // Save the PDF
    const filename = `Agreement_${agreement.agreement_number || agreement.id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};
