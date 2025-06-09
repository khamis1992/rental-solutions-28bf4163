import { Agreement } from '@/lib/validation-schemas/agreement';
import jsPDF from 'jspdf';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInMonths } from 'date-fns';
import { addCompanyLogo, addFooterImage } from './report-utils';

export const generatePdfDocument = async (agreement: Agreement): Promise<boolean> => {
  try {    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add company logo
    addCompanyLogo(doc);
    
    // Set font size and style for the header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Vehicle Rental Contract', 105, 20, { align: 'center' });
    
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
    
    // Add contract introduction
    doc.text(`This vehicle rental agreement ("the Agreement") is made and executed as of the date ${formatDate(startDate)}.`, leftMargin, y);
    y += lineHeight * 2;
    
    // Parties section
    doc.setFont('helvetica', 'bold');
    doc.text('Between:', leftMargin, y);
    y += lineHeight * 2;
    
    doc.setFont('helvetica', 'normal');
    const partyOneText = 'Party One: Al-Araf Rent-a-Car LLC, a limited liability company legally registered under the laws of Qatar, with commercial registration number 146832 and located at Umm Salal Ali, Doha, Qatar, P.O. Box 36126. Represented by Mr. Khamees Hashem Al-Jaber, the authorized signatory for the company, referred to hereafter as the Lessor | Party One.';
    
    // Handle long text wrapping
    const splitPartyOne = doc.splitTextToSize(partyOneText, 170);
    doc.text(splitPartyOne, leftMargin, y);
    y += splitPartyOne.length * lineHeight + lineHeight;
    
    doc.text('And:', leftMargin, y);
    y += lineHeight * 2;
    
    const customerName = agreement.customers?.full_name || 'N/A';
    const customerLicense = agreement.customers?.driver_license || 'N/A';
    const customerNationality = agreement.customers?.nationality || 'N/A';
    const customerEmail = agreement.customers?.email || 'N/A';
    const customerPhone = agreement.customers?.phone_number || 'N/A';
    
    const partyTwoText = `Party Two: ${customerName}, holder of driver's license ${customerLicense}, nationality ${customerNationality}, residing in Qatar, email ${customerEmail}, mobile number ${customerPhone}. Referred to hereafter as the Lessee | Party Two.`;
    
    const splitPartyTwo = doc.splitTextToSize(partyTwoText, 170);
    doc.text(splitPartyTwo, leftMargin, y);
    y += splitPartyTwo.length * lineHeight + lineHeight;
    
    const partiesText = 'Each party shall individually be referred to as a "Party" and collectively as the "Parties."';
    doc.text(partiesText, leftMargin, y);
    y += lineHeight * 2;
    
    // Preamble
    doc.setFont('helvetica', 'bold');
    doc.text('Preamble', leftMargin, y);
    y += lineHeight * 2;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Whereas Party One is a legally licensed car rental company and owns the vehicle described below:', leftMargin, y);
    y += lineHeight * 2;
    
    // Vehicle information
    const vehicleMake = agreement.vehicles?.make || 'N/A';
    const vehicleModel = agreement.vehicles?.model || 'N/A';
    const vehiclePlate = agreement.vehicles?.license_plate || 'N/A';
    const vehicleVin = agreement.vehicles?.vin || 'N/A';
    
    doc.text(`Vehicle Type:`, leftMargin, y);
    y += lineHeight;
    doc.text(`License Plate Number: ${vehiclePlate}`, leftMargin, y);
    y += lineHeight;
    doc.text(`VIN: ${vehicleVin}`, leftMargin, y);
    y += lineHeight;
    doc.text(`Vehicle Model: ${vehicleModel} - ${vehicleMake}`, leftMargin, y);
    y += lineHeight * 2;
    
    const preambleText = 'And whereas Party Two wishes to rent this vehicle from Party One under the terms and conditions of this Agreement, and Party One agrees to rent the vehicle to Party Two, both Parties hereby agree to the following:';
    const splitPreamble = doc.splitTextToSize(preambleText, 170);
    doc.text(splitPreamble, leftMargin, y);
    y += splitPreamble.length * lineHeight + lineHeight;
    
    // Articles
    doc.setFont('helvetica', 'bold');
    doc.text('Article 1:', leftMargin, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text('The preamble above forms an integral part of this Agreement and shall be interpreted within its terms and conditions.', leftMargin + 15, y);
    y += lineHeight * 2;
    
    // Article 2 - Vehicle Information
    doc.setFont('helvetica', 'bold');
    doc.text('Article 2 - Vehicle Information:', leftMargin, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text('Party One hereby rents to Party Two the following vehicle:', leftMargin + 15, y);
    y += lineHeight * 2;
    
    doc.text(`Vehicle Type:`, leftMargin + 15, y);
    y += lineHeight;
    doc.text(`License Plate Number: ${vehiclePlate}`, leftMargin + 15, y);
    y += lineHeight;
    doc.text(`VIN: ${vehicleVin}`, leftMargin + 15, y);
    y += lineHeight;
    doc.text(`Model: ${vehicleModel} - ${vehicleMake}`, leftMargin + 15, y);
    y += lineHeight * 2;
    
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    // Article 3 - Rental Duration
    doc.setFont('helvetica', 'bold');
    doc.text('Article 3 - Rental Duration:', leftMargin, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    const durationText = `The rental duration of this Agreement is ${duration}, commencing from the effective date of this Agreement. The Agreement is non-renewable and will terminate upon the expiration of the term. Party Two may not terminate the Agreement before its expiration without written consent from Party One.`;
    const splitDuration = doc.splitTextToSize(durationText, 170);
    doc.text(splitDuration, leftMargin + 15, y);
    y += splitDuration.length * lineHeight + lineHeight;
    
    // Article 4 - Rental Fee
    doc.setFont('helvetica', 'bold');
    doc.text('Article 4 - Rental Fee:', leftMargin, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    const feeText = `Party Two agrees to pay Party One a monthly rental fee of ${formatCurrency(agreement.total_amount || 0)}, in accordance with the attached payment schedule. Party Two agrees to make full monthly rental payments regularly and without deductions for any fees, taxes, or other charges.`;
    const splitFee = doc.splitTextToSize(feeText, 170);
    doc.text(splitFee, leftMargin + 15, y);
    y += splitFee.length * lineHeight + lineHeight;
    
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    // Article 5 - Late Payment Penalties
    doc.setFont('helvetica', 'bold');
    doc.text('Article 5 - Late Payment Penalties:', leftMargin, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    const penaltyText = `Payments are due on the first day of each month. If Party Two fails to make a payment on time, a late fee of 120 Qatari Riyals will apply for each day of delay from the due date until the overdue payments are settled.`;
    const splitPenalty = doc.splitTextToSize(penaltyText, 170);
    doc.text(splitPenalty, leftMargin + 15, y);
    y += splitPenalty.length * lineHeight + lineHeight;
    
    // Article 6 - Security Deposit
    doc.setFont('helvetica', 'bold');
    doc.text('Article 6 - Security Deposit:', leftMargin, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    const depositText = `Party Two agrees to pay a security deposit of ${formatCurrency(agreement.deposit_amount || 0)} to Party One upon signing this Agreement, to guarantee Party Two's obligations under this Agreement and to compensate Party One for any damages caused to the vehicle during the rental period.`;
    const splitDeposit = doc.splitTextToSize(depositText, 170);
    doc.text(splitDeposit, leftMargin + 15, y);
    y += splitDeposit.length * lineHeight + lineHeight;
    
    // Continue with remaining articles (adding new pages as needed)
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    
    // Articles 7-15 (add more as needed)
    const remainingArticles = [
      {
        title: 'Article 7 - Inspection:',
        content: "Party Two acknowledges that by signing this Agreement, they have inspected the vehicle and accept it as it is, confirming it is in good condition and free from defects. Party One makes no warranties, either express or implied, regarding the vehicle's condition."
      },
      {
        title: 'Article 8 - Vehicle Delivery:',
        content: "Upon signing this Agreement, Party One will deliver the rented vehicle to Party Two according to the attached delivery receipt, which both Parties will sign. Party Two is responsible for any damage or violations related to the vehicle during the rental period."
      },
      {
        title: "Article 9 - Lessee's Representations and Warranties:",
        content: "Party Two agrees to the following:\n• Responsibility for traffic violations during the rental period, to be settled within 30 days.\n• All operating costs for the vehicle, including fuel, oils, and consumables.\n• Responsibility for regular and non-regular maintenance of the vehicle.\n• Party Two is solely responsible for the vehicle's damage, either partial or total, due to negligence.\n• Party Two shall drive the vehicle solely for personal use and may not allow anyone else to drive it."
      },
      {
        title: 'Article 10 - Insurance Requirements:',
        content: "Party Two must provide comprehensive insurance coverage for the rented vehicle from an approved insurance company and maintain the policy throughout the rental period."
      },
      {
        title: 'Article 11 - Purchase Option:',
        content: "If Party Two wishes to purchase the vehicle at the end of the rental term, they must notify Party One in writing. The vehicle price is equal to the monthly rental value."
      },
      {
        title: 'Article 12 - Default by Party Two:',
        content: "The following actions will constitute a breach by Party Two:\n• Failure to pay rental payments or any amount due under this Agreement.\n• Breach of any non-financial obligation under this Agreement.\n• Bankruptcy or insolvency of Party Two.\n• Abandonment of the vehicle.\n• Departure or deportation of Party Two from the country.\n• Failure to pay traffic fines within 30 days of the violation."
      },
      {
        title: 'Article 13 - Consequences of Default:',
        content: "In the event of a default by Party Two, Party One may terminate the Agreement, immediately retrieve the vehicle, and impose a penalty of 5000 Qatari Riyals."
      },
      {
        title: 'Article 14 - Early Payment:',
        content: "Party Two may not terminate the Agreement early without Party One's prior written consent and must notify Party One a month in advance if they wish to pay off the remaining balance."
      },
      {
        title: 'Article 15 - General Provisions:',
        content: "• Governing Law and Jurisdiction: This Agreement is governed by the laws of Qatar, and the Parties agree to the exclusive jurisdiction of Qatari courts.\n• Communications: Any notices or communications under this Agreement may be made via WhatsApp, email, or text message.\n• Assignment: Party Two may not assign or transfer their rights or obligations under this Agreement without prior written consent from Party One.\n• Severability: If any provision of this Agreement is deemed unenforceable, the remainder of the Agreement shall remain in effect.\n• Entire Agreement: This Agreement constitutes the entire understanding between the Parties and supersedes any prior discussions or agreements.\n• Copies: This Agreement may be executed in multiple counterparts, each of which is considered an original."
      }
    ];
    
    for (const article of remainingArticles) {
      // Check if we need a new page
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(article.title, leftMargin, y);
      y += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      const contentLines = article.content.split('\n');
      
      for (const line of contentLines) {
        const splitContent = doc.splitTextToSize(line, 160);
        doc.text(splitContent, leftMargin + 15, y);
        y += splitContent.length * lineHeight;
      }
      
      y += lineHeight;
    }
    
    // Add signature section
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('In witness whereof, this Agreement is signed by the Parties in two copies, one for each Party.', leftMargin, y);
    y += lineHeight * 3;
    
    doc.text('Party One:', leftMargin, y);
    doc.text('Party Two:', leftMargin + 100, y);
    y += lineHeight;
      doc.setFont('helvetica', 'normal');
    doc.text('Represented by Mr. Khamees Hashem Al-Jaber', leftMargin, y);
    doc.text(`Represented by Mr. ${customerName}`, leftMargin + 100, y);
    
    // Add footer image to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Add footer image to center of the page
      addFooterImage(doc);
      
      // Add page number
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 25, { align: 'center' });
      doc.text('CONFIDENTIAL - ALARAF CAR RENTAL', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5, { align: 'center' });
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
