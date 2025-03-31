
import jsPDF from 'jspdf';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { loadFontFile, arrayBufferToBase64, toArabicNumerals } from './fontUtils';
import { supabase } from '@/lib/supabase';

// Function to load the Amiri font for Arabic text
async function loadArabicFont(doc: jsPDF): Promise<boolean> {
  try {
    // Try to load font from files
    const boldFontBuffer = await loadFontFile('/fonts/Amiri-Bold.ttf');
    const regularFontBuffer = await loadFontFile('/fonts/Amiri-Regular.ttf');
    
    if (boldFontBuffer && regularFontBuffer) {
      console.log("Font files loaded successfully");
      
      doc.addFileToVFS('Amiri-Bold.ttf', arrayBufferToBase64(boldFontBuffer));
      doc.addFileToVFS('Amiri-Regular.ttf', arrayBufferToBase64(regularFontBuffer));
      
      doc.addFont('Amiri-Bold.ttf', 'Amiri', 'bold');
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      
      return true;
    }
    
    // If loading from files fails, log an error
    console.error("Font files could not be loaded");
    return false;
  } catch (error) {
    console.error("Error loading Arabic fonts:", error);
    return false;
  }
}

// Check if standard template exists
export async function checkStandardTemplateExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from('agreements')
      .list();
      
    if (error) {
      console.error("Error checking template:", error);
      return false;
    }
    
    // Look for any of the standard template filenames
    const templateNames = ['agreement_template.docx', 'agreement temp.docx', 'agreement_temp.docx'];
    return data.some(file => templateNames.includes(file.name));
  } catch (error) {
    console.error("Error in checkStandardTemplateExists:", error);
    return false;
  }
}

// Template access diagnosis function
export async function diagnosisTemplateAccess(): Promise<{
  bucketExists: boolean;
  templateExists: boolean;
  errors: string[];
}> {
  const result = {
    bucketExists: false,
    templateExists: false,
    errors: [] as string[]
  };
  
  try {
    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      result.errors.push(`Bucket error: ${bucketsError.message}`);
      return result;
    }
    
    result.bucketExists = buckets.some(bucket => bucket.name === 'agreements');
    
    if (!result.bucketExists) {
      result.errors.push('Agreements bucket does not exist');
      return result;
    }
    
    // Check for template files
    const { data: files, error: filesError } = await supabase.storage
      .from('agreements')
      .list();
      
    if (filesError) {
      result.errors.push(`Files listing error: ${filesError.message}`);
      return result;
    }
    
    const templateNames = ['agreement_template.docx', 'agreement temp.docx', 'agreement_temp.docx'];
    result.templateExists = files.some(file => templateNames.includes(file.name));
    
    if (!result.templateExists) {
      result.errors.push('Template file not found in agreements bucket');
    }
    
    return result;
  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
}

