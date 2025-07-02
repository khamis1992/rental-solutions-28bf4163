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

// Helper function to format date as dd/mm/yyyy in Arabic
function formatDateArabic(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
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

// Map agreement data to placeholder values
function mapAgreementData(agreement: Agreement) {
  const currentDate = new Date();
  const startDate = new Date(agreement.start_date);
  const endDate = new Date(agreement.end_date);
  const duration = calculateDurationMonths(startDate, endDate);

  return {
    // Document metadata
    documentNumber: agreement.agreement_number || 'غير محدد',
    issueDate: formatDateArabic(currentDate),
    
    // Agreement info
    agreementNumber: agreement.agreement_number || 'غير محدد',
    contractDate: formatDateArabic(currentDate),
    startDate: formatDateArabic(agreement.start_date),
    endDate: formatDateArabic(agreement.end_date),
    duration: `${duration} شهر`,
    paymentDay: (agreement as any).rent_due_day || 1,
    
    // Customer info
    customerName: agreement.customers?.full_name || 'غير محدد',
    nationality: (agreement.customers as any)?.nationality || 'غير محدد',
    idNumber: (agreement.customers as any)?.driver_license || 'غير محدد',
    phoneNumber: agreement.customers?.phone_number || 'غير محدد',
    email: agreement.customers?.email || 'غير محدد',
    address: (agreement.customers as any)?.address || 'الدوحة - قطر', // العنوان الافتراضي
    
    // Vehicle info
    vehicleMake: agreement.vehicles?.make || 'غير محدد',
    vehicleModel: agreement.vehicles?.model || 'غير محدد',
    vehicleYear: agreement.vehicles?.year?.toString() || 'غير محدد',
    licensePlate: agreement.vehicles?.license_plate || 'غير محدد',
    vehicleColor: agreement.vehicles?.color || 'غير محدد',
    vinNumber: agreement.vehicles?.vin || 'غير محدد',
    engineNumber: 'غير محدد', // Not available in current // schema - removed unused variable// Financial info
    monthlyRent: formatArabicCurrency(agreement.rent_amount),
    totalAmount: formatArabicCurrency((agreement as any).total_amount || agreement.rent_amount * duration),
    depositAmount: formatArabicCurrency(agreement.deposit_amount),
    paymentMethod: 'تحويل بنكي / نقداً',
    lateFee: formatArabicCurrency(agreement.daily_late_fee || 120)
  };
}

// Main contract generation function
export async function generateArabicContract(agreement: Agreement): Promise<boolean> {
  try {
    console.log('Starting comprehensive Arabic contract generation for agreement:', agreement.id);
    
    // Map agreement data to contract placeholders
    const contractData = mapAgreementData(agreement);
    console.log('Mapped comprehensive contract data:', contractData);
    
    // Create a printable window with proper Arabic support
    const printWindow = window.open('', '');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عقد إيجار مركبة شامل</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
            border-radius: 8px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1e40af;
          }
          .company-details {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 5px;
          }
          .contract-title {
            font-size: 22px;
            font-weight: bold;
            margin: 20px 0;
            color: #1e40af;
            text-align: center;
            border: 2px solid #1e40af;
            padding: 15px;
            border-radius: 8px;
            background: #f0f8ff;
          }
          .contract-subtitle {
            font-size: 16px;
            color: #64748b;
            text-align: center;
            margin-bottom: 20px;
          }
          .section {
            margin: 25px 0;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1e40af;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
          }
          .info-grid {
            display: table;
            width: 100%;
            margin: 15px 0;
          }
          .info-row {
            display: table-row;
          }
          .info-item {
            display: table-cell;
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            vertical-align: top;
            width: 50%;
          }
          .info-label {
            font-weight: bold;
            color: #475569;
            margin-left: 8px;
          }
          .info-value {
            color: #1e293b;
          }
          .amount {
            color: #dc2626;
            font-weight: bold;
            font-size: 16px;
          }
          .article {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #fafafa;
          }
          .article-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
          }
          .article-text {
            font-size: 14px;
            line-height: 1.6;
            margin: 8px 0;
            color: #374151;
          }
          .parties-section {
            background: #f0f8ff;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #bfdbfe;
            margin: 20px 0;
          }
          .party-header {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
          }
          .party-details {
            font-size: 14px;
            line-height: 1.6;
            margin: 8px 0;
            color: #374151;
          }
          .signatures {
            margin-top: 40px;
            page-break-inside: avoid;
          }
          .signature-section {
            display: table;
            width: 100%;
            margin: 30px 0;
          }
          .signature-row {
            display: table-row;
          }
          .signature-cell {
            display: table-cell;
            width: 50%;
            padding: 20px;
            text-align: center;
            border: 1px solid #e2e8f0;
            vertical-align: top;
          }
          .signature-title {
            font-weight: bold;
            margin-bottom: 40px;
            color: #1e40af;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin: 10px 0;
            padding-top: 5px;
            font-size: 12px;
            color: #64748b;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            page-break-inside: avoid;
          }
          .vehicle-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .vehicle-table th, .vehicle-table td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: right;
          }
          .vehicle-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #1e40af;
          }
          .phone-ltr {
            direction: ltr;
            text-align: left;
            display: inline-block;
          }
          @media print {
            body { print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">شركة العراف لتأجير السيارات ذ.م.م</div>
          <div class="company-details">منطقة أم صلال علي، الدوحة، قطر، ص.ب 36126</div>
          <div class="company-details">سجل تجاري رقم: 146832</div>
          <div class="company-details">هاتف: <span class="phone-ltr">+974 31411919 - 31151919</span> | البريد الإلكتروني: info@alaraf.qa</div>
        </div>

        <div class="contract-title">
          عقد إيجار مركبة
        </div>
        <div class="contract-subtitle">
          رقم العقد: ${contractData.agreementNumber}
        </div>

        <div class="section">
          <div class="article-text">
            تم تحرير هذا العقد وإبرامه بتاريخ: ${contractData.contractDate} ("تاريخ النفاذ")
          </div>
        </div>

        <div class="section">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">تاريخ العقد:</span>
                <span class="info-value">${contractData.contractDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">تاريخ الانتهاء:</span>
                <span class="info-value">${contractData.endDate}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">رقم العقد:</span>
                <span class="info-value">${contractData.agreementNumber}</span>
              </div>
              <div class="info-item">
                <span class="info-label">مدة الإيجار:</span>
                <span class="info-value">${contractData.duration}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="parties-section">
          <div class="section-title">بين كل من:</div>
          
          <div class="party-header">الطرف الأول:</div>
          <div class="party-details">
            شركة العراف لتأجير السيارات ذ.م.م، شركة ذات مسؤولية محدودة مسجلة وفقًا لقوانين دولة قطر، وتحمل السجل التجاري رقم (146832)، ومقرها الرئيسي في منطقة أم صلال علي، الدوحة – قطر، صندوق بريد رقم 36126، ويمثلها قانونًا السيد/ خميس هاشم الجبر، المدير المفوض بالتوقيع، ويُشار إليها لاحقًا بـ "المؤجر" أو "الطرف الأول".
          </div>

          <div class="party-header" style="margin-top: 20px;">و</div>
          <div class="party-header">الطرف الثاني:</div>
          <div class="party-details">
            السيد/ ${contractData.customerName}، حامل رخصة القيادة رقم ${contractData.idNumber}، وجنسيته ${contractData.nationality}، ومقيم في دولة قطر، رقم الجوال: <span class="phone-ltr">${contractData.phoneNumber}</span>، ويُشار إليه لاحقًا بـ "المستأجر" أو "الطرف الثاني".
          </div>
          
          <div class="party-details" style="margin-top: 15px;">
            ويُشار إلى الطرفين مجتمعين بـ "الأطراف"، ومنفردين بـ "الطرف".
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (1): التمهيد</div>
          <div class="article-text">
            يُعد التمهيد أعلاه جزءًا لا يتجزأ من هذا العقد ويُقرأ ويُفسر ضمن شروطه وأحكامه.
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (2): بيانات المركبة المؤجرة</div>
          <div class="article-text">
            يؤجر الطرف الأول بموجب هذا العقد الطرف الثاني القابل لذلك المركبة التالية:
          </div>
          <table class="vehicle-table">
            <thead>
              <tr>
                <th>البيان</th>
                <th>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>نوع المركبة</td>
                <td>${contractData.vehicleMake} - ${contractData.vehicleModel}</td>
              </tr>
              <tr>
                <td>سنة الصنع</td>
                <td>${contractData.vehicleYear}</td>
              </tr>
              <tr>
                <td>رقم اللوحة</td>
                <td>${contractData.licensePlate}</td>
              </tr>
              <tr>
                <td>رقم الهيكل (VIN)</td>
                <td>${contractData.vinNumber}</td>
              </tr>
              <tr>
                <td>اللون</td>
                <td>${contractData.vehicleColor}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="article">
          <div class="article-title">المادة (3): مدة الإيجار</div>
          <div class="article-text">
            تُحدد مدة هذا العقد بـ ${contractData.duration} تبدأ اعتبارًا من تاريخ النفاذ، وتنتهي تلقائيًا دون حاجة لأي إجراء. لا يجوز للطرف الثاني إنهاء العقد قبل انتهاء مدته إلا بموافقة خطية مسبقة من الطرف الأول.
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (4): الأجرة</div>
          <div class="article-text">
            يلتزم الطرف الثاني بسداد مبلغ وقدره ${contractData.monthlyRent} ريال قطري شهريًا بموجب جدول الدفعات المرفق. يتم السداد في بداية كل شهر، دون أي خصومات أو مقاصة أو مطالبات.
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (5): غرامة التأخير</div>
          <div class="article-text">
            في حال تأخر الطرف الثاني عن السداد لأي مبلغ مستحق، تُفرض عليه غرامة تأخير مقدارها ${contractData.lateFee} ريال قطري عن كل يوم تأخير دون حاجة لإنذار أو إعذار. تستحق الغرامات والمبالغ المتأخرة فورًا.
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (6): وديعة الضمان</div>
          <div class="article-text">
            يدفع الطرف الثاني عند توقيع العقد وديعة ضمان مقدارها ${contractData.depositAmount} ريال قطري، تُحتجز لدى الطرف الأول لضمان حسن تنفيذ التزاماته. يحق للطرف الأول خصم أي مبالغ مستحقة من هذه الوديعة دون موافقة مسبقة. لا تُرد الوديعة في حال الإنهاء المبكر من قبل الطرف الثاني.
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (7): المعاينة</div>
          <div class="article-text">
            يقر الطرف الثاني بأنه عاين المركبة معاينة نافيه للجهالة وقبلها بحالتها الراهنة دون أي تحفظ. ولا يحق له الادعاء بوجود عيوب لاحقًا. لا يقدم الطرف الأول أي ضمانات على المركبة.
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (8): استلام المركبة</div>
          <div class="article-text">
            يتم تسليم المركبة وفق محضر استلام مرفق. يكون الطرف الثاني مسؤولًا عن أي أضرار أو مخالفات تقع على المركبة أو تتسبب بها أثناء فترة الإيجار.
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (9): التزامات الطرف الثاني</div>
          <div class="article-text">يقر الطرف الثاني ويتعهد بما يلي:</div>
          <div class="article-text">9.1 دفع جميع المخالفات المرورية خلال 30 يومًا من تاريخ تحريرها.</div>
          <div class="article-text">9.2 تحمل مصاريف التشغيل والصيانة.</div>
          <div class="article-text">9.3 إجراء الفحص الفني الدوري وضمان اجتيازه.</div>
          <div class="article-text">9.4 تحمُّل المسؤولية عن أي هلاك كلي أو جزئي للمركبة حتى وإن كان بسبب الغير، في حال الإهمال أو التقصير.</div>
          <div class="article-text">9.5 عدم السماح لأي شخص بقيادة المركبة أو استخدامها دون موافقة كتابية من الطرف الأول.</div>
        </div>

        <div class="article">
          <div class="article-title">المادة (10): التأمين</div>
          <div class="article-text">
            يلتزم الطرف الثاني بإصدار بوليصة تأمين شاملة من شركة معتمدة طوال مدة الإيجار، وتقديم نسخة للطرف الأول.
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (11): خيار الشراء</div>
          <div class="article-text">
            يجوز للطرف الثاني التقدم بطلب شراء المركبة في نهاية مدة العقد، شريطة إخطار الطرف الأول كتابيًا، ويُحتسب سعر المركبة وفق ما يتفق عليه الطرفان لاحقًا كتابيًا. لا يترتب على هذا العقد التزام نهائي بالبيع.
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (12): الإخلال بالعقد</div>
          <div class="article-text">يُعد الطرف الثاني في حالة إخلال إذا:</div>
          <div class="article-text">12.1 تأخر في السداد.</div>
          <div class="article-text">12.2 خالف أي بند من بنود هذا العقد.</div>
          <div class="article-text">12.3 أُعلن إفلاسه أو أعساره.</div>
          <div class="article-text">12.4 ترك المركبة دون إشراف.</div>
          <div class="article-text">12.5 غادر البلاد نهائيًا.</div>
          <div class="article-text">12.6 لم يسدد المخالفات خلال المهلة المحددة.</div>
        </div>

        <div class="article">
          <div class="article-title">المادة (13): نتائج الإخلال</div>
          <div class="article-text">يترتب على الإخلال:</div>
          <div class="article-text">13.1 إنهاء العقد فورًا وسحب المركبة دون إذن قضائي.</div>
          <div class="article-text">13.2 دفع غرامة إنهاء تعاقد بمقدار 5000 ريال قطري.</div>
          <div class="article-text">13.3 دفع تعويض يومي قدره 200 ريال قطري عن كل يوم تأخير في تسليم المركبة.</div>
          <div class="article-text">13.4 مصادرة أي ممتلكات داخل السيارة دون مسؤولية مدنية أو جزائية على الطرف الأول.</div>
        </div>

        <div class="article">
          <div class="article-title">المادة (14): السداد المبكر</div>
          <div class="article-text">
            لا يجوز السداد المبكر إلا بعد إخطار الطرف الأول كتابيًا قبل 30 يومًا والحصول على موافقة صريحة منه. لا يُعد السداد المبكر مبررًا لإلغاء أي غرامات أو التزامات متعلقة بالعقد.
          </div>
        </div>

        <div class="article">
          <div class="article-title">المادة (15): أحكام عامة</div>
          <div class="article-text">15.1 القانون الحاكم: يخضع هذا العقد لقوانين دولة قطر وتختص محاكمها بأي نزاع.</div>
          <div class="article-text">15.2 الإشعارات: تتم عبر البريد الإلكتروني أو تطبيق واتساب أو الرسائل النصية.</div>
          <div class="article-text">15.3 التنازل: لا يجوز للطرف الثاني التنازل عن العقد أو حقوقه دون موافقة خطية مسبقة.</div>
          <div class="article-text">15.4 قابلية الفصل: إذا تبيّن أن أي بند غير قانوني، تبقى باقي البنود نافذة.</div>
          <div class="article-text">15.5 الاتفاق الكامل: يُمثل هذا العقد كامل الاتفاق بين الأطراف ويُلغي ما سبقه من تفاهمات.</div>
          <div class="article-text">15.6 النسخ: يُوقع العقد من نسختين أصليتين لكل طرف نسخة، ولهما ذات الحجية القانونية.</div>
        </div>

        <div class="signatures">
          <div class="section-title">التوقيعات</div>
          <div class="signature-section">
            <div class="signature-row">
              <div class="signature-cell">
                <div class="signature-title">الطرف الأول (المؤجر)</div>
                <div style="height: 60px;"></div>
                <div class="signature-line">الاسم: خميس هاشم الجبر</div>
                <div class="signature-line">التاريخ: _______________</div>
                <div class="signature-line">الختم: _______________</div>
              </div>
              <div class="signature-cell">
                <div class="signature-title">الطرف الثاني (المستأجر)</div>
                <div style="height: 60px;"></div>
                <div class="signature-line">الاسم: ${contractData.customerName}</div>
                <div class="signature-line">التاريخ: _______________</div>
                <div class="signature-line">التوقيع: _______________</div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div>هذا العقد محرر باللغة العربية ويخضع للقوانين المعمول بها في دولة قطر</div>
          <div>تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-QA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
          <div>هذه الوثيقة سرية وخاصة بالأطراف المذكورة فقط</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    toast.success('تم فتح نافذة الطباعة - يمكنك حفظ العقد كـ PDF');
    return true;
    
  } catch (error) {
    console.error('Error generating comprehensive Arabic contract:', error);
    toast.error('فشل في إنشاء عقد الإيجار');
    return false;
  }
}

// Generate and store contract (for future Supabase integration)
export async function generateAndStoreContract(agreement: Agreement): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // For now, just generate and download
    const success = await generateArabicContract(agreement);
    
    if (success) {
      return { 
        success: true, 
        url: `comprehensive-contract-${agreement.id}-${Date.now()}.pdf`
      };
    } else {
      return { 
        success: false, 
        error: 'Failed to generate comprehensive contract' 
      };
    }
  } catch (error) {
    console.error('Error in generateAndStoreContract:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
