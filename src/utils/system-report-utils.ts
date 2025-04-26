
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { generateStandardReport } from './report-utils';
// Import autoTable explicitly for proper typing
import 'jspdf-autotable';

interface SystemReportOptions {
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  statusFilter?: string;
}

/**
 * Generates a comprehensive system-wide agreement report
 */
export const generateSystemReport = async (
  agreements: Agreement[],
  payments: any[] = [],
  options: SystemReportOptions = {}
): Promise<jsPDF> => {
  console.log(`Generating report with ${agreements.length} agreements and ${payments.length} payments`);
  
  // Use our standard report template with company headers
  const doc = generateStandardReport(
    'System-Wide Agreement Report',
    options.dateRange,
    async (doc, startY) => {
      let currentY = startY;
      
      // Cover page with summary statistics
      currentY = await generateCoverPage(doc, agreements, payments, currentY);
      
      // Add table of contents
      doc.addPage();
      currentY = 20;
      currentY = await generateTableOfContents(doc, currentY);
      
      // Group agreements by status for organized reporting
      const agreementsByStatus = Object.values(AgreementStatus).reduce((acc, status) => {
        acc[status] = agreements.filter(a => a.status === status);
        return acc;
      }, {} as Record<string, Agreement[]>);
      
      // Generate a section for each status type that has agreements
      for (const [status, statusAgreements] of Object.entries(agreementsByStatus)) {
        if (statusAgreements.length > 0) {
          doc.addPage();
          currentY = 20;
          currentY = await generateStatusSection(doc, status, statusAgreements, payments, currentY);
        }
      }
      
      // Financial summary section
      doc.addPage();
      currentY = 20;
      currentY = await generateFinancialSummary(doc, agreements, payments, currentY);
      
      return currentY;
    }
  );
  
  return doc;
};

/**
 * Generates the cover page with summary statistics
 */
const generateCoverPage = async (
  doc: jsPDF,
  agreements: Agreement[],
  payments: any[],
  startY: number
): Promise<number> => {
  let currentY = startY;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RENTAL AGREEMENTS SUMMARY', doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += 20;

  // Generation date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += 30;

  // Summary statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY STATISTICS', doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  // Agreement counts
  const totalAgreements = agreements.length;
  const activeAgreements = agreements.filter(a => a.status === AgreementStatus.ACTIVE).length;
  const pendingAgreements = agreements.filter(a => a.status === AgreementStatus.PENDING).length;
  const expiredAgreements = agreements.filter(a => a.status === AgreementStatus.EXPIRED).length;
  
  // Financial metrics
  const totalContractValue = agreements.reduce((sum, agreement) => sum + (agreement.total_amount || 0), 0);
  const monthlyRevenue = agreements
    .filter(a => a.status === AgreementStatus.ACTIVE)
    .reduce((sum, agreement) => sum + (agreement.rent_amount || 0), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
  
  // Create statistics table using autotable
  (doc as any).autoTable({
    startY: currentY,
    head: [['Metric', 'Value']],
    body: [
      ['Total Agreements', totalAgreements.toString()],
      ['Active Agreements', activeAgreements.toString()],
      ['Pending Agreements', pendingAgreements.toString()],
      ['Expired Agreements', expiredAgreements.toString()],
      ['Total Contract Value', formatCurrency(totalContractValue)],
      ['Monthly Revenue (Active)', formatCurrency(monthlyRevenue)],
      ['Total Payments Received', formatCurrency(totalPaid)]
    ],
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 244, 248]
    },
    margin: { top: 10 },
    styles: { cellPadding: 5 }
  });
  
  return (doc as any).lastAutoTable.finalY + 20;
};

/**
 * Generates the table of contents
 */
const generateTableOfContents = async (
  doc: jsPDF,
  startY: number
): Promise<number> => {
  let currentY = startY;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TABLE OF CONTENTS', doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const entries = [
    { title: '1. Summary Statistics', page: 1 },
    { title: '2. Active Agreements', page: 3 },
    { title: '3. Pending Agreements', page: 4 },
    { title: '4. Expired Agreements', page: 5 },
    { title: '5. Cancelled Agreements', page: 6 },
    { title: '6. Financial Summary', page: 7 }
  ];

  entries.forEach(entry => {
    doc.text(entry.title, 20, currentY);
    doc.text(`Page ${entry.page}`, doc.internal.pageSize.getWidth() - 40, currentY);
    currentY += 10;
  });

  return currentY;
};

