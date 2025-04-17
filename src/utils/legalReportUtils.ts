
import { jsPDF } from 'jspdf';
import { LegalCase } from '@/types/legal-case';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/date-utils';
import { CustomerObligation } from '@/components/legal/CustomerLegalObligations';
import { hasRTLCharacters } from './rtl-utils';

// Define our styles object manually instead of using createStyles from react-to-pdf
const legalReportStyles = {
  container: {
    padding: '20px',
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center',
  },
  section: {
    marginBottom: '15px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  field: {
    marginBottom: '5px',
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginRight: '5px',
  },
  fieldValue: {
    fontSize: '14px',
  },
  footer: {
    fontSize: '12px',
    color: '#666',
    marginTop: '20px',
    textAlign: 'center',
  },
};

export const generateLegalReportData = async (caseId: string): Promise<LegalCase | null> => {
  try {
    const { data: legalCase, error } = await supabase
      .from('legal_cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error) {
      console.error("Error fetching legal case:", error);
      return null;
    }

    if (!legalCase) {
      console.warn("Legal case not found with ID:", caseId);
      return null;
    }

    return {
      ...legalCase,
      created_at: formatDate(legalCase.created_at),
      updated_at: formatDate(legalCase.updated_at),
      hearing_date: formatDate(legalCase.hearing_date),
    } as LegalCase;
  } catch (error) {
    console.error("Unexpected error generating legal report data:", error);
    return null;
  }
};

/**
 * Helper function to handle both Arabic and Latin text in PDF
 */
const addTextWithBidiSupport = (doc: jsPDF, text: string, x: number, y: number, options?: any) => {
  if (!text) return;
  
  const hasArabic = hasRTLCharacters(text);
  
  if (hasArabic) {
    // For Arabic text, we need special handling
    doc.setFont('cairo', 'normal');
    
    // Set text alignment based on direction and options
    const alignment = options?.align || 'right';
    doc.text(text, x, y, { align: alignment });
  } else {
    // For normal text
    doc.setFont('helvetica', 'normal');
    doc.text(text, x, y, options);
  }
};

/**
 * Generates a PDF report for a customer's legal obligations
 * 
 * @param customerId Customer ID
 * @param customerName Customer name
 * @param obligations List of customer obligations
 * @returns PDF document
 */
export const generateLegalCustomerReport = async (
  customerId: string,
  customerName: string,
  obligations: CustomerObligation[]
): Promise<jsPDF> => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Try to add font for Arabic support
  try {
    // Set up document
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    addTextWithBidiSupport(doc, 'Customer Legal Obligation Report', 105, 20, { align: 'center' });
    
    // Add customer information
    doc.setFontSize(14);
    addTextWithBidiSupport(doc, `Customer: ${customerName}`, 20, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    addTextWithBidiSupport(doc, `Customer ID: ${customerId}`, 20, 50);
    addTextWithBidiSupport(doc, `Report Date: ${formatDate(new Date())}`, 20, 60);
    
    // Add obligations summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    addTextWithBidiSupport(doc, 'Obligations Summary', 20, 80);
    
    // Calculate totals
    const totalAmount = obligations.reduce((sum, obligation) => sum + obligation.amount, 0);
    const highestUrgency = obligations.reduce((highest, obligation) => {
      const urgencyOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      return urgencyOrder[obligation.urgency] > urgencyOrder[highest] ? obligation.urgency : highest;
    }, 'low' as 'low' | 'medium' | 'high' | 'critical');
    
    // Add summary details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    addTextWithBidiSupport(doc, `Total Number of Obligations: ${obligations.length}`, 20, 90);
    addTextWithBidiSupport(doc, `Total Amount Due: QAR ${totalAmount.toLocaleString()}`, 20, 100);
    addTextWithBidiSupport(doc, `Highest Urgency Level: ${highestUrgency.charAt(0).toUpperCase() + highestUrgency.slice(1)}`, 20, 110);
    
    // Create table headers
    const startY = 130;
    const headers = [
      'Type',
      'Description',
      'Due Date',
      'Amount (QAR)',
      'Urgency',
      'Status'
    ];
    
    // Initialize starting positions
    let y = startY;
    const margins = {
      left: 20,
      right: 190,
      width: 170
    };
    
    // Draw table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margins.left, y - 10, margins.width, 10, 'F');
    doc.setFont('helvetica', 'bold');
    addTextWithBidiSupport(doc, 'Type', 25, y - 3);
    addTextWithBidiSupport(doc, 'Description', 50, y - 3);
    addTextWithBidiSupport(doc, 'Due Date', 90, y - 3);
    addTextWithBidiSupport(doc, 'Amount', 120, y - 3);
    addTextWithBidiSupport(doc, 'Urgency', 145, y - 3);
    addTextWithBidiSupport(doc, 'Status', 170, y - 3);
    
    // Draw table rows
    doc.setFont('helvetica', 'normal');
    
    obligations.forEach((obligation, index) => {
      // Add a new page if we're getting close to the bottom
      if (y > 250) {
        doc.addPage();
        y = 20;
        
        // Add header to new page
        doc.setFillColor(240, 240, 240);
        doc.rect(margins.left, y, margins.width, 10, 'F');
        doc.setFont('helvetica', 'bold');
        addTextWithBidiSupport(doc, 'Type', 25, y + 7);
        addTextWithBidiSupport(doc, 'Description', 50, y + 7);
        addTextWithBidiSupport(doc, 'Due Date', 90, y + 7);
        addTextWithBidiSupport(doc, 'Amount', 120, y + 7);
        addTextWithBidiSupport(doc, 'Urgency', 145, y + 7);
        addTextWithBidiSupport(doc, 'Status', 170, y + 7);
        doc.setFont('helvetica', 'normal');
        y += 15;
      }
      
      // Draw alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margins.left, y, margins.width, 10, 'F');
      }
      
      // Add row data
      let type = '';
      switch (obligation.obligationType) {
        case 'payment': type = 'Payment'; break;
        case 'traffic_fine': type = 'Traffic Fine'; break;
        case 'legal_case': type = 'Legal Case'; break;
        default: type = 'Other';
      }
      
      // Format date
      const dueDate = obligation.dueDate instanceof Date 
        ? formatDate(obligation.dueDate) 
        : 'N/A';
      
      addTextWithBidiSupport(doc, type, 25, y + 7);
      
      // Handle long descriptions
      const descriptionText = obligation.description.length > 25
        ? obligation.description.substring(0, 22) + '...'
        : obligation.description;
      addTextWithBidiSupport(doc, descriptionText, 50, y + 7);
      
      addTextWithBidiSupport(doc, dueDate, 90, y + 7);
      addTextWithBidiSupport(doc, obligation.amount.toLocaleString(), 120, y + 7);
      addTextWithBidiSupport(doc, obligation.urgency, 145, y + 7);
      addTextWithBidiSupport(doc, obligation.status, 170, y + 7);
      
      y += 10;
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer with page number
      doc.setFontSize(8);
      addTextWithBidiSupport(
        doc,
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      
      // Confidentiality statement
      addTextWithBidiSupport(
        doc,
        'CONFIDENTIAL - For internal use only',
        105,
        doc.internal.pageSize.height - 5,
        { align: 'center' }
      );
    }
  } catch (error) {
    console.error("Error generating PDF with Arabic support:", error);
    // Fallback to standard PDF without special font handling
    doc.text("Error generating report with Arabic support", 20, 20);
  }
  
  return doc;
};
