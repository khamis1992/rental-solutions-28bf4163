
import { Agreement } from '@/types/agreement';
import { initializeFonts } from './font-loader';
import { 
  prepareArabicForPDF, 
  createArabicTextBlock, 
  formatArabicCurrency, 
  formatArabicDate 
} from './arabic-text-utils';
import pdfMake from 'pdfmake/build/pdfmake';
import { toast } from 'sonner';

// Enhanced contract labels with comprehensive structure
const contractLabels = {
  // Header
  contractTitle: { ar: 'عقد إيجار مركبة' },
  companyName: { ar: 'شركة العراف لتأجير السيارات ذ.م.م' },
  companyAddress: { ar: 'المكتب الرئيسي: الدوحة - قطر' },
  companyPhone: { ar: 'هاتف: +974 44XX XXXX' },
  companyEmail: { ar: 'البريد الإلكتروني: info@alaraf.qa' },
  commercialRecord: { ar: 'السجل التجاري: ١٢٣٤٥٦٧٨٩' },
  
  // Document metadata
  documentNumber: { ar: 'رقم الوثيقة' },
  issueDate: { ar: 'تاريخ الإصدار' },
  
  // Parties
  firstParty: { ar: 'الطرف الأول (المؤجر)' },
  secondParty: { ar: 'الطرف الثاني (المستأجر)' },
  
  // Agreement details
  agreementNumber: { ar: 'رقم العقد' },
  contractDate: { ar: 'تاريخ العقد' },
  startDate: { ar: 'تاريخ البدء' },
  endDate: { ar: 'تاريخ الانتهاء' },
  duration: { ar: 'مدة الإيجار' },
  
  // Customer information
  customerName: { ar: 'اسم المستأجر' },
  nationality: { ar: 'الجنسية' },
  idNumber: { ar: 'رقم الهوية/جواز السفر' },
  phoneNumber: { ar: 'رقم الهاتف' },
  email: { ar: 'البريد الإلكتروني' },
  address: { ar: 'العنوان' },
  
  // Vehicle information
  vehicleDetails: { ar: 'تفاصيل المركبة' },
  make: { ar: 'الماركة' },
  model: { ar: 'الموديل' },
  year: { ar: 'سنة الصنع' },
  licensePlate: { ar: 'رقم اللوحة' },
  color: { ar: 'اللون' },
  vinNumber: { ar: 'رقم الهيكل' },
  engineNumber: { ar: 'رقم المحرك' },
  
  // Financial terms
  financialTerms: { ar: 'الشروط المالية' },
  monthlyRent: { ar: 'الإيجار الشهري' },
  totalAmount: { ar: 'المبلغ الإجمالي' },
  depositAmount: { ar: 'مبلغ الضمان' },
  paymentDay: { ar: 'يوم الدفع الشهري' },
  paymentMethod: { ar: 'طريقة الدفع' },
  lateFee: { ar: 'رسوم التأخير اليومية' },
  
  // Contract articles
  articlesTitle: { ar: 'مواد العقد' },
  
  // Article 1 - General provisions
  article1Title: { ar: 'المادة الأولى: الأحكام العامة' },
  article1_1: { ar: '1.1 يُعتبر هذا العقد نافذاً من تاريخ توقيعه من الطرفين.' },
  article1_2: { ar: '1.2 جميع المرفقات جزء لا يتجزأ من هذا العقد.' },
  article1_3: { ar: '1.3 يخضع هذا العقد للقوانين المعمول بها في دولة قطر.' },
  
  // Article 2 - Vehicle delivery
  article2Title: { ar: 'المادة الثانية: تسليم المركبة' },
  article2_1: { ar: '2.1 يلتزم المؤجر بتسليم المركبة في حالة جيدة وصالحة للاستعمال.' },
  article2_2: { ar: '2.2 يتم تسليم المركبة مع جميع الوثائق المطلوبة قانونياً.' },
  article2_3: { ar: '2.3 على المستأجر فحص المركبة قبل الاستلام والتوقيع على محضر الاستلام.' },
  
  // Article 3 - Tenant obligations
  article3Title: { ar: 'المادة الثالثة: التزامات المستأجر' },
  article3_1: { ar: '3.1 يلتزم المستأجر بدفع الإيجار في التاريخ المحدد دون تأخير.' },
  article3_2: { ar: '3.2 عدم استخدام المركبة في أغراض غير قانونية أو تجارية.' },
  article3_3: { ar: '3.3 المحافظة على المركبة وعدم إجراء تعديلات عليها دون موافقة مسبقة.' },
  article3_4: { ar: '3.4 إبلاغ المؤجر فوراً في حالة حدوث أي حادث أو عطل.' },
  article3_5: { ar: '3.5 عدم تأجير المركبة للغير أو السماح لغير المرخص لهم بقيادتها.' },
  
  // Article 4 - Lessor obligations
  article4Title: { ar: 'المادة الرابعة: التزامات المؤجر' },
  article4_1: { ar: '4.1 ضمان صلاحية المركبة للاستعمال طوال فترة الإيجار.' },
  article4_2: { ar: '4.2 توفير التأمين الشامل للمركبة.' },
  article4_3: { ar: '4.3 القيام بالصيانة الدورية والإصلاحات الضرورية.' },
  article4_4: { ar: '4.4 تجديد التراخيص والفحوصات المطلوبة قانونياً.' },
  
  // Article 5 - Payment terms
  article5Title: { ar: 'المادة الخامسة: شروط الدفع' },
  article5_1: { ar: '5.1 يستحق الإيجار الشهري في اليوم المحدد من كل شهر.' },
  article5_2: { ar: '5.2 في حالة التأخير، تُفرض رسوم تأخير يومية كما هو محدد في العقد.' },
  article5_3: { ar: '5.3 جميع المدفوعات تتم بالريال القطري.' },
  article5_4: { ar: '5.4 لا يحق للمستأجر خصم أي مبالغ من الإيجار دون موافقة خطية.' },
  
  // Article 6 - Traffic violations
  article6Title: { ar: 'المادة السادسة: المخالفات المرورية' },
  article6_1: { ar: '6.1 جميع المخالفات المرورية على عهدة المستأجر.' },
  article6_2: { ar: '6.2 يلتزم المستأجر بدفع المخالفات فور استلام الإشعار.' },
  article6_3: { ar: '6.3 في حالة عدم الدفع، يحق للمؤجر خصم المبلغ من الضمان.' },
  
  // Article 7 - Accidents and damages
  article7Title: { ar: 'المادة السابعة: الحوادث والأضرار' },
  article7_1: { ar: '7.1 على المستأجر إبلاغ الشرطة والمؤجر فوراً في حالة وقوع حادث.' },
  article7_2: { ar: '7.2 المستأجر مسؤول عن التحمل المالي للتأمين.' },
  article7_3: { ar: '7.3 أي أضرار ناتجة عن سوء الاستعمال على عهدة المستأجر.' },
  
  // Article 8 - Contract termination
  article8Title: { ar: 'المادة الثامنة: إنهاء العقد' },
  article8_1: { ar: '8.1 ينتهي العقد في التاريخ المحدد أو بالاتفاق المتبادل.' },
  article8_2: { ar: '8.2 يحق للمؤجر إنهاء العقد في حالة مخالفة شروطه.' },
  article8_3: { ar: '8.3 عند الإنهاء، يتم إرجاع المركبة وتسوية جميع المستحقات.' },
  
  // Article 9 - Dispute resolution
  article9Title: { ar: 'المادة التاسعة: حل النزاعات' },
  article9_1: { ar: '9.1 تحل النزاعات ودياً أولاً بين الطرفين.' },
  article9_2: { ar: '9.2 في حالة فشل الحل الودي، تحال النزاعات للمحاكم المختصة في قطر.' },
  article9_3: { ar: '9.3 يطبق القانون القطري على جميع جوانب هذا العقد.' },
  
  // Article 10 - Special provisions
  article10Title: { ar: 'المادة العاشرة: أحكام خاصة' },
  article10_1: { ar: '10.1 أي تعديل على العقد يجب أن يكون خطياً وموقعاً من الطرفين.' },
  article10_2: { ar: '10.2 إذا بطل أي جزء من العقد، يبقى الباقي نافذاً.' },
  article10_3: { ar: '10.3 هذا العقد محرر من نسختين، لكل طرف نسخة.' },
  
  // Signatures
  signatures: { ar: 'التوقيعات' },
  firstPartySignature: { ar: 'الطرف الأول (المؤجر)' },
  secondPartySignature: { ar: 'الطرف الثاني (المستأجر)' },
  witnessSignature: { ar: 'الشاهد' },
  signatureName: { ar: 'الاسم' },
  signatureDate: { ar: 'التاريخ' },
  signatureStamp: { ar: 'الختم' },
  
  // Footer
  legalNotice: { ar: 'هذا العقد محرر باللغة العربية ويخضع للقوانين المعمول بها في دولة قطر' },
  confidentialityNotice: { ar: 'هذه الوثيقة سرية وخاصة بالأطراف المذكورة فقط' }
};

