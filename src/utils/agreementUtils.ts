import { Agreement } from '@/lib/validation-schemas/agreement';
import jsPDF from 'jspdf';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInMonths } from 'date-fns';
import { ArabicTextService } from '@/utils/arabic-text-service';

export const generatePdfDocument = async (agreement: Agreement): Promise<boolean> => {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add Arabic font support
    doc.addFont('https://unpkg.com/amiri@0.114.0/amiri-regular.ttf', 'Amiri', 'normal');
    doc.addFont('https://unpkg.com/amiri@0.114.0/amiri-bold.ttf', 'Amiri', 'bold');

    // Set font size and style for the header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');

    // Process and add header text
    const headerText = await ArabicTextService.processText('Vehicle Rental Contract', 'PDF Title');
    doc.text(headerText, 105, 20, { align: 'center' });
    
    // Format dates
    const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
    const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
    
    // Calculate agreement duration in months
    const durationMonths = differenceInMonths(endDate, startDate);
    const duration = `${durationMonths} ${durationMonths === 1 ? 'month' : 'months'}`;
    
    // Start position for text
    let y = 30;
    const leftMargin = 20;
    const lineHeight = 5;
    
    // Set regular font for body text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Add contract introduction with Arabic text processing
    const introText = await ArabicTextService.processText(
      `This vehicle rental agreement ("the Agreement") is made and executed as of the date ${formatDate(startDate)}.`,
      'PDF Agreement Intro'
    );
    doc.text(introText, leftMargin, y);
    y += lineHeight * 2;
    
    // Parties section
    doc.setFont('helvetica', 'bold');
    const betweenText = await ArabicTextService.processText('Between:', 'PDF Section Header');
    doc.text(betweenText, leftMargin, y);
    y += lineHeight * 2;
    
    doc.setFont('helvetica', 'normal');
    const partyOneText = await ArabicTextService.processText(
      'Party One: Al-Araf Rent-a-Car LLC, a limited liability company legally registered under the laws of Qatar, with commercial registration number 146832 and located at Umm Salal Ali, Doha, Qatar, P.O. Box 36126. Represented by Mr. Khamees Hashem Al-Jaber, the authorized signatory for the company, referred to hereafter as the Lessor | Party One.',
      'PDF Party One'
    );
    
    // Handle long text wrapping
    const splitPartyOne = doc.splitTextToSize(partyOneText, 170);
    doc.text(splitPartyOne, leftMargin, y);
    y += splitPartyOne.length * lineHeight + lineHeight;
    
    const andText = await ArabicTextService.processText('And:', 'PDF Separator');
    doc.text(andText, leftMargin, y);
    y += lineHeight * 2;
    
    const customerName = agreement.customers?.full_name || 'N/A';
    const customerLicense = agreement.customers?.driver_license || 'N/A';
    const customerNationality = agreement.customers?.nationality || 'N/A';
    const customerEmail = agreement.customers?.email || 'N/A';
    const customerPhone = agreement.customers?.phone_number || 'N/A';
    
    // Process party two information
    const partyTwoText = await ArabicTextService.processText(
      `Party Two: ${customerName}, holder of driver's license ${customerLicense}, nationality ${customerNationality}, residing in Qatar, email ${customerEmail}, mobile number ${customerPhone}. Referred to hereafter as the Lessee | Party Two.`,
      'PDF Party Two'
    );
    
    const splitPartyTwo = doc.splitTextToSize(partyTwoText, 170);
    doc.text(splitPartyTwo, leftMargin, y);
    y += splitPartyTwo.length * lineHeight + lineHeight;
    
    const partiesText = await ArabicTextService.processText(
      'Each party shall individually be referred to as a "Party" and collectively as the "Parties."',
      'PDF Parties Definition'
    );
    doc.text(partiesText, leftMargin, y);
    y += lineHeight * 2;
    
    // Process and add preamble
    doc.setFont('helvetica', 'bold');
    const preambleTitle = await ArabicTextService.processText('Preamble', 'PDF Section Header');
    doc.text(preambleTitle, leftMargin, y);
    y += lineHeight * 2;
    
    doc.setFont('helvetica', 'normal');
    const preambleIntro = await ArabicTextService.processText(
      'Party One is a legally licensed car rental company and owns the vehicle described below:',
      'PDF Preamble'
    );
    doc.text(preambleIntro, leftMargin, y);
    y += lineHeight * 2;
    
    // Vehicle information with Arabic text processing
    const vehicleMake = agreement.vehicles?.make || 'N/A';
    const vehicleModel = agreement.vehicles?.model || 'N/A';
    const vehiclePlate = agreement.vehicles?.license_plate || 'N/A';
    const vehicleVin = agreement.vehicles?.vin || 'N/A';
    
    // Process vehicle information text
    const vehicleInfoTexts = await Promise.all([
      ArabicTextService.processText(`Vehicle Type:`, 'PDF Vehicle Info'),
      ArabicTextService.processText(`License Plate Number: ${vehiclePlate}`, 'PDF Vehicle Info'),
      ArabicTextService.processText(`VIN: ${vehicleVin}`, 'PDF Vehicle Info'),
      ArabicTextService.processText(`Vehicle Model: ${vehicleModel} - ${vehicleMake}`, 'PDF Vehicle Info')
    ]);
    
    // Add vehicle information
    vehicleInfoTexts.forEach(text => {
      doc.text(text, leftMargin, y);
      y += lineHeight;
    });
    y += lineHeight;

    // Continue with preamble
    const preambleText = await ArabicTextService.processText(
      'And whereas Party Two wishes to rent this vehicle from Party One under the terms and conditions of this Agreement, and Party One agrees to rent the vehicle to Party Two, both Parties hereby agree to the following:',
      'PDF Preamble Conclusion'
    );
    const splitPreamble = doc.splitTextToSize(preambleText, 170);
    doc.text(splitPreamble, leftMargin, y);
    y += splitPreamble.length * lineHeight + lineHeight;
    
    // Process and add articles
    const articles = [
      {
        title: 'Article 1:',
        content: 'The preamble above forms an integral part of this Agreement and shall be interpreted within its terms and conditions.'
      },
      {
        title: 'Article 2 - Vehicle Information:',
        content: 'Party One hereby rents to Party Two the following vehicle:'
      }
    ];
    
    for (const article of articles) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      const articleTitle = await ArabicTextService.processText(article.title, 'PDF Article Title');
      doc.text(articleTitle, leftMargin, y);
      y += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      const articleContent = await ArabicTextService.processText(article.content, 'PDF Article Content');
      doc.text(articleContent, leftMargin + 15, y);
      y += lineHeight * 2;
    }
    
    // Process and add payment terms
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    // Add payment terms
    const paymentTitle = await ArabicTextService.processText('Payment Terms:', 'PDF Section Header');
    doc.setFont('helvetica', 'bold');
    doc.text(paymentTitle, leftMargin, y);
    y += lineHeight * 2;

    doc.setFont('helvetica', 'normal');
    const paymentInfo = await ArabicTextService.processText(
      `Monthly Payment: ${formatCurrency(agreement.rent_amount || 0)}
Total Contract Value: ${formatCurrency(agreement.total_amount || 0)}
Security Deposit: ${formatCurrency(agreement.deposit_amount || 0)}`,
      'PDF Payment Info'
    );
    
    const paymentLines = paymentInfo.split('\n');
    paymentLines.forEach(line => {
      doc.text(line, leftMargin + 15, y);
      y += lineHeight;
    });
    
    // Add signature section
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    const signatureHeader = await ArabicTextService.processText(
      'In witness whereof, this Agreement is signed by the Parties in two copies, one for each Party.',
      'PDF Signature Section'
    );
    
    doc.setFont('helvetica', 'bold');
    doc.text(signatureHeader, leftMargin, y);
    y += lineHeight * 3;
    
    const [partyOneSignature, partyTwoSignature] = await Promise.all([
      ArabicTextService.processText('Party One:', 'PDF Signature'),
      ArabicTextService.processText('Party Two:', 'PDF Signature')
    ]);
    
    doc.text(partyOneSignature, leftMargin, y);
    doc.text(partyTwoSignature, leftMargin + 100, y);
    y += lineHeight;
    
    const [representerOne, representerTwo] = await Promise.all([
      ArabicTextService.processText('Represented by Mr. Khamees Hashem Al-Jaber', 'PDF Signature'),
      ArabicTextService.processText(`Represented by ${customerName}`, 'PDF Signature')
    ]);
    
    doc.setFont('helvetica', 'normal');
    doc.text(representerOne, leftMargin, y);
    doc.text(representerTwo, leftMargin + 100, y);
    
    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageText = await ArabicTextService.processText(`Page ${i} of ${pageCount}`, 'PDF Page Numbers');
      doc.text(pageText, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    // Save the PDF with the agreement number
    doc.save(`Rental_Agreement-${agreement.agreement_number}.pdf`);
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
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
