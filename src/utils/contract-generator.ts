
import { Agreement } from '@/types/agreement';
import pdfMake from 'pdfmake/build/pdfmake';
import { toast } from 'sonner';

// Safe text processing function
function safeText(text: string | undefined | null): string {
  if (!text) return 'غير محدد';
  
  // Clean and sanitize text for PDF generation
  return String(text)
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove bidirectional marks
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E\u000A\u000D]/g, '') // Keep only Arabic, Latin, and line breaks
    .trim() || 'غير محدد';
}

// Safe currency formatting
function formatCurrency(amount: number | undefined | null): string {
  if (!amount && amount !== 0) return 'غير محدد';
  
  try {
    return `${amount.toFixed(2)} ريال قطري`;
  } catch {
    return 'غير محدد';
  }
}

// Safe date formatting
function formatDate(date: string | Date | undefined): string {
  if (!date) return 'غير محدد';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'غير محدد';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'غير محدد';
  }
}

// Create a simple text element with consistent formatting
function createTextElement(text: string, style = 'normal') {
  return {
    text: safeText(text),
    style: style,
    alignment: 'right'
  };
}

// Create label-value pair
function createLabelValue(label: string, value: string) {
  return {
    columns: [
      { width: '*', text: '' },
      { 
        width: 'auto', 
        text: `${safeText(label)}: ${safeText(value)}`,
        style: 'valueText',
        alignment: 'right'
      }
    ]
  };
}

// Extract and validate agreement data
function extractAgreementData(agreement: Agreement) {
  try {
    return {
      agreementNumber: safeText(agreement.agreement_number),
      customerName: safeText(agreement.customers?.full_name),
      customerPhone: safeText(agreement.customers?.phone_number),
      customerEmail: safeText(agreement.customers?.email),
      vehicleMake: safeText(agreement.vehicles?.make),
      vehicleModel: safeText(agreement.vehicles?.model),
      vehicleYear: safeText(agreement.vehicles?.year?.toString()),
      licensePlate: safeText(agreement.vehicles?.license_plate),
      startDate: formatDate(agreement.start_date),
      endDate: formatDate(agreement.end_date),
      monthlyRent: formatCurrency(agreement.rent_amount),
      totalAmount: formatCurrency(agreement.total_amount),
      depositAmount: formatCurrency(agreement.deposit_amount),
      currentDate: formatDate(new Date())
    };
  } catch (error) {
    console.error('Error extracting agreement data:', error);
    throw new Error('Failed to process agreement data');
  }
}