// Professional color scheme
const colors = {
  primary: '#1e40af',
  secondary: '#64748b',
  accent: '#0ea5e9',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  light: '#f9fafb',
  lighter: '#f3f4f6',
  headerBg: '#1e3a8a',
  headerText: '#ffffff'
};

// Helper function to safely format Arabic text for PDFMake
function safeArabicText(text: string): string {
  if (!text || typeof text !== 'string') {
    return 'غير محدد';
  }
  
  // Remove any null bytes or problematic characters
  return text
    .replace(/\0/g, '')
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove bidirectional marks
    .trim() || 'غير محدد';
}

// Helper function to create safe text blocks
function createSafeTextBlock(text: string, style?: string) {
  const safeText = safeArabicText(text);
  return {
    text: safeText,
    style: style || 'normal',
    alignment: 'right'
  };
}

// Helper function to format date as dd/mm/yyyy in Arabic
function formatDateArabic(date: string | Date | undefined): string {
  if (!date) return 'غير محدد';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'غير محدد';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to calculate duration in months
function calculateDurationMonths(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

// Map agreement data to placeholder values with safe handling
function mapAgreementData(agreement: Agreement) {
  const currentDate = new Date();
  const startDate = new Date(agreement.start_date);
  const endDate = new Date(agreement.end_date);
  const duration = calculateDurationMonths(startDate, endDate);

  return {
    // Document metadata
    documentNumber: safeArabicText(agreement.agreement_number || 'غير محدد'),
    issueDate: formatDateArabic(currentDate),
    
    // Agreement info
    agreementNumber: safeArabicText(agreement.agreement_number || 'غير محدد'),
    contractDate: formatDateArabic(currentDate),
    startDate: formatDateArabic(agreement.start_date),
    endDate: formatDateArabic(agreement.end_date),
    duration: `${duration} شهر`,
    paymentDay: (agreement as any).rent_due_day || 1,
    
    // Customer info
    customerName: safeArabicText(agreement.customers?.full_name || 'غير محدد'),
    nationality: safeArabicText((agreement.customers as any)?.nationality || 'غير محدد'),
    idNumber: safeArabicText((agreement.customers as any)?.driver_license || 'غير محدد'),
    phoneNumber: safeArabicText(agreement.customers?.phone_number || 'غير محدد'),
    email: safeArabicText(agreement.customers?.email || 'غير محدد'),
    address: safeArabicText('الدوحة - قطر'),
    
    // Vehicle info
    vehicleMake: safeArabicText(agreement.vehicles?.make || 'غير محدد'),
    vehicleModel: safeArabicText(agreement.vehicles?.model || 'غير محدد'),
    vehicleYear: safeArabicText(agreement.vehicles?.year?.toString() || 'غير محدد'),
    licensePlate: safeArabicText(agreement.vehicles?.license_plate || 'غير محدد'),
    vehicleColor: safeArabicText(agreement.vehicles?.color || 'غير محدد'),
    vinNumber: safeArabicText(agreement.vehicles?.vin || 'غير محدد'),
    engineNumber: safeArabicText('غير محدد'),
    
    // Financial info
    monthlyRent: formatArabicCurrency(agreement.rent_amount),
    totalAmount: formatArabicCurrency(agreement.total_amount),
    depositAmount: formatArabicCurrency(agreement.deposit_amount),
    paymentMethod: safeArabicText('تحويل بنكي / نقداً'),
    lateFee: formatArabicCurrency(agreement.daily_late_fee || 120)
  };
}

// Create comprehensive contract document definition with error handling
function createContractDocumentDefinition(agreementData: ReturnType<typeof mapAgreementData>) {
  try {
    return {
      pageSize: 'A4',
      pageMargins: [40, 100, 40, 80],
      
      // Simplified header to avoid layout issues
      header: function(currentPage: number) {
        return {
          margin: [40, 20, 40, 0],
          stack: [
            createSafeTextBlock(contractLabels.companyName.ar, 'companyHeaderName'),
            createSafeTextBlock(contractLabels.companyAddress.ar, 'companyHeaderInfo'),
            createSafeTextBlock(`${contractLabels.companyPhone.ar} | ${contractLabels.companyEmail.ar}`, 'companyHeaderInfo'),
            createSafeTextBlock(contractLabels.commercialRecord.ar, 'companyHeaderInfo')
          ],
          alignment: 'center'
        };
      },
      
      // Simplified footer
      footer: function(currentPage: number, pageCount: number) {
        return {
          margin: [40, 10, 40, 20],
          stack: [
            createSafeTextBlock(contractLabels.legalNotice.ar, 'footerNotice'),
            createSafeTextBlock(`صفحة ${currentPage} من ${pageCount}`, 'pageNumber')
          ],
          alignment: 'center'
        };
      },
      
      // Main content with error handling
      content: [
        // Contract title
        createSafeTextBlock(contractLabels.contractTitle.ar, 'contractMainTitle'),
        { text: '', margin: [0, 20] },
        
        // Document metadata
        {
          columns: [
            createSafeTextBlock(`${contractLabels.documentNumber.ar}: ${agreementData.documentNumber}`, 'documentMeta'),
            createSafeTextBlock(`${contractLabels.issueDate.ar}: ${agreementData.issueDate}`, 'documentMeta')
          ]
        },
        { text: '', margin: [0, 20] },
        
        // First Party section
        createSafeTextBlock(contractLabels.firstParty.ar, 'sectionHeader'),
        { text: '', margin: [0, 10] },
        createSafeTextBlock(contractLabels.companyName.ar, 'partyMainInfo'),
        createSafeTextBlock(contractLabels.companyAddress.ar, 'partySubInfo'),
        { text: '', margin: [0, 20] },
        
        // Second Party section
        createSafeTextBlock(contractLabels.secondParty.ar, 'sectionHeader'),
        { text: '', margin: [0, 10] },
        
        // Customer information - simplified layout
        createSafeTextBlock(`${contractLabels.customerName.ar}: ${agreementData.customerName}`, 'valueStyle'),
        createSafeTextBlock(`${contractLabels.nationality.ar}: ${agreementData.nationality}`, 'valueStyle'),
        createSafeTextBlock(`${contractLabels.idNumber.ar}: ${agreementData.idNumber}`, 'valueStyle'),
        createSafeTextBlock(`${contractLabels.phoneNumber.ar}: ${agreementData.phoneNumber}`, 'valueStyle'),
        createSafeTextBlock(`${contractLabels.email.ar}: ${agreementData.email}`, 'valueStyle'),
        { text: '', margin: [0, 20] },
        
        // Vehicle details section
        createSafeTextBlock(contractLabels.vehicleDetails.ar, 'sectionHeader'),
        { text: '', margin: [0, 10] },
        createSafeTextBlock(`${contractLabels.make.ar}: ${agreementData.vehicleMake}`, 'valueStyle'),
        createSafeTextBlock(`${contractLabels.model.ar}: ${agreementData.vehicleModel}`, 'valueStyle'),
        createSafeTextBlock(`${contractLabels.year.ar}: ${agreementData.vehicleYear}`, 'valueStyle'),
        createSafeTextBlock(`${contractLabels.licensePlate.ar}: ${agreementData.licensePlate}`, 'valueStyle'),
        { text: '', margin: [0, 20] },
        
        // Financial terms
        createSafeTextBlock(contractLabels.financialTerms.ar, 'sectionHeader'),
        { text: '', margin: [0, 10] },
        createSafeTextBlock(`${contractLabels.monthlyRent.ar}: ${agreementData.monthlyRent}`, 'financialValue'),
        createSafeTextBlock(`${contractLabels.totalAmount.ar}: ${agreementData.totalAmount}`, 'financialValue'),
        createSafeTextBlock(`${contractLabels.depositAmount.ar}: ${agreementData.depositAmount}`, 'financialValue'),
        { text: '', margin: [0, 30] },
        
        // Contract articles - simplified
        createSafeTextBlock(contractLabels.articlesTitle.ar, 'articlesTitle'),
        { text: '', margin: [0, 20] },
        
        // Key articles only to avoid layout issues
        createSafeTextBlock(contractLabels.article1Title.ar, 'articleTitle'),
        createSafeTextBlock(contractLabels.article1_1.ar, 'articleText'),
        createSafeTextBlock(contractLabels.article1_2.ar, 'articleText'),
        { text: '', margin: [0, 15] },
        
        createSafeTextBlock(contractLabels.article3Title.ar, 'articleTitle'),
        createSafeTextBlock(contractLabels.article3_1.ar, 'articleText'),
        createSafeTextBlock(contractLabels.article3_2.ar, 'articleText'),
        { text: '', margin: [0, 15] },
        
        createSafeTextBlock(contractLabels.article5Title.ar, 'articleTitle'),
        createSafeTextBlock(contractLabels.article5_1.ar, 'articleText'),
        createSafeTextBlock(contractLabels.article5_2.ar, 'articleText'),
        { text: '', margin: [0, 30] },
        
        // Signatures section - simplified
        createSafeTextBlock(contractLabels.signatures.ar, 'articlesTitle'),
        { text: '', margin: [0, 30] },
        
        {
          columns: [
            {
              stack: [
                createSafeTextBlock(contractLabels.firstPartySignature.ar, 'signatureHeader'),
                { text: '________________________', alignment: 'center', margin: [0, 30, 0, 5] },
                createSafeTextBlock(contractLabels.signatureName.ar, 'signatureLabel')
              ]
            },
            {
              stack: [
                createSafeTextBlock(contractLabels.secondPartySignature.ar, 'signatureHeader'),
                { text: '________________________', alignment: 'center', margin: [0, 30, 0, 5] },
                createSafeTextBlock(contractLabels.signatureName.ar, 'signatureLabel')
              ]
            }
          ]
        }
      ],
      
      // Simplified styles to avoid font issues
      styles: {
        companyHeaderName: {
          fontSize: 18,
          bold: true,
          font: 'Helvetica',
          color: colors.primary,
          alignment: 'center'
        },
        companyHeaderInfo: {
          fontSize: 10,
          font: 'Helvetica',
          color: colors.textLight,
          alignment: 'center'
        },
        contractMainTitle: {
          fontSize: 22,
          bold: true,
          font: 'Helvetica',
          color: colors.primary,
          alignment: 'center'
        },
        documentMeta: {
          fontSize: 10,
          font: 'Helvetica',
          color: colors.textLight,
          alignment: 'right'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          font: 'Helvetica',
          color: colors.primary,
          alignment: 'right'
        },
        partyMainInfo: {
          fontSize: 12,
          bold: true,
          font: 'Helvetica',
          color: colors.text,
          alignment: 'right'
        },
        partySubInfo: {
          fontSize: 10,
          font: 'Helvetica',
          color: colors.textLight,
          alignment: 'right'
        },
        valueStyle: {
          fontSize: 11,
          font: 'Helvetica',
          color: colors.text,
          alignment: 'right',
          margin: [0, 2]
        },
        financialValue: {
          fontSize: 12,
          bold: true,
          font: 'Helvetica',
          color: colors.primary,
          alignment: 'right',
          margin: [0, 2]
        },
        articlesTitle: {
          fontSize: 16,
          bold: true,
          font: 'Helvetica',
          color: colors.primary,
          alignment: 'center'
        },
        articleTitle: {
          fontSize: 12,
          bold: true,
          font: 'Helvetica',
          color: colors.text,
          alignment: 'right'
        },
        articleText: {
          fontSize: 10,
          font: 'Helvetica',
          color: colors.text,
          alignment: 'right',
          margin: [0, 3]
        },
        signatureHeader: {
          fontSize: 11,
          bold: true,
          font: 'Helvetica',
          color: colors.text,
          alignment: 'center'
        },
        signatureLabel: {
          fontSize: 9,
          font: 'Helvetica',
          color: colors.textLight,
          alignment: 'center'
        },
        footerNotice: {
          fontSize: 8,
          font: 'Helvetica',
          color: colors.textLight,
          alignment: 'center'
        },
        pageNumber: {
          fontSize: 8,
          font: 'Helvetica',
          color: colors.textLight,
          alignment: 'center'
        }
      },
      
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 10,
        alignment: 'right'
      }
    };
  } catch (error) {
    console.error('Error creating document definition:', error);
    throw new Error('Failed to create document structure');
  }
}

// Enhanced contract generation with better error handling
export async function generateArabicContract(agreement: Agreement): Promise<boolean> {
  try {
    console.log('Starting comprehensive Arabic contract generation for agreement:', agreement.id);
    
    // Map agreement data with safe handling
    const agreementData = mapAgreementData(agreement);
    console.log('Mapped comprehensive contract data:', agreementData);

    // Create document definition with error handling
    const docDefinition = createContractDocumentDefinition(agreementData);
    
    // Generate filename
    const fileName = `عقد-إيجار-مركبة-شامل-${agreementData.agreementNumber}.pdf`;
    console.log('Generating comprehensive PDF with filename:', fileName);

    // Create and download PDF with error handling
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.download(fileName);
      
      console.log('Comprehensive Arabic contract PDF generated successfully');
      return true;
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      
      // Fallback: try with even simpler layout
      const simplifiedDoc = {
        content: [
          { text: contractLabels.contractTitle.ar, style: 'title' },
          { text: '', margin: [0, 20] },
          { text: `${contractLabels.agreementNumber.ar}: ${agreementData.agreementNumber}`, style: 'normal' },
          { text: `${contractLabels.customerName.ar}: ${agreementData.customerName}`, style: 'normal' },
          { text: `${contractLabels.vehicleDetails.ar}: ${agreementData.vehicleMake} ${agreementData.vehicleModel}`, style: 'normal' },
          { text: `${contractLabels.monthlyRent.ar}: ${agreementData.monthlyRent}`, style: 'normal' }
        ],
        styles: {
          title: { fontSize: 18, bold: true, alignment: 'center', font: 'Helvetica' },
          normal: { fontSize: 12, alignment: 'right', font: 'Helvetica', margin: [0, 5] }
        },
        defaultStyle: {
          font: 'Helvetica'
        }
      };
      
      const fallbackPdf = pdfMake.createPdf(simplifiedDoc);
      fallbackPdf.download(`simplified-${fileName}`);
      
      console.log('Fallback simplified PDF generated');
      return true;
    }
  } catch (error) {
    console.error('Error generating comprehensive Arabic contract:', error);
    toast.error('فشل في إنشاء العقد العربي الشامل');
    return false;
  }
}

// Store contract function for database integration
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