export async function generatePdfDocument(agreement: Agreement, language: string = 'english'): Promise<boolean> {
  try {
    console.log("Starting PDF generation with language:", language);
    console.log("Agreement data:", JSON.stringify(agreement, null, 2));
    
    // Initialize PDF document with proper settings for RTL support if needed
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,  // Add this to improve font handling
      compress: true           // Compress the PDF for better performance
    });
    
    // Load fonts based on language
    if (language === 'arabic' || language === 'both') {
      console.log("Loading Arabic fonts...");
      const fontLoaded = await loadArabicFont(doc);
      if (!fontLoaded) {
        console.error("Failed to load Arabic fonts - falling back to default font");
        // Continue with default font if Arabic fonts fail to load
      } else {
        console.log("Arabic fonts loaded successfully");
      }
    }
    
    // Set font for English text - FIXED: removed extra parameters
    doc.setFont('helvetica');
    console.log("English font set");
    
    // Get start and end dates
    const startDate = agreement.start_date instanceof Date 
      ? agreement.start_date 
      : new Date(agreement.start_date);
      
    const endDate = agreement.end_date instanceof Date 
      ? agreement.end_date 
      : new Date(agreement.end_date);
    
    // Format dates
    const formattedStartDate = startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedEndDate = endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Handle customer data
    const customerName = agreement.customers?.full_name || 'N/A';
    const customerPhone = agreement.customers?.phone_number || 'N/A';
    const customerEmail = agreement.customers?.email || 'N/A';
    const customerAddress = agreement.customers?.address || 'N/A';
    const driverLicense = agreement.customers?.driver_license || 'N/A';
    
    // Handle vehicle data
    const vehicleMake = agreement.vehicles?.make || 'N/A';
    const vehicleModel = agreement.vehicles?.model || 'N/A';
    const vehicleYear = agreement.vehicles?.year || 'N/A';
    const vehiclePlate = agreement.vehicles?.license_plate || 'N/A';
    const vehicleVin = agreement.vehicles?.vin || 'N/A';
    
    // Handle rent amount safely
    const rentAmount = agreement.rent_amount || 0;
    const totalAmount = agreement.total_amount || 0;
    const depositAmount = agreement.deposit_amount || 0;
    
    console.log("Document data prepared");
    
    // Generate English PDF
    if (language === 'english' || language === 'both') {
      console.log("Generating English content");
      // Title
      doc.setFontSize(18);
      // FIXED: removed second parameter in setFont calls
      doc.setFont('helvetica', 'bold');
      doc.text('RENTAL AGREEMENT', 105, 20, { align: 'center' });
      doc.text(`Agreement #: ${agreement.agreement_number}`, 105, 30, { align: 'center' });
      
      // Customer information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', 20, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${customerName}`, 20, 55);
      doc.text(`Phone: ${customerPhone}`, 20, 60);
      doc.text(`Email: ${customerEmail}`, 20, 65);
      doc.text(`Address: ${customerAddress}`, 20, 70);
      doc.text(`Driver License: ${driverLicense}`, 20, 75);
      
      // Vehicle information
      doc.setFont('helvetica', 'bold');
      doc.text('VEHICLE INFORMATION', 20, 90);
      doc.setFont('helvetica', 'normal');
      doc.text(`Make: ${vehicleMake}`, 20, 100);
      doc.text(`Model: ${vehicleModel}`, 20, 105);
      doc.text(`Year: ${vehicleYear}`, 20, 110);
      doc.text(`License Plate: ${vehiclePlate}`, 20, 115);
      doc.text(`VIN: ${vehicleVin}`, 20, 120);
      
      // Agreement details
      doc.setFont('helvetica', 'bold');
      doc.text('RENTAL PERIOD', 20, 135);
      doc.setFont('helvetica', 'normal');
      doc.text(`Start Date: ${formattedStartDate}`, 20, 145);
      doc.text(`End Date: ${formattedEndDate}`, 20, 150);
      
      // Payment information
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT INFORMATION', 20, 165);
      doc.setFont('helvetica', 'normal');
      doc.text(`Monthly Rent: QAR ${rentAmount.toLocaleString()}`, 20, 175);
      doc.text(`Total Amount: QAR ${totalAmount.toLocaleString()}`, 20, 180);
      doc.text(`Deposit Amount: QAR ${depositAmount.toLocaleString()}`, 20, 185);
      
      // Signatures
      doc.setFont('helvetica', 'bold');
      doc.text('SIGNATURES', 20, 200);
      doc.setFont('helvetica', 'normal');
      doc.text('Customer Signature: _______________________', 20, 210);
      doc.text('Company Signature: _______________________', 20, 220);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 230);
      
      console.log("English content generated");
      
      // If bilingual, add new page for Arabic
      if (language === 'both') {
        doc.addPage();
        console.log("Added new page for Arabic content");
      }
    }
    
    // Generate Arabic PDF
    if (language === 'arabic' || language === 'both') {
      console.log("Generating Arabic content");
      
      try {
        // If not creating a bilingual document, we don't need to add a page
        if (language === 'arabic') {
          // We're starting on the first page
        } else {
          // We've already added a new page for Arabic
        }
        
        // Set RTL and Arabic font
        doc.setR2L(true);
        
        // Check if Amiri font was loaded successfully, otherwise use a fallback
        const hasAmiriBold = doc.getFont('Amiri', 'bold').fontName === 'Amiri';
        const hasAmiriNormal = doc.getFont('Amiri', 'normal').fontName === 'Amiri';
        
        console.log("Font availability:", { 
          hasAmiriBold, 
          hasAmiriNormal 
        });
        
        // FIXED: Properly set font without extra parameters
        if (hasAmiriBold) {
          doc.setFont('Amiri', 'bold');
          console.log("Using Amiri Bold font for Arabic content");
        } else {
          // Fallback to a system font
          doc.setFont('helvetica', 'bold');
          console.log("Using fallback font for Arabic as Amiri not loaded");
        }
        
        // Arabic Title
        doc.setFontSize(18);
        doc.text('عقد إيجار', 105, 20, { align: 'center' });
        doc.text(`رقم العقد: ${toArabicNumerals(String(agreement.agreement_number || ''))}`, 105, 30, { align: 'center' });
        
        // Customer information in Arabic
        doc.setFontSize(12);
        doc.text('معلومات العميل', 190, 45, { align: 'right' });
        
        // FIXED: Properly set font without extra parameters
        if (hasAmiriNormal) {
          doc.setFont('Amiri', 'normal');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        doc.text(`الاسم: ${customerName}`, 190, 55, { align: 'right' });
        doc.text(`الهاتف: ${toArabicNumerals(String(customerPhone))}`, 190, 60, { align: 'right' });
        doc.text(`البريد الإلكتروني: ${customerEmail}`, 190, 65, { align: 'right' });
        doc.text(`العنوان: ${customerAddress}`, 190, 70, { align: 'right' });
        doc.text(`رخصة القيادة: ${driverLicense}`, 190, 75, { align: 'right' });
        
        // Vehicle information in Arabic
        if (hasAmiriBold) {
          doc.setFont('Amiri', 'bold');
        } else {
          doc.setFont('helvetica', 'bold');
        }
        
        doc.text('معلومات المركبة', 190, 90, { align: 'right' });
        
        if (hasAmiriNormal) {
          doc.setFont('Amiri', 'normal');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        doc.text(`الصنع: ${vehicleMake}`, 190, 100, { align: 'right' });
        doc.text(`الموديل: ${vehicleModel}`, 190, 105, { align: 'right' });
        
        // Handle vehicleYear safely with proper string conversion
        let yearString = '';
        if (vehicleYear !== null && vehicleYear !== undefined) {
          yearString = String(vehicleYear);
        } else {
          yearString = 'N/A';
        }
        doc.text(`السنة: ${toArabicNumerals(yearString)}`, 190, 110, { align: 'right' });
        
        doc.text(`رقم اللوحة: ${vehiclePlate}`, 190, 115, { align: 'right' });
        doc.text(`رقم الهيكل: ${vehicleVin}`, 190, 120, { align: 'right' });
        
        // Agreement details in Arabic
        if (hasAmiriBold) {
          doc.setFont('Amiri', 'bold');
        } else {
          doc.setFont('helvetica', 'bold');
        }
        
        doc.text('فترة الإيجار', 190, 135, { align: 'right' });
        
        if (hasAmiriNormal) {
          doc.setFont('Amiri', 'normal');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        // Convert dates to Arabic format - safely handle date formatting
        try {
          const arabicStartDate = toArabicNumerals(startDate.toLocaleDateString('ar-SA'));
          const arabicEndDate = toArabicNumerals(endDate.toLocaleDateString('ar-SA'));
          doc.text(`تاريخ البدء: ${arabicStartDate}`, 190, 145, { align: 'right' });
          doc.text(`تاريخ الانتهاء: ${arabicEndDate}`, 190, 150, { align: 'right' });
        } catch (dateError) {
          console.error("Error formatting dates to Arabic:", dateError);
          // Fallback to ISO format if localization fails
          doc.text(`تاريخ البدء: ${toArabicNumerals(startDate.toISOString().split('T')[0])}`, 190, 145, { align: 'right' });
          doc.text(`تاريخ الانتهاء: ${toArabicNumerals(endDate.toISOString().split('T')[0])}`, 190, 150, { align: 'right' });
        }
        
        // Payment information in Arabic
        if (hasAmiriBold) {
          doc.setFont('Amiri', 'bold');
        } else {
          doc.setFont('helvetica', 'bold');
        }
        
        doc.text('معلومات الدفع', 190, 165, { align: 'right' });
        
        if (hasAmiriNormal) {
          doc.setFont('Amiri', 'normal');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        // Safely convert numbers to strings before using toArabicNumerals
        doc.text(`الإيجار الشهري: ${toArabicNumerals(String(rentAmount))} ر.ق`, 190, 175, { align: 'right' });
        doc.text(`المبلغ الإجمالي: ${toArabicNumerals(String(totalAmount))} ر.ق`, 190, 180, { align: 'right' });
        doc.text(`مبلغ التأمين: ${toArabicNumerals(String(depositAmount))} ر.ق`, 190, 185, { align: 'right' });
        
        // Signatures in Arabic
        if (hasAmiriBold) {
          doc.setFont('Amiri', 'bold');
        } else {
          doc.setFont('helvetica', 'bold');
        }
        
        doc.text('التوقيعات', 190, 200, { align: 'right' });
        
        if (hasAmiriNormal) {
          doc.setFont('Amiri', 'normal');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        doc.text('توقيع العميل: _______________________', 190, 210, { align: 'right' });
        doc.text('توقيع الشركة: _______________________', 190, 220, { align: 'right' });
        
        try {
          const currentDate = new Date();
          const arabicDate = toArabicNumerals(currentDate.toLocaleDateString('ar-SA'));
          doc.text(`التاريخ: ${arabicDate}`, 190, 230, { align: 'right' });
        } catch (dateError) {
          console.error("Error formatting current date to Arabic:", dateError);
          // Fallback to ISO format
          doc.text(`التاريخ: ${toArabicNumerals(new Date().toISOString().split('T')[0])}`, 190, 230, { align: 'right' });
        }
        
        console.log("Arabic content generated successfully");
      } catch (arabicError) {
        console.error("Error generating Arabic section:", arabicError);
        // Continue with just English if Arabic fails
      }
    }
    
    // Save the PDF file
    const fileName = `Rental_Agreement_${agreement.agreement_number}_${language}.pdf`;
    console.log("Saving PDF:", fileName);
    doc.save(fileName);
    console.log("PDF generated successfully");
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}

// Helper function to process template with dynamic values
export const processAgreementTemplate = (templateText: string, data: any): string => {
  // Replace placeholders with actual data
  let processedTemplate = templateText;
  
  // Customer data
  if (data.customer_data) {
    processedTemplate = processedTemplate
      .replace(/\{\{CUSTOMER_NAME\}\}/g, data.customer_data.full_name || '')
      .replace(/\{\{CUSTOMER_EMAIL\}\}/g, data.customer_data.email || '')
      .replace(/\{\{CUSTOMER_PHONE\}\}/g, data.customer_data.phone_number || '')
      .replace(/\{\{CUSTOMER_LICENSE\}\}/g, data.customer_data.driver_license || '')
      .replace(/\{\{CUSTOMER_NATIONALITY\}\}/g, data.customer_data.nationality || '')
      .replace(/\{\{CUSTOMER_ADDRESS\}\}/g, data.customer_data.address || '');
  }
  
  // Vehicle data
  if (data.vehicle_data) {
    processedTemplate = processedTemplate
      .replace(/\{\{VEHICLE_MAKE\}\}/g, data.vehicle_data.make || '')
      .replace(/\{\{VEHICLE_MODEL\}\}/g, data.vehicle_data.model || '')
      .replace(/\{\{VEHICLE_YEAR\}\}/g, data.vehicle_data.year?.toString() || '')
      .replace(/\{\{VEHICLE_COLOR\}\}/g, data.vehicle_data.color || '')
      .replace(/\{\{VEHICLE_PLATE\}\}/g, data.vehicle_data.license_plate || '')
      .replace(/\{\{VEHICLE_VIN\}\}/g, data.vehicle_data.vin || '');
  }
  
  // Agreement data
  processedTemplate = processedTemplate
    .replace(/\{\{AGREEMENT_NUMBER\}\}/g, data.agreement_number || '')
    .replace(/\{\{START_DATE\}\}/g, new Date(data.start_date).toLocaleDateString() || '')
    .replace(/\{\{END_DATE\}\}/g, new Date(data.end_date).toLocaleDateString() || '')
    .replace(/\{\{RENT_AMOUNT\}\}/g, data.rent_amount?.toString() || '')
    .replace(/\{\{DEPOSIT_AMOUNT\}\}/g, data.deposit_amount?.toString() || '')
    .replace(/\{\{TOTAL_AMOUNT\}\}/g, data.total_amount?.toString() || '')
    .replace(/\{\{DAILY_LATE_FEE\}\}/g, data.daily_late_fee?.toString() || '')
    .replace(/\{\{AGREEMENT_DURATION\}\}/g, data.agreement_duration || '')
    .replace(/\{\{CURRENT_DATE\}\}/g, new Date().toLocaleDateString());
    
  return processedTemplate;
};