// Create the document definition with minimal complexity
function createSimpleDocumentDefinition(data: ReturnType<typeof extractAgreementData>) {
  return {
    pageSize: 'A4',
    pageMargins: [50, 60, 50, 60],
    
    content: [
      // Header
      createTextElement('شركة العراف لتأجير السيارات ذ.م.م', 'companyName'),
      createTextElement('الدوحة - قطر', 'companyInfo'),
      { text: '', margin: [0, 20] },
      
      // Title
      createTextElement('عقد إيجار مركبة', 'title'),
      { text: '', margin: [0, 20] },
      
      // Agreement details
      createLabelValue('رقم العقد', data.agreementNumber),
      createLabelValue('تاريخ العقد', data.currentDate),
      { text: '', margin: [0, 15] },
      
      // Customer information
      createTextElement('بيانات المستأجر', 'sectionHeader'),
      createLabelValue('الاسم', data.customerName),
      createLabelValue('الهاتف', data.customerPhone),
      createLabelValue('البريد الإلكتروني', data.customerEmail),
      { text: '', margin: [0, 15] },
      
      // Vehicle information
      createTextElement('بيانات المركبة', 'sectionHeader'),
      createLabelValue('الماركة', data.vehicleMake),
      createLabelValue('الموديل', data.vehicleModel),
      createLabelValue('سنة الصنع', data.vehicleYear),
      createLabelValue('رقم اللوحة', data.licensePlate),
      { text: '', margin: [0, 15] },
      
      // Financial information
      createTextElement('الشروط المالية', 'sectionHeader'),
      createLabelValue('الإيجار الشهري', data.monthlyRent),
      createLabelValue('المبلغ الإجمالي', data.totalAmount),
      createLabelValue('مبلغ الضمان', data.depositAmount),
      { text: '', margin: [0, 15] },
      
      // Contract period
      createTextElement('مدة العقد', 'sectionHeader'),
      createLabelValue('تاريخ البدء', data.startDate),
      createLabelValue('تاريخ الانتهاء', data.endDate),
      { text: '', margin: [0, 30] },
      
      // Basic terms
      createTextElement('الشروط الأساسية', 'sectionHeader'),
      createTextElement('١. يلتزم المستأجر بدفع الإيجار في التاريخ المحدد', 'termText'),
      createTextElement('٢. يلتزم المستأجر بالمحافظة على المركبة', 'termText'),
      createTextElement('٣. جميع المخالفات المرورية على عهدة المستأجر', 'termText'),
      createTextElement('٤. يخضع هذا العقد للقوانين المعمول بها في دولة قطر', 'termText'),
      { text: '', margin: [0, 30] },
      
      // Signatures
      createTextElement('التوقيعات', 'sectionHeader'),
      { text: '', margin: [0, 20] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              createTextElement('المؤجر', 'signatureLabel'),
              { text: '________________________', alignment: 'center', margin: [0, 20, 0, 5] },
              createTextElement('التوقيع', 'signatureLabel')
            ]
          },
          {
            width: '50%',
            stack: [
              createTextElement('المستأجر', 'signatureLabel'),
              { text: '________________________', alignment: 'center', margin: [0, 20, 0, 5] },
              createTextElement('التوقيع', 'signatureLabel')
            ]
          }
        ]
      }
    ],
    
    styles: {
      companyName: {
        fontSize: 16,
        bold: true,
        alignment: 'center',
        font: 'Helvetica'
      },
      companyInfo: {
        fontSize: 12,
        alignment: 'center',
        font: 'Helvetica'
      },
      title: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        font: 'Helvetica'
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        alignment: 'right',
        font: 'Helvetica'
      },
      valueText: {
        fontSize: 11,
        alignment: 'right',
        font: 'Helvetica'
      },
      termText: {
        fontSize: 10,
        alignment: 'right',
        font: 'Helvetica',
        margin: [0, 3]
      },
      signatureLabel: {
        fontSize: 11,
        alignment: 'center',
        font: 'Helvetica'
      }
    },
    
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10
    }
  };
}

// Main contract generation function
export async function generateArabicContract(agreement: Agreement): Promise<boolean> {
  try {
    console.log('Generating Arabic contract for agreement:', agreement.id);
    
    // Extract and validate data
    const agreementData = extractAgreementData(agreement);
    console.log('Agreement data extracted successfully');
    
    // Create document definition
    const docDefinition = createSimpleDocumentDefinition(agreementData);
    console.log('Document definition created');
    
    // Generate filename
    const fileName = `contract-${agreementData.agreementNumber}-${Date.now()}.pdf`;
    
    // Create and download PDF
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.download(fileName);
      
      console.log('PDF generated and downloaded successfully');
      toast.success('تم إنشاء العقد العربي بنجاح');
      return true;
      
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      
      // Ultra-simple fallback
      const fallbackDoc = {
        content: [
          { text: 'عقد إيجار مركبة', style: 'title' },
          { text: `رقم العقد: ${agreementData.agreementNumber}`, style: 'normal' },
          { text: `المستأجر: ${agreementData.customerName}`, style: 'normal' },
          { text: `المركبة: ${agreementData.vehicleMake} ${agreementData.vehicleModel}`, style: 'normal' },
          { text: `الإيجار الشهري: ${agreementData.monthlyRent}`, style: 'normal' }
        ],
        styles: {
          title: { fontSize: 16, bold: true, alignment: 'center' },
          normal: { fontSize: 12, alignment: 'right', margin: [0, 5] }
        },
        defaultStyle: { font: 'Helvetica' }
      };
      
      const fallbackPdf = pdfMake.createPdf(fallbackDoc);
      fallbackPdf.download(`simple-${fileName}`);
      
      toast.success('تم إنشاء عقد مبسط بنجاح');
      return true;
    }
    
  } catch (error) {
    console.error('Contract generation failed:', error);
    toast.error('فشل في إنشاء العقد العربي');
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
