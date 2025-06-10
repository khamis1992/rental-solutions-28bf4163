
import { Agreement } from '@/types/agreement';
import pdfMake from 'pdfmake/build/pdfmake';
import { toast } from 'sonner';

// Ultra-simple text processing - no special characters or bidirectional text
function cleanText(text: string | undefined | null): string {
  if (!text) return 'Not specified';
  
  // Convert to string and remove any problematic characters
  return String(text)
    .replace(/[^\u0020-\u007E\u0600-\u06FF]/g, '') // Keep only basic Latin and Arabic
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim() || 'Not specified';
}

// Simple currency formatting
function formatCurrency(amount: number | undefined | null): string {
  if (!amount && amount !== 0) return 'Not specified';
  try {
    return `${amount.toFixed(2)} QAR`;
  } catch {
    return 'Not specified';
  }
}

// Simple date formatting
function formatDate(date: string | Date | undefined): string {
  if (!date) return 'Not specified';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Not specified';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'Not specified';
  }
}

// Create ultra-simple document structure
function createUltraSimpleDocument(agreement: Agreement) {
  // Extract data safely
  const data = {
    agreementNumber: cleanText(agreement.agreement_number),
    customerName: cleanText(agreement.customers?.full_name),
    customerPhone: cleanText(agreement.customers?.phone_number),
    vehicleMake: cleanText(agreement.vehicles?.make),
    vehicleModel: cleanText(agreement.vehicles?.model),
    vehicleYear: cleanText(agreement.vehicles?.year?.toString()),
    licensePlate: cleanText(agreement.vehicles?.license_plate),
    startDate: formatDate(agreement.start_date),
    endDate: formatDate(agreement.end_date),
    monthlyRent: formatCurrency(agreement.rent_amount),
    totalAmount: formatCurrency(agreement.total_amount),
    depositAmount: formatCurrency(agreement.deposit_amount),
    currentDate: formatDate(new Date())
  };

  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    content: [
      // Simple header
      { text: 'Al Aaraf Car Rental Company L.L.C', fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'Doha - Qatar', fontSize: 10, alignment: 'center', margin: [0, 0, 0, 20] },
      
      // Title
      { text: 'Vehicle Rental Agreement', fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      
      // Agreement info
      { text: `Agreement Number: ${data.agreementNumber}`, fontSize: 10, margin: [0, 0, 0, 5] },
      { text: `Date: ${data.currentDate}`, fontSize: 10, margin: [0, 0, 0, 15] },
      
      // Customer section
      { text: 'Customer Information:', fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
      { text: `Name: ${data.customerName}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `Phone: ${data.customerPhone}`, fontSize: 10, margin: [0, 0, 0, 15] },
      
      // Vehicle section
      { text: 'Vehicle Information:', fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
      { text: `Make: ${data.vehicleMake}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `Model: ${data.vehicleModel}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `Year: ${data.vehicleYear}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `License Plate: ${data.licensePlate}`, fontSize: 10, margin: [0, 0, 0, 15] },
      
      // Financial section
      { text: 'Financial Terms:', fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
      { text: `Monthly Rent: ${data.monthlyRent}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `Total Amount: ${data.totalAmount}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `Security Deposit: ${data.depositAmount}`, fontSize: 10, margin: [0, 0, 0, 15] },
      
      // Period section
      { text: 'Rental Period:', fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
      { text: `Start Date: ${data.startDate}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `End Date: ${data.endDate}`, fontSize: 10, margin: [0, 0, 0, 20] },
      
      // Basic terms
      { text: 'Terms and Conditions:', fontSize: 12, bold: true, margin: [0, 0, 0, 10] },
      { text: '1. The tenant agrees to pay rent on the specified date', fontSize: 9, margin: [0, 0, 0, 3] },
      { text: '2. The tenant is responsible for vehicle maintenance', fontSize: 9, margin: [0, 0, 0, 3] },
      { text: '3. All traffic violations are the responsibility of the tenant', fontSize: 9, margin: [0, 0, 0, 3] },
      { text: '4. This agreement is subject to Qatar laws', fontSize: 9, margin: [0, 0, 0, 30] },
      
      // Signatures
      { text: 'Signatures:', fontSize: 12, bold: true, margin: [0, 0, 0, 20] },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: 'Lessor:', alignment: 'center', border: [false, false, false, false] },
              { text: 'Lessee:', alignment: 'center', border: [false, false, false, false] }
            ],
            [
              { text: '\n\n_____________________', alignment: 'center', border: [false, false, false, false] },
              { text: '\n\n_____________________', alignment: 'center', border: [false, false, false, false] }
            ],
            [
              { text: 'Signature', alignment: 'center', fontSize: 8, border: [false, false, false, false] },
              { text: 'Signature', alignment: 'center', fontSize: 8, border: [false, false, false, false] }
            ]
          ]
        }
      }
    ],
    
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10
    }
  };
}

// Main contract generation function with maximum error protection
export async function generateArabicContract(agreement: Agreement): Promise<boolean> {
  try {
    console.log('Starting ultra-simple contract generation for agreement:', agreement.id);
    
    // Create the simplest possible document
    const docDefinition = createUltraSimpleDocument(agreement);
    console.log('Document definition created successfully');
    
    // Generate filename
    const fileName = `contract-${agreement.agreement_number || 'unknown'}-${Date.now()}.pdf`;
    
    try {
      // Create PDF with minimal configuration
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.download(fileName);
      
      console.log('PDF generated and downloaded successfully');
      toast.success('Contract generated successfully');
      return true;
      
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      
      // Ultimate fallback - text-only document
      const textOnlyDoc = {
        content: [
          { text: 'VEHICLE RENTAL AGREEMENT', fontSize: 16, bold: true, alignment: 'center' },
          { text: '\n' },
          { text: `Agreement: ${agreement.agreement_number || 'N/A'}`, fontSize: 12 },
          { text: `Customer: ${agreement.customers?.full_name || 'N/A'}`, fontSize: 12 },
          { text: `Vehicle: ${agreement.vehicles?.make || 'N/A'} ${agreement.vehicles?.model || 'N/A'}`, fontSize: 12 },
          { text: `Monthly Rent: ${agreement.rent_amount || 0} QAR`, fontSize: 12 },
          { text: '\n' },
          { text: 'This is a simplified contract document.', fontSize: 10 }
        ],
        defaultStyle: {
          font: 'Helvetica'
        }
      };
      
      const fallbackPdf = pdfMake.createPdf(textOnlyDoc);
      fallbackPdf.download(`simple-${fileName}`);
      
      toast.success('Simplified contract generated');
      return true;
    }
    
  } catch (error) {
    console.error('Complete contract generation failure:', error);
    toast.error('Failed to generate contract');
    return false;
  }
}

// Export function for database integration
export async function generateAndStoreContract(agreement: Agreement) {
  try {
    const success = await generateArabicContract(agreement);
    return {
      success,
      error: success ? null : 'Failed to generate contract'
    };
  } catch (error) {
    console.error('Error in generateAndStoreContract:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
