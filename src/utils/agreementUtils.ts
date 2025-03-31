import jsPDF from 'jspdf';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { loadFontFile, arrayBufferToBase64, toArabicNumerals } from './fontUtils';

// Function to load the Amiri font for Arabic text
async function loadArabicFont(doc: jsPDF): Promise<boolean> {
  try {
    // Try to load font from files
    const boldFontBuffer = await loadFontFile('/fonts/Amiri-Bold.ttf');
    const regularFontBuffer = await loadFontFile('/fonts/Amiri-Regular.ttf');
    
    if (boldFontBuffer && regularFontBuffer) {
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

export async function generatePdfDocument(agreement: Agreement, language: string = 'english'): Promise<boolean> {
  try {
    // Initialize PDF document with proper settings for RTL support if needed
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Load fonts based on language
    if (language === 'arabic' || language === 'both') {
      const fontLoaded = await loadArabicFont(doc);
      if (!fontLoaded) {
        console.error("Failed to load Arabic fonts");
        return false;
      }
    }
    
    // Set font for English text
    doc.setFont('helvetica', 'normal');
    
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
    
    // Generate English PDF
    if (language === 'english' || language === 'both') {
      // Title
      doc.setFontSize(18);
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
      doc.text(`Monthly Rent: QAR ${agreement.rent_amount?.toLocaleString() || '0'}`, 20, 175);
      doc.text(`Total Amount: QAR ${agreement.total_amount?.toLocaleString() || '0'}`, 20, 180);
      doc.text(`Deposit Amount: QAR ${agreement.deposit_amount?.toLocaleString() || '0'}`, 20, 185);
      
      // Signatures
      doc.setFont('helvetica', 'bold');
      doc.text('SIGNATURES', 20, 200);
      doc.setFont('helvetica', 'normal');
      doc.text('Customer Signature: _______________________', 20, 210);
      doc.text('Company Signature: _______________________', 20, 220);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 230);
      
      // If bilingual, add new page for Arabic
      if (language === 'both') {
        doc.addPage();
      }
    }
    
    // Generate Arabic PDF
    if (language === 'arabic' || language === 'both') {
      // If not creating a bilingual document, we don't need to add a page
      if (language === 'arabic') {
        // We're starting on the first page
      } else {
        // We've already added a new page for Arabic
      }
      
      // Set RTL and Arabic font
      doc.setR2L(true);
      doc.setFont('Amiri', 'bold');
      
      // Arabic Title
      doc.setFontSize(18);
      doc.text('عقد إيجار', 105, 20, { align: 'center' });
      doc.text(`رقم العقد: ${toArabicNumerals(agreement.agreement_number || '')}`, 105, 30, { align: 'center' });
      
      // Customer information in Arabic
      doc.setFontSize(12);
      doc.text('معلومات العميل', 190, 45, { align: 'right' });
      doc.setFont('Amiri', 'normal');
      doc.text(`الاسم: ${customerName}`, 190, 55, { align: 'right' });
      doc.text(`الهاتف: ${toArabicNumerals(customerPhone)}`, 190, 60, { align: 'right' });
      doc.text(`البريد الإلكتروني: ${customerEmail}`, 190, 65, { align: 'right' });
      doc.text(`العنوان: ${customerAddress}`, 190, 70, { align: 'right' });
      doc.text(`رخصة القيادة: ${driverLicense}`, 190, 75, { align: 'right' });
      
      // Vehicle information in Arabic
      doc.setFont('Amiri', 'bold');
      doc.text('معلومات المركبة', 190, 90, { align: 'right' });
      doc.setFont('Amiri', 'normal');
      doc.text(`الصنع: ${vehicleMake}`, 190, 100, { align: 'right' });
      doc.text(`الموديل: ${vehicleModel}`, 190, 105, { align: 'right' });
      doc.text(`السنة: ${toArabicNumerals(vehicleYear.toString())}`, 190, 110, { align: 'right' });
      doc.text(`رقم اللوحة: ${vehiclePlate}`, 190, 115, { align: 'right' });
      doc.text(`رقم الهيكل: ${vehicleVin}`, 190, 120, { align: 'right' });
      
      // Agreement details in Arabic
      doc.setFont('Amiri', 'bold');
      doc.text('فترة الإيجار', 190, 135, { align: 'right' });
      doc.setFont('Amiri', 'normal');
      // Convert dates to Arabic format
      const arabicStartDate = toArabicNumerals(startDate.toLocaleDateString('ar-SA'));
      const arabicEndDate = toArabicNumerals(endDate.toLocaleDateString('ar-SA'));
      doc.text(`تاريخ البدء: ${arabicStartDate}`, 190, 145, { align: 'right' });
      doc.text(`تاريخ الانتهاء: ${arabicEndDate}`, 190, 150, { align: 'right' });
      
      // Payment information in Arabic
      doc.setFont('Amiri', 'bold');
      doc.text('معلومات الدفع', 190, 165, { align: 'right' });
      doc.setFont('Amiri', 'normal');
      doc.text(`الإيجار الشهري: ${toArabicNumerals((agreement.rent_amount || 0).toString())} ر.ق`, 190, 175, { align: 'right' });
      doc.text(`المبلغ الإجمالي: ${toArabicNumerals((agreement.total_amount || 0).toString())} ر.ق`, 190, 180, { align: 'right' });
      doc.text(`مبلغ التأمين: ${toArabicNumerals((agreement.deposit_amount || 0).toString())} ر.ق`, 190, 185, { align: 'right' });
      
      // Signatures in Arabic
      doc.setFont('Amiri', 'bold');
      doc.text('التوقيعات', 190, 200, { align: 'right' });
      doc.setFont('Amiri', 'normal');
      doc.text('توقيع العميل: _______________________', 190, 210, { align: 'right' });
      doc.text('توقيع الشركة: _______________________', 190, 220, { align: 'right' });
      doc.text(`التاريخ: ${toArabicNumerals(new Date().toLocaleDateString('ar-SA'))}`, 190, 230, { align: 'right' });
    }
    
    // Save the PDF file
    const fileName = `Rental_Agreement_${agreement.agreement_number}_${language}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}
