import { Agreement } from '@/lib/validation-schemas/agreement';
import jsPDF from 'jspdf';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInMonths } from 'date-fns';

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const toArabicNumerals = (str: string): string => {
  return str.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
};

export const generatePdfDocument = async (agreement: Agreement, language = 'english'): Promise<boolean> => {
  try {
    if (language === 'both') {
      await generateEnglishPdf(agreement);
      await generateArabicPdf(agreement);
      return true;
    } else if (language === 'arabic') {
      return await generateArabicPdf(agreement);
    } else {
      return await generateEnglishPdf(agreement);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};

const generateArabicPdf = async (agreement: Agreement): Promise<boolean> => {
  try {
    // Create PDF with right-to-left support
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      hotfixes: ["px_scaling"]
    });

    // Load Amiri font for Arabic text
    await doc.addFont('/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    await doc.addFont('/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');

    // Set document properties
    doc.setR2L(true);
    doc.setLanguage("ar");
    doc.setFont('Amiri');
    doc.setFontSize(12);

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightMargin = pageWidth - 20;
    const lineHeight = 10;
    let y = 20;

    // Header
    doc.setFont('Amiri', 'bold');
    doc.setFontSize(18);
    doc.text('عقد إيجار سيارة', pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 2;

    // Agreement details
    doc.setFontSize(12);
    doc.text(`رقم العقد: ${toArabicNumerals(agreement.agreement_number || '')}`, rightMargin, y, { align: 'right' });
    y += lineHeight;

    // Format dates
    const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
    const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);

    // Calculate duration
    const durationMonths = differenceInMonths(endDate, startDate);
    const duration = `${durationMonths} ${durationMonths === 1 ? 'شهر' : 'أشهر'}`;

    // Customer details
    const customerName = agreement.customers?.full_name || 'غير متوفر';
    const customerEmail = agreement.customers?.email || 'غير متوفر';
    const customerPhone = agreement.customers?.phone_number || 'غير متوفر';
    const customerLicense = agreement.customers?.license_number || 'غير متوفر';
    const customerNationality = agreement.customers?.nationality || 'غير متوفر';

    // Vehicle details
    const vehicleMake = agreement.vehicles?.make || 'غير متوفر';
    const vehicleModel = agreement.vehicles?.model || 'غير متوفر';
    const vehiclePlate = agreement.vehicles?.license_plate || 'غير متوفر';
    const vehicleVin = agreement.vehicles?.vin || 'غير متوفر';

    // Add contract parties
    doc.text('الأطراف المتعاقدة:', rightMargin, y, { align: 'right' });
    y += lineHeight * 2;

    const partyOneArabic = 'الطرف الأول: شركة العراف لتأجير السيارات ذ.م.م';
    doc.text(partyOneArabic, rightMargin, y, { align: 'right' });
    y += lineHeight * 2;

    const partyTwoArabic = `الطرف الثاني: ${customerName}`;
    doc.text(partyTwoArabic, rightMargin, y, { align: 'right' });
    y += lineHeight * 2;

    // Add vehicle information
    doc.setFont('Amiri', 'bold');
    doc.text('بيانات المركبة:', rightMargin, y, { align: 'right' });
    y += lineHeight;

    doc.setFont('Amiri', 'normal');
    doc.text(`نوع المركبة: ${vehicleMake} ${vehicleModel}`, rightMargin, y, { align: 'right' });
    y += lineHeight;
    doc.text(`رقم اللوحة: ${vehiclePlate}`, rightMargin, y, { align: 'right' });
    y += lineHeight;
    doc.text(`رقم الهيكل: ${vehicleVin}`, rightMargin, y, { align: 'right' });
    y += lineHeight * 2;

    // Add rental period
    doc.setFont('Amiri', 'bold');
    doc.text('مدة الإيجار:', rightMargin, y, { align: 'right' });
    y += lineHeight;

    doc.setFont('Amiri', 'normal');
    doc.text(`من: ${formatDate(startDate)}`, rightMargin, y, { align: 'right' });
    y += lineHeight;
    doc.text(`إلى: ${formatDate(endDate)}`, rightMargin, y, { align: 'right' });
    y += lineHeight * 2;

    // Save the document
    doc.save(`Rental_Agreement_AR-${agreement.agreement_number}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating Arabic PDF:", error);
    return false;
  }
};

const generateEnglishPdf = async (agreement: Agreement): Promise<boolean> => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 20;
    const lineHeight = 10;
    let y = 20;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('VEHICLE RENTAL AGREEMENT', pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 2;

    // Agreement Number
    doc.setFontSize(12);
    doc.text(`Agreement Number: ${agreement.agreement_number}`, leftMargin, y);
    y += lineHeight * 2;

    // Format dates and get duration
    const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
    const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
    const durationMonths = differenceInMonths(endDate, startDate);
    const duration = `${durationMonths} month${durationMonths !== 1 ? 's' : ''}`;

    // Add parties
    doc.setFont('helvetica', 'bold');
    doc.text('BETWEEN:', leftMargin, y);
    y += lineHeight * 2;

    doc.setFont('helvetica', 'normal');
    const partyOne = 'ALARAF CAR RENTAL LLC, a limited liability company duly registered under the laws of Qatar, with Commercial Registration No. 146832, located in Umm Salal Ali, Doha, Qatar, P.O. Box 36126. Represented by Mr. Khamees Hashem Al-Jaber, authorized signatory of the company, hereinafter referred to as the "Lessor | Party One".';
    const splitPartyOne = doc.splitTextToSize(partyOne, 170);
    doc.text(splitPartyOne, leftMargin, y);
    y += splitPartyOne.length * lineHeight + lineHeight;

    doc.text('AND:', leftMargin, y);
    y += lineHeight;

    const customerName = agreement.customers?.full_name || 'N/A';
    const customerEmail = agreement.customers?.email || 'N/A';
    const customerPhone = agreement.customers?.phone_number || 'N/A';
    const partyTwo = `${customerName}, holder of Driver\'s License ${agreement.customers?.license_number || 'N/A'}, ${agreement.customers?.nationality || 'N/A'} national, resident in Qatar, email ${customerEmail}, mobile number ${customerPhone}. Hereinafter referred to as the "Lessee | Party Two".`;
    const splitPartyTwo = doc.splitTextToSize(partyTwo, 170);
    doc.text(splitPartyTwo, leftMargin, y);
    y += splitPartyTwo.length * lineHeight + lineHeight;

    // Vehicle information
    doc.setFont('helvetica', 'bold');
    doc.text('VEHICLE INFORMATION:', leftMargin, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.text(`Make & Model: ${agreement.vehicles?.make || 'N/A'} ${agreement.vehicles?.model || 'N/A'}`, leftMargin, y);
    y += lineHeight;
    doc.text(`License Plate: ${agreement.vehicles?.license_plate || 'N/A'}`, leftMargin, y);
    y += lineHeight;
    doc.text(`VIN: ${agreement.vehicles?.vin || 'N/A'}`, leftMargin, y);
    y += lineHeight * 2;

    // Rental period
    doc.setFont('helvetica', 'bold');
    doc.text('RENTAL PERIOD:', leftMargin, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.text(`From: ${formatDate(startDate)}`, leftMargin, y);
    y += lineHeight;
    doc.text(`To: ${formatDate(endDate)}`, leftMargin, y);
    y += lineHeight * 2;

    // Save the document
    doc.save(`Rental_Agreement_EN-${agreement.agreement_number}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating English PDF:", error);
    return false;
  }
};

const getEnglishArticles = (agreement: Agreement, vehiclePlate: string, vehicleVin: string, vehicleModel: string, vehicleMake: string, duration: string, leftMargin: number, lineHeight: number) => {
  return [
    {
      title: 'Article 2 - Vehicle Information:',
      content: 'Party One hereby rents to Party Two the following vehicle:\n' +
        `Vehicle Type:\n` +
        `License Plate Number: ${vehiclePlate}\n` +
        `VIN: ${vehicleVin}\n` +
        `Model: ${vehicleModel} - ${vehicleMake}`
    },
    {
      title: 'Article 3 - Rental Duration:',
      content: `The rental duration of this Agreement is ${duration}, commencing from the effective date of this Agreement. The Agreement is non-renewable and will terminate upon the expiration of the term. Party Two may not terminate the Agreement before its expiration without written consent from Party One.`
    },
    {
      title: 'Article 4 - Rental Fee:',
      content: `Party Two agrees to pay Party One a monthly rental fee of ${formatCurrency(agreement.total_amount || 0)}, in accordance with the attached payment schedule. Party Two agrees to make full monthly rental payments regularly and without deductions for any fees, taxes, or other charges.`
    },
    {
      title: 'Article 5 - Late Payment Penalties:',
      content: `Payments are due on the first day of each month. If Party Two fails to make a payment on time, a late fee of 120 Qatari Riyals will apply for each day of delay from the due date until the overdue payments are settled.`
    },
    {
      title: 'Article 6 - Security Deposit:',
      content: `Party Two agrees to pay a security deposit of ${formatCurrency(agreement.deposit_amount || 0)} to Party One upon signing this Agreement, to guarantee Party Two's obligations under this Agreement and to compensate Party One for any damages caused to the vehicle during the rental period.`
    },
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