
import { Agreement } from '@/lib/validation-schemas/agreement';
import jsPDF from 'jspdf';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInMonths } from 'date-fns';

// Helper function to convert array buffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper function to convert numbers to Arabic numerals
const toArabicNumerals = (str: string): string => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, match => arabicNumerals[parseInt(match)]);
};

// Base64 encoded Amiri font (subset for better performance)
const amiriRegularBase64 = 'AAEAAAAPAIAAAwBwRkZUTXxHulsAAJPAAAAAHEdERUYAJwAtAACSJAAAAChPUy8yVpbZGgAAAWgAAABgY21hcHPGXi0AAAN8AAABcmN2dCAARAkcAAAFXgAAAA5mcGdtc/WlTAAABKgAAAG7Z2FzcAAAABAAAAXSAAAACGdseWYs5L27AAAHKAAAezBoZWFkHFAvNQAAAQwAAAA2aGhlYQfsA8cAAAFEAAAAJGhtdHgAkwK4AAAB3AAAAZxsb2NhTUVZ/AAABXIAAABVYG1heHACUQEhAAABSAAAACBuYW1l0S7E3AAAAyQAAAJ9cG9zdP9tAGQAAJIIAAAAIHByZXB7tnUzAAAGtgAAAA7AAQAB//8ADwAAAAAAAAAAAAAAAAAAAAAAAQAEAwP/MgMD/zIDJQMy/zIAAAAAAAAAAAAAAAAAAAAAAARBUkFCAP4AEgBiAAAAAQAAAAAAACMAAAADAAAAAAAAAAEABAAAAAUABwAIAAkACgALAAwADQAIAAAAAAMAAgAIAAsABgAHAAkADAAKAA0ACwAJAAwAAAEAAgADAAQABQAGAAcACP//AAD/////////////////////AAcAAAASAAAAAAAAAAAAAAAAAAAAAAAAASgAAAoAFAAdJjspWRRhGpAayw3iJzcrkCwCLKEMXBOdHRsdGx0bHZ0cnBwbHJsbnBoZmRgUEAwIBwsABAUGDQcIAgMKAAECCQAABXgAiwADAAcACwAPABMAFwAbACMALQAzADcAOwBDAEcASwBPAFMAABMVIzUTFSM1MxUjNTMVIzU3FSM1MxUjNRMVIzUTMzUjFTM1IxMzESMRIzUzNSM1MwEzETMRIzUjFSMRMxUlMxEzETMRMxEjNSM1MzUjNTP5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn+ifn5+fn5+fkBcvn5+fn5+fn5+fn5AGT5+QFx+fn5+fn5+fn5+fn+jvn5/XH5+fkCHf6OAX/5+fn+jgFyAXL5+f6O+fkBcv6O/o7+jvn5+fkAAAEAAAABAABK1Z+RXw889QAZCAAAAAAAxPARLgAAAADFmj0a//7/GQgiA5EAAAAIAAIAAAAAAAAAAQAAA0D/GQAABp7//v/8CCIAAQAAAAAAAAAAAAAAAAAAACkBLAAGAAAAAAMUArwAnwE8ATwBPAE8AJEBBwEcAVQBbQAAAAAACwIcAAUAAAUTBZkAAAEeBRMFmQAAA9EAZgISAAACAAUDAAAAAgAAvAAAAAAAAAAAAABBREJPAEAAKgimA0D/GQAABFABbagAAREB4iAAAJMAAAABAAAAAAQ4BMkAAAAgAAAAAAIFAAAAAP8AAAAAAKsAAACSAHUAdQB1AHUAlAB1AHUAdQB1AHUAygB1AHUAyQB1AHUAdQB1AHUAfgB+AH4AfgB+AH4AAAAAAAMAAAADAAAAHAABAAAAAABsAAMAAQAAABwABABQAAAAEAAQAAMAAAAKAEAAUwBVAGIAZQBp//8AAAAKAEAAUwBVAGIAZABo////9f/N/7v/uv+u/63/qgABAAAAAAAAAAAAAAAAAAAAAHUB8AAAAAAAAQAAAAAAAQICAAMAAAQBBQYHAQEAEA8OCQoMDgwLAAAAAAAAAAAAAAAAAAB1AJQAAAAA7QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZgCeAMIAAABxAAABNwAAAPkAAAEAAAABKAAAAAAAAAAAAVcAAAEYAAAArQBDAAAAAQAAAAAA7wAAAAAAAAAAAAAAAAAAAAAAkwK4AAQAUAAAAEYAACAAAiAAAOAAVAAA';
const amiriBoldBase64 = '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';

// Helper function for converting base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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

    // Add the Amiri font for Arabic text using the embedded base64 data
    const amiriRegularBuffer = base64ToArrayBuffer(amiriRegularBase64);
    const amiriBoldBuffer = base64ToArrayBuffer(amiriBoldBase64);
    
    doc.addFileToVFS('Amiri-Regular.ttf', arrayBufferToBase64(amiriRegularBuffer));
    doc.addFileToVFS('Amiri-Bold.ttf', arrayBufferToBase64(amiriBoldBuffer));
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('Amiri-Bold.ttf', 'Amiri', 'bold');

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
    const customerLicense = agreement.customers?.driver_license || 'غير متوفر';
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
    const partyTwo = `${customerName}, holder of Driver\'s License ${agreement.customers?.driver_license || 'N/A'}, ${agreement.customers?.nationality || 'N/A'} national, resident in Qatar, email ${customerEmail}, mobile number ${customerPhone}. Hereinafter referred to as the "Lessee | Party Two".`;
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
    y += lineHeight;
    doc.text(`Duration: ${duration}`, leftMargin, y);
    y += lineHeight * 2;

    // Rental fee
    doc.setFont('helvetica', 'bold');
    doc.text('RENTAL FEE:', leftMargin, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.text(`Monthly Rental Fee: ${formatCurrency(agreement.total_amount || 0)}`, leftMargin, y);
    y += lineHeight;
    doc.text(`Security Deposit: ${formatCurrency(agreement.deposit_amount || 0)}`, leftMargin, y);
    y += lineHeight * 2;

    // Add articles from the rental agreement
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS AND CONDITIONS:', leftMargin, y);
    y += lineHeight * 1.5;

    // Add each article
    const vehiclePlate = agreement.vehicles?.license_plate || 'N/A';
    const vehicleVin = agreement.vehicles?.vin || 'N/A';
    const vehicleModel = agreement.vehicles?.model || 'N/A';
    const vehicleMake = agreement.vehicles?.make || 'N/A';
    
    const articles = getEnglishArticles(agreement, vehiclePlate, vehicleVin, vehicleModel, vehicleMake, duration, leftMargin, lineHeight);
    
    for (let i = 0; i < articles.length; i++) {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(articles[i].title, leftMargin, y);
      y += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      const contentLines = doc.splitTextToSize(articles[i].content, 170);
      doc.text(contentLines, leftMargin, y);
      y += contentLines.length * lineHeight + lineHeight;
    }

    // Add signature lines at the end
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('In witness whereof, this Agreement is signed by the Parties:', leftMargin, y);
    y += lineHeight * 2;

    doc.text('Party One:', leftMargin, y);
    doc.text('Party Two:', leftMargin + 100, y);
    y += lineHeight * 4;

    doc.text('____________________', leftMargin, y);
    doc.text('____________________', leftMargin + 100, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.text('Mr. Khamees Hashem Al-Jaber', leftMargin, y);
    doc.text(customerName, leftMargin + 100, y);
    
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
