
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
  let customerVehicles = [];
  
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
    
    // Fetch vehicles associated with the customer through leases
    const { data: leasesData, error: leasesError } = await supabase
      .from('leases')
      .select(`
        vehicle_id,
        vehicles (
          id,
          make,
          model,
          year,
          color,
          license_plate,
          vin,
          status
        )
      `)
      .eq('customer_id', customerId);
    
    if (leasesError) {
      console.error("Error fetching customer vehicles:", leasesError);
    } else if (leasesData) {
      // Extract unique vehicles from leases
      const vehicleMap = new Map();
      leasesData.forEach(lease => {
        if (lease.vehicles && !vehicleMap.has(lease.vehicles.id)) {
          vehicleMap.set(lease.vehicles.id, lease.vehicles);
        }
      });
      customerVehicles = Array.from(vehicleMap.values());
    }
  } catch (error) {
    console.error("Error fetching customer details:", error);
  }
  
  // Initialize the PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Define a function to add consistent header to each page
  const addPageHeader = (doc: jsPDF) => {
    // Add logo on the left at the top
    const logoPath = '/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png';
    doc.addImage(logoPath, 'PNG', 14, 10, 40, 15);
    
    // Add a separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 30, pageWidth - 14, 30);
    
    return 50; // Return the starting y-position for content after header
  };
  
  // Add header to first page and get starting y-position
  let startY = addPageHeader(doc);
  
  // Add title and header with consistent spacing
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("LEGAL OBLIGATIONS REPORT", pageWidth / 2, startY, { align: "center" });
  
  // Add report date with consistent spacing
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, startY + 8, { align: "center" });
  
  // Add customer information with consistent spacing
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Customer Information", 14, startY + 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = startY + 30;
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
  
  // Add vehicle information section
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Vehicle Information", 14, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (customerVehicles && customerVehicles.length > 0) {
    customerVehicles.forEach((vehicle, index) => {
      // Check if we need a new page for vehicle info
      if (yPos > 250) {
        doc.addPage();
        yPos = addPageHeader(doc);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Vehicle Information (continued)", 14, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      }
      
      doc.text(`Vehicle ${index + 1}:`, 14, yPos); yPos += 7;
      doc.text(`Make: ${vehicle.make || 'N/A'}`, 24, yPos); yPos += 7;
      doc.text(`Model: ${vehicle.model || 'N/A'}`, 24, yPos); yPos += 7;
      doc.text(`Year: ${vehicle.year || 'N/A'}`, 24, yPos); yPos += 7;
      doc.text(`Color: ${vehicle.color || 'N/A'}`, 24, yPos); yPos += 7;
      doc.text(`License Plate: ${vehicle.license_plate || 'N/A'}`, 24, yPos); yPos += 7;
      doc.text(`VIN: ${vehicle.vin || 'N/A'}`, 24, yPos); yPos += 7;
      doc.text(`Status: ${vehicle.status || 'N/A'}`, 24, yPos); yPos += 7;
      
      // Add a little spacing between vehicles
      if (index < customerVehicles.length - 1) {
        yPos += 3;
      }
    });
  } else {
    doc.text("No vehicles associated with this customer.", 14, yPos);
    yPos += 7;
  }
  
  // Add summary of obligations with consistent spacing
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
  
  // Function to add section headers with consistent spacing
  const addSectionHeader = (text: string, y: number) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(text, 14, y);
    return y + 10; // Return the new y position with consistent spacing
  };
  
  // Add detailed breakdown of obligations with consistent spacing
  yPos += 15;
  yPos = addSectionHeader("Detailed Obligations", yPos);
  
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
      // Add consistent header to the new page
      yPos = addPageHeader(doc);
      
      // Add section header for this type
      doc.setFont('helvetica', 'bold');
      doc.text(`${typeLabels[type] || type}`, 14, yPos);
      yPos += 7;
    } else {
      // Add section header for this type
      doc.setFont('helvetica', 'bold');
      doc.text(`${typeLabels[type] || type}`, 14, yPos);
      yPos += 7;
    }
    
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
        // Add consistent header to the new page
        yPos = addPageHeader(doc);
        
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
  
  // Add legal notice and next steps with consistent spacing
  if (yPos > 250) {
    doc.addPage();
    // Add consistent header to the new page
    yPos = addPageHeader(doc);
  }
  
  yPos += 5;
  yPos = addSectionHeader("Important Information", yPos);
  
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
  
  // Apply consistent footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Add footer text first - above the footer logo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("© 2025 ALARAF CAR RENTAL", pageWidth / 2, pageHeight - 30, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("Quality Service, Premium Experience", pageWidth / 2, pageHeight - 25, { align: 'center' });
    
    // Add the footer image below the text
    doc.addImage(footerLogoPath, 'PNG', 15, pageHeight - 20, pageWidth - 30, 12);
    
    // Add page number
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    doc.text('CONFIDENTIAL', 14, pageHeight - 5);
    doc.text(new Date().toLocaleDateString(), pageWidth - 14, pageHeight - 5, { align: 'right' });
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
