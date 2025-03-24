import { jsPDF } from 'jspdf';
import { CustomerObligation } from '@/components/legal/CustomerLegalObligations';
import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a legal report PDF for a customer with all their financial/legal obligations
 */
export const generateLegalCustomerReport = async (
  customerId: string,
  customerName: string,
  obligations: CustomerObligation[]
): Promise<jsPDF> => {
  let customer = null;
  
  try {
    // Fetch customer details
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (error) {
      console.error("Error fetching customer details:", error);
    } else {
      customer = data;
    }
  } catch (error) {
    console.error("Error fetching customer details:", error);
  }
  
  // Initialize the PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add header with logo only
  const logoPath = '/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png';
  
  // Add logo centered at the top
  doc.addImage(logoPath, 'PNG', (pageWidth - 40) / 2, 10, 40, 15);
  
  // Add a separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 30, pageWidth - 14, 30);
  
  // Add title and header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("LEGAL OBLIGATIONS REPORT", pageWidth / 2, 45, { align: "center" });
  
  // Add report date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 53, { align: "center" });
  
  // Add customer information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Customer Information", 14, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 75;
  doc.text(`Name: ${customerName}`, 14, yPos); yPos += 7;
  
  if (customer) {
    if (customer.email) {
      doc.text(`Email: ${customer.email}`, 14, yPos); yPos += 7;
    }
    if (customer.phone_number) {
      doc.text(`Phone: ${customer.phone_number}`, 14, yPos); yPos += 7;
    }
    if (customer.driver_license) {
      doc.text(`Driver License: ${customer.driver_license}`, 14, yPos); yPos += 7;
    }
  }
  
  // Add summary of obligations
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary of Obligations", 14, yPos);
  yPos += 10;
  
  // Group by type of obligation for the summary
  const summaryByType: Record<string, { count: number, totalAmount: number }> = {};
  
  obligations.forEach(obligation => {
    const type = obligation.obligationType || 'other';
    if (!summaryByType[type]) {
      summaryByType[type] = { 
        count: 0, 
        totalAmount: 0 
      };
    }
    summaryByType[type].count += 1;
    summaryByType[type].totalAmount += obligation.amount;
  });
  
  // Calculate total owed
  const totalOwed = obligations.reduce((sum, obligation) => sum + obligation.amount, 0);
  
  // Display summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const typeLabels: Record<string, string> = {
    payment: 'Overdue Payments',
    traffic_fine: 'Traffic Fines',
    legal_case: 'Legal Cases',
    other: 'Other Obligations'
  };
  
  for (const [type, data] of Object.entries(summaryByType)) {
    doc.text(`${typeLabels[type] || type}: ${data.count} (Total: ${formatCurrency(data.totalAmount)})`, 14, yPos);
    yPos += 7;
  }
  
  // Add total amount
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Amount Owed: ${formatCurrency(totalOwed)}`, 14, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 15;
  
  // Add detailed breakdown of obligations
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Detailed Obligations", 14, yPos);
  yPos += 10;
  
  // Group obligations by type for detailed section
  const obligationsByType: Record<string, CustomerObligation[]> = {};
  
  obligations.forEach(obligation => {
    const type = obligation.obligationType || 'other';
    if (!obligationsByType[type]) {
      obligationsByType[type] = [];
    }
    obligationsByType[type].push(obligation);
  });
  
  // Add each type of obligation
  doc.setFontSize(10);
  
  for (const [type, typeObligations] of Object.entries(obligationsByType)) {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
      
      // Add header with logo to new page (no text)
      doc.addImage(logoPath, 'PNG', (pageWidth - 40) / 2, 10, 40, 15);
      
      // Add a separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 30, pageWidth - 14, 30);
    }
    
    // Add section header for this type
    doc.setFont('helvetica', 'bold');
    doc.text(`${typeLabels[type] || type}`, 14, yPos);
    yPos += 7;
    
    // Add column headers
    const startX = 14;
    doc.text("Description", startX, yPos);
    doc.text("Due Date", startX + 90, yPos);
    doc.text("Days Overdue", startX + 130, yPos);
    doc.text("Amount", startX + 170, yPos);
    yPos += 5;
    
    // Add a separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(startX, yPos, startX + 180, yPos);
    yPos += 5;
    
    // Add each obligation
    doc.setFont('helvetica', 'normal');
    typeObligations.forEach(obligation => {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
        
        // Add header with logo to new page (no text)
        doc.addImage(logoPath, 'PNG', (pageWidth - 40) / 2, 10, 40, 15);
        
        // Add a separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 30, pageWidth - 14, 30);
        
        // Add column headers on new page
        doc.setFont('helvetica', 'bold');
        doc.text("Description", startX, yPos);
        doc.text("Due Date", startX + 90, yPos);
        doc.text("Days Overdue", startX + 130, yPos);
        doc.text("Amount", startX + 170, yPos);
        yPos += 5;
        
        // Add a separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(startX, yPos, startX + 180, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
      }
      
      // Description text might be long, so we need to handle wrapping
      const description = obligation.description || '';
      if (description.length > 45) {
        const firstLine = description.substring(0, 45) + '...';
        doc.text(firstLine, startX, yPos);
      } else {
        doc.text(description, startX, yPos);
      }
      
      // Add other fields
      const dueDate = obligation.dueDate ? new Date(obligation.dueDate).toLocaleDateString() : 'N/A';
      doc.text(dueDate, startX + 90, yPos);
      doc.text(obligation.daysOverdue?.toString() || '0', startX + 130, yPos);
      doc.text(formatCurrency(obligation.amount), startX + 170, yPos);
      
      yPos += 7;
    });
    
    yPos += 10;
  }
  
  // Add legal notice and next steps
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
    
    // Add header with logo to new page (no text)
    doc.addImage(logoPath, 'PNG', (pageWidth - 40) / 2, 10, 40, 15);
    
    // Add a separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 30, pageWidth - 14, 30);
  }
  
  yPos += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Important Information", 14, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const legalNotice = [
    "1. This report is a comprehensive summary of all financial and legal obligations as of the report date.",
    "2. All amounts are due immediately unless a payment plan has been established.",
    "3. Failure to address overdue payments may result in additional fees and legal action.",
    "4. If you believe there is an error in this report, please contact our office immediately.",
    "5. For questions or to establish a payment plan, please contact our financial department."
  ];
  
  legalNotice.forEach(line => {
    doc.text(line, 14, yPos);
    yPos += 7;
  });
  
  // Add contact information
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("Contact Information:", 14, yPos);
  yPos += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.text("Financial Department: finance@yourcompany.com | +974 XXXX XXXX", 14, yPos);
  yPos += 7;
  doc.text("Legal Department: legal@yourcompany.com | +974 XXXX XXXX", 14, yPos);
  
  // Add the footer with company info and logo to each page
  const footerLogoPath = '/lovable-uploads/f81bdd9a-0bfe-4a23-9690-2b9104df3642.png';
  
  // Add footer with page numbers and footer image
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Add footer text first
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("© 2024 ALARAF CAR RENTAL", pageWidth / 2, pageHeight - 40, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("Quality Service, Premium Experience", pageWidth / 2, pageHeight - 35, { align: 'center' });
    
    // Add the footer image below the text
    doc.addImage(footerLogoPath, 'PNG', 15, pageHeight - 30, pageWidth - 30, 12);
    
    // Add page number
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('CONFIDENTIAL', 14, pageHeight - 10);
    doc.text(new Date().toLocaleDateString(), pageWidth - 14, pageHeight - 10, { align: 'right' });
  }
  
  return doc;
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2
  }).format(amount);
};
