import { Agreement } from '@/lib/validation-schemas/agreement';
import jsPDF from 'jspdf';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInMonths } from 'date-fns';
import { ArabicTextService } from '@/utils/arabic-text-service';

export const generatePdfDocument = async (agreement: Agreement): Promise<boolean> => {
  try {
    console.log('Starting PDF generation with Arabic text processing...');
    
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add Arabic font support
    doc.addFont('https://unpkg.com/amiri@0.114.0/amiri-regular.ttf', 'Amiri', 'normal');
    doc.addFont('https://unpkg.com/amiri@0.114.0/amiri-bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri', 'normal'); // Set Amiri as default font

    // Set initial font size and style
    doc.setFontSize(16);
    
    // Process title with Arabic text service
    const headerText = await ArabicTextService.processText('عقد تأجير سيارة - Vehicle Rental Contract', 'PDF Title');
    const titleWidth = doc.getStringUnitWidth(headerText) * doc.getFontSize() / doc.internal.scaleFactor;
    doc.text(headerText, (doc.internal.pageSize.getWidth() - titleWidth) / 2, 20);
    
    // Format dates
    const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
    const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
    
    // Calculate agreement duration
    const durationMonths = differenceInMonths(endDate, startDate);
    const duration = `${durationMonths} ${durationMonths === 1 ? 'month' : 'months'}`;
    
    // Start position for text
    let y = 30;
    const leftMargin = 20;
    const lineHeight = 7;
    
    // Set regular font for body text
    doc.setFontSize(11);
    
    // Add contract introduction
    const introText = await ArabicTextService.processText(
      `This vehicle rental agreement ("Agreement") is made on ${formatDate(startDate)}`,
      'PDF Agreement Intro'
    );
    doc.text(introText, leftMargin, y);
    y += lineHeight * 2;
    
    // Process and add parties information
    const partyTitle = await ArabicTextService.processText('Between:', 'PDF Section Header');
    doc.setFont('Amiri', 'bold');
    doc.text(partyTitle, leftMargin, y);
    y += lineHeight;
    
    // Party One details
    doc.setFont('Amiri', 'normal');
    const partyOneText = await ArabicTextService.processText(
      'Party One: Al-Araf Rent-a-Car LLC (الأعراف لتأجير السيارات ذ.م.م)',
      'PDF Party One'
    );
    const partyOneDetails = await ArabicTextService.processText(
      'Commercial Registration: 146832, Located at: Umm Salal Ali, Doha, Qatar',
      'PDF Party One Details'
    );
    
    doc.text(partyOneText, leftMargin, y);
    y += lineHeight;
    doc.text(partyOneDetails, leftMargin + 5, y);
    y += lineHeight * 2;
    
    // Party Two details
    const customerName = agreement.customers?.full_name || 'N/A';
    const customerInfo = await ArabicTextService.processText(
      `Party Two: ${customerName}\nDriver's License: ${agreement.customers?.driver_license || 'N/A'}\nNationality: ${agreement.customers?.nationality || 'N/A'}`,
      'PDF Party Two'
    );
    
    doc.text(customerInfo, leftMargin, y);
    y += lineHeight * 4;
    
    // Vehicle information
    const vehicleTitle = await ArabicTextService.processText('Vehicle Details:', 'PDF Section Header');
    doc.setFont('Amiri', 'bold');
    doc.text(vehicleTitle, leftMargin, y);
    y += lineHeight;
    
    doc.setFont('Amiri', 'normal');
    const vehicleInfo = await ArabicTextService.processText(
      `Make & Model: ${agreement.vehicles?.make || 'N/A'} ${agreement.vehicles?.model || 'N/A'}\nLicense Plate: ${agreement.vehicles?.license_plate || 'N/A'}\nVIN: ${agreement.vehicles?.vin || 'N/A'}`,
      'PDF Vehicle Info'
    );
    doc.text(vehicleInfo, leftMargin + 5, y);
    y += lineHeight * 4;
    
    // Payment terms
    const paymentTitle = await ArabicTextService.processText('Payment Terms:', 'PDF Section Header');
    doc.setFont('Amiri', 'bold');
    doc.text(paymentTitle, leftMargin, y);
    y += lineHeight;
    
    doc.setFont('Amiri', 'normal');
    const paymentInfo = await ArabicTextService.processText(
      `Monthly Rent: ${formatCurrency(agreement.rent_amount || 0)}\nTotal Contract Value: ${formatCurrency(agreement.total_amount || 0)}\nSecurity Deposit: ${formatCurrency(agreement.deposit_amount || 0)}`,
      'PDF Payment Info'
    );
    doc.text(paymentInfo, leftMargin + 5, y);
    y += lineHeight * 4;
    
    // Add signature section
    const signatureTitle = await ArabicTextService.processText(
      'Signatures / التوقيعات',
      'PDF Signature Section'
    );
    doc.setFont('Amiri', 'bold');
    doc.text(signatureTitle, leftMargin, y);
    y += lineHeight * 2;
    
    // Add signature lines
    doc.setFont('Amiri', 'normal');
    const partyOneSig = await ArabicTextService.processText('Party One: _________________', 'PDF Signature');
    const partyTwoSig = await ArabicTextService.processText('Party Two: _________________', 'PDF Signature');
    doc.text(partyOneSig, leftMargin, y);
    doc.text(partyTwoSig, doc.internal.pageSize.getWidth() - leftMargin - 80, y);
    
    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageText = await ArabicTextService.processText(`Page ${i} of ${totalPages}`, 'PDF Page Numbers');
      doc.text(pageText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    // Save the PDF
    const filename = `Rental_Agreement-${agreement.agreement_number}.pdf`;
    console.log('Saving PDF:', filename);
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error("Error generating PDF with Arabic text:", error);
    return false;
  }
};

// Helper function for date formatting
export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return format(dateObj, 'MMMM d, yyyy');
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
export const diagnosisTemplateAccess = async (): Promise<{
  exists: boolean; 
  accessible: boolean;
  bucketExists: boolean;
  templateExists: boolean;
  errors: string[];
}> => {
  try {
    // This is a placeholder function that would diagnose template access
    return {
      exists: true,
      accessible: true,
      bucketExists: true,
      templateExists: true,
      errors: []
    };
  } catch (error) {
    console.error("Error diagnosing template access:", error);
    return {
      exists: false,
      accessible: false,
      bucketExists: false,
      templateExists: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
};