/**
 * Generates a section for agreements of a specific status
 */
const generateStatusSection = async (
  doc: jsPDF,
  status: string,
  agreements: Agreement[],
  payments: any[],
  startY: number
): Promise<number> => {
  let currentY = startY;

  // Section header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${status.toUpperCase()} AGREEMENTS (${agreements.length})`, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += 15;
  
  if (agreements.length === 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text('No agreements found in this category.', 20, currentY);
    return currentY + 10;
  }
  
  // Table for agreements
  const tableData = agreements.map(agreement => {
    const customerName = agreement.customers?.full_name || 'N/A';
    const vehicleInfo = agreement.vehicles ? 
      `${agreement.vehicles.make} ${agreement.vehicles.model} (${agreement.vehicles.license_plate})` : 'N/A';
    const startDate = agreement.start_date ? format(new Date(agreement.start_date), 'MMM d, yyyy') : 'N/A';
    const endDate = agreement.end_date ? format(new Date(agreement.end_date), 'MMM d, yyyy') : 'N/A';
    
    // Calculate payments for this agreement
    const agreementPayments = payments.filter(p => p.lease_id === agreement.id);
    const totalPaid = agreementPayments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
    const balance = (agreement.total_amount || 0) - totalPaid;
    
    return [
      agreement.agreement_number || 'N/A',
      customerName,
      vehicleInfo,
      `${startDate} - ${endDate}`,
      formatCurrency(agreement.rent_amount || 0),
      formatCurrency(totalPaid),
      formatCurrency(balance)
    ];
  });

  // Only create table if we have data
  if (tableData.length > 0) {
    (doc as any).autoTable({
      startY: currentY,
      head: [['Agreement #', 'Customer', 'Vehicle', 'Period', 'Monthly Rent', 'Paid', 'Balance']],
      body: tableData,
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 244, 248]
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 }
      },
      margin: { top: 10 },
      styles: { cellPadding: 5, fontSize: 10 }
    });
    
    return (doc as any).lastAutoTable.finalY + 10;
  } else {
    // If we don't have table data but have agreements, show a message
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text('No detailed data available for agreements in this category.', 20, currentY);
    return currentY + 10;
  }
};

/**
 * Generates the financial summary section
 */
const generateFinancialSummary = async (
  doc: jsPDF,
  agreements: Agreement[],
  payments: any[],
  startY: number
): Promise<number> => {
  let currentY = startY;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FINANCIAL SUMMARY', doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += 15;

  // Calculate monthly metrics for active agreements
  const activeAgreements = agreements.filter(a => a.status === AgreementStatus.ACTIVE);
  const monthlyRevenue = activeAgreements.reduce((sum, agreement) => sum + (agreement.rent_amount || 0), 0);
  
  // Calculate total contract value
  const totalContractValue = agreements.reduce((sum, agreement) => sum + (agreement.total_amount || 0), 0);
  
  // Calculate total received payments
  const totalReceived = payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
  
  // Calculate total outstanding balance
  const totalOutstanding = totalContractValue - totalReceived;
  
  // Calculate average monthly rent
  const avgRent = activeAgreements.length > 0 ? 
    activeAgreements.reduce((sum, agreement) => sum + (agreement.rent_amount || 0), 0) / activeAgreements.length : 0;

  // Create financial summary table
  (doc as any).autoTable({
    startY: currentY,
    head: [['Financial Metric', 'Amount']],
    body: [
      ['Total Contract Value', formatCurrency(totalContractValue)],
      ['Monthly Revenue (Active Agreements)', formatCurrency(monthlyRevenue)],
      ['Average Monthly Rent', formatCurrency(avgRent)],
      ['Total Payments Received', formatCurrency(totalReceived)],
      ['Total Outstanding Balance', formatCurrency(totalOutstanding)]
    ],
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 244, 248]
    },
    margin: { top: 10 },
    styles: { cellPadding: 5 }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 20;
  
  return currentY;
};
