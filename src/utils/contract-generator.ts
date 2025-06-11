
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
    address: 'الدوحة - قطر', // Default address
    
    // Vehicle info
    vehicleMake: agreement.vehicles?.make || 'غير محدد',
    vehicleModel: agreement.vehicles?.model || 'غير محدد',
    vehicleYear: agreement.vehicles?.year?.toString() || 'غير محدد',
    licensePlate: agreement.vehicles?.license_plate || 'غير محدد',
    vehicleColor: agreement.vehicles?.color || 'غير محدد',
    vinNumber: agreement.vehicles?.vin || 'غير محدد',
    engineNumber: 'غير محدد', // Not available in current schema
    
    // Financial info
    monthlyRent: formatArabicCurrency(agreement.rent_amount),
    totalAmount: formatArabicCurrency(agreement.total_amount),
    depositAmount: formatArabicCurrency(agreement.deposit_amount),
    paymentMethod: 'تحويل بنكي / نقداً',
    lateFee: formatArabicCurrency(agreement.daily_late_fee || 120)
  };
}

// Create comprehensive contract document definition
function createContractDocumentDefinition(agreementData: ReturnType<typeof mapAgreementData>) {
  return {
    pageSize: 'A4',
    pageMargins: [40, 100, 40, 80],
    
    // Header with company branding
    header: {
      margin: [40, 20, 40, 0],
      table: {
        widths: ['*'],
        body: [[
          {
            stack: [
              {
                text: contractLabels.companyName.ar,
                style: 'companyHeaderName',
                alignment: 'center',
                margin: [0, 10, 0, 5]
              },
              {
                text: contractLabels.companyAddress.ar,
                style: 'companyHeaderInfo',
                alignment: 'center',
                margin: [0, 0, 0, 2]
              },
              {
                text: `${contractLabels.companyPhone.ar} | ${contractLabels.companyEmail.ar}`,
                style: 'companyHeaderInfo',
                alignment: 'center',
                margin: [0, 0, 0, 2]
              },
              {
                text: contractLabels.commercialRecord.ar,
                style: 'companyHeaderInfo',
                alignment: 'center',
                margin: [0, 0, 0, 10]
              }
            ],
            fillColor: colors.headerBg,
            color: colors.headerText
          }
        ]]
      },
      layout: 'noBorders'
    },
    
    // Footer with legal notice
    footer: (currentPage: number, pageCount: number) => {
      return {
        margin: [40, 10, 40, 20],
        table: {
          widths: ['*'],
          body: [[
            {
              stack: [
                {
                  text: contractLabels.legalNotice.ar,
                  style: 'footerNotice',
                  alignment: 'center',
                  margin: [0, 5, 0, 2]
                },
                {
                  text: contractLabels.confidentialityNotice.ar,
                  style: 'footerNotice',
                  alignment: 'center',
                  margin: [0, 0, 0, 5]
                },
                {
                  text: `صفحة ${currentPage} من ${pageCount}`,
                  style: 'pageNumber',
                  alignment: 'center'
                }
              ],
              fillColor: colors.lighter
            }
          ]]
        },
        layout: 'noBorders'
      };
    },
    
    // Main content
    content: [
      // Contract title and metadata
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                text: contractLabels.contractTitle.ar,
                style: 'contractMainTitle',
                alignment: 'center',
                colSpan: 2,
                margin: [0, 20, 0, 20]
              },
              {}
            ],
            [
              createArabicTextBlock(`${contractLabels.documentNumber.ar}: ${agreementData.documentNumber}`, 'documentMeta'),
              createArabicTextBlock(`${contractLabels.issueDate.ar}: ${agreementData.issueDate}`, 'documentMeta')
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      },
      
      // First Party (Lessor) section
      {
        text: contractLabels.firstParty.ar,
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          widths: ['100%'],
          body: [
            [
              {
                stack: [
                  createArabicTextBlock(contractLabels.companyName.ar, 'partyMainInfo'),
                  createArabicTextBlock(contractLabels.companyAddress.ar, 'partySubInfo'),
                  createArabicTextBlock(contractLabels.commercialRecord.ar, 'partySubInfo')
                ],
                margin: [10, 10, 10, 10]
              }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Second Party (Tenant) section
      {
        text: contractLabels.secondParty.ar,
        style: 'sectionHeader',
        margin: [0, 10, 0, 10]
      },
      
      // Customer information table
      {
        table: {
          widths: ['25%', '75%'],
          body: [
            [
              createArabicTextBlock(contractLabels.customerName.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.customerName, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.nationality.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.nationality, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.idNumber.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.idNumber, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.phoneNumber.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.phoneNumber, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.email.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.email, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.address.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.address, 'valueStyle')
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Vehicle details section
      {
        text: contractLabels.vehicleDetails.ar,
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      
      {
        table: {
          widths: ['25%', '75%'],
          body: [
            [
              createArabicTextBlock(contractLabels.make.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.vehicleMake, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.model.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.vehicleModel, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.year.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.vehicleYear, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.licensePlate.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.licensePlate, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.color.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.vehicleColor, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.vinNumber.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.vinNumber, 'valueStyle')
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Contract terms section
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              createArabicTextBlock(`${contractLabels.startDate.ar}: ${agreementData.startDate}`, 'contractTerms'),
              createArabicTextBlock(`${contractLabels.endDate.ar}: ${agreementData.endDate}`, 'contractTerms')
            ],
            [
              createArabicTextBlock(`${contractLabels.duration.ar}: ${agreementData.duration}`, 'contractTerms'),
              createArabicTextBlock(`${contractLabels.paymentDay.ar}: ${agreementData.paymentDay}`, 'contractTerms')
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 20, 0, 20]
      },
      
      // Financial terms section
      {
        text: contractLabels.financialTerms.ar,
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              createArabicTextBlock(contractLabels.monthlyRent.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.monthlyRent, 'financialValue')
            ],
            [
              createArabicTextBlock(contractLabels.totalAmount.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.totalAmount, 'financialValue')
            ],
            [
              createArabicTextBlock(contractLabels.depositAmount.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.depositAmount, 'financialValue')
            ],
            [
              createArabicTextBlock(contractLabels.paymentMethod.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.paymentMethod, 'valueStyle')
            ],
            [
              createArabicTextBlock(contractLabels.lateFee.ar, 'labelStyle'),
              createArabicTextBlock(agreementData.lateFee, 'financialValue')
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 30]
      },
      
      // Contract articles title
      {
        text: contractLabels.articlesTitle.ar,
        style: 'articlesTitle',
        alignment: 'center',
        margin: [0, 30, 0, 20]
      },
      
      // Article 1
      {
        text: contractLabels.article1Title.ar,
        style: 'articleTitle',
        margin: [0, 15, 0, 8]
      },
      {
        stack: [
          createArabicTextBlock(contractLabels.article1_1.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article1_2.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article1_3.ar, 'articleText')
        ],
        margin: [0, 0, 0, 15]
      },
      
      // Article 2
      {
        text: contractLabels.article2Title.ar,
        style: 'articleTitle',
        margin: [0, 10, 0, 8]
      },
      {
        stack: [
          createArabicTextBlock(contractLabels.article2_1.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article2_2.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article2_3.ar, 'articleText')
        ],
        margin: [0, 0, 0, 15]
      },
      
      // Article 3
      {
        text: contractLabels.article3Title.ar,
        style: 'articleTitle',
        margin: [0, 10, 0, 8]
      },
      {
        stack: [
          createArabicTextBlock(contractLabels.article3_1.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article3_2.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article3_3.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article3_4.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article3_5.ar, 'articleText')
        ],
        margin: [0, 0, 0, 15]
      },
      
      // Article 4
      {
        text: contractLabels.article4Title.ar,
        style: 'articleTitle',
        margin: [0, 10, 0, 8]
      },
      {
        stack: [
          createArabicTextBlock(contractLabels.article4_1.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article4_2.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article4_3.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article4_4.ar, 'articleText')
        ],
        margin: [0, 0, 0, 15]
      },
      
      // Article 5
      {
        text: contractLabels.article5Title.ar,
        style: 'articleTitle',
        margin: [0, 10, 0, 8]
      },
      {
        stack: [
          createArabicTextBlock(contractLabels.article5_1.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article5_2.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article5_3.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article5_4.ar, 'articleText')
        ],
        margin: [0, 0, 0, 15]
      },
      
      // Article 6
      {
        text: contractLabels.article6Title.ar,
        style: 'articleTitle',
        margin: [0, 10, 0, 8]
      },
      {
        stack: [
          createArabicTextBlock(contractLabels.article6_1.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article6_2.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article6_3.ar, 'articleText')
        ],
        margin: [0, 0, 0, 15]
      },
      
      // Article 7
      {
        text: contractLabels.article7Title.ar,
        style: 'articleTitle',
        margin: [0, 10, 0, 8]
      },
      {
        stack: [
          createArabicTextBlock(contractLabels.article7_1.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article7_2.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article7_3.ar, 'articleText')
        ],
        margin: [0, 0, 0, 15]
      },
      
      // Article 8
      {
        text: contractLabels.article8Title.ar,
        style: 'articleTitle',
        margin: [0, 10, 0, 8]
      },
      {
        stack: [
          createArabicTextBlock(contractLabels.article8_1.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article8_2.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article8_3.ar, 'articleText')
        ],
        margin: [0, 0, 0, 15]
      },
      
      // Article 9
      {
        text: contractLabels.article9Title.ar,
        style: 'articleTitle',
        margin: [0, 10, 0, 8]
      },
      {
        stack: [
          createArabicTextBlock(contractLabels.article9_1.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article9_2.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article9_3.ar, 'articleText')
        ],
        margin: [0, 0, 0, 15]
      },
      
      // Article 10
      {
        text: contractLabels.article10Title.ar,
        style: 'articleTitle',
        margin: [0, 10, 0, 8]
      },
      {
        stack: [
          createArabicTextBlock(contractLabels.article10_1.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article10_2.ar, 'articleText'),
          createArabicTextBlock(contractLabels.article10_3.ar, 'articleText')
        ],
        margin: [0, 0, 0, 30]
      },
      
      // Signatures section
      {
        text: contractLabels.signatures.ar,
        style: 'articlesTitle',
        alignment: 'center',
        margin: [0, 30, 0, 20]
      },
      
      {
        table: {
          widths: ['33%', '33%', '34%'],
          body: [
            [
              {
                stack: [
                  createArabicTextBlock(contractLabels.firstPartySignature.ar, 'signatureHeader'),
                  { text: '', margin: [0, 25, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(contractLabels.signatureName.ar, 'signatureLabel'),
                  { text: '', margin: [0, 10, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(contractLabels.signatureDate.ar, 'signatureLabel'),
                  { text: '', margin: [0, 10, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(contractLabels.signatureStamp.ar, 'signatureLabel')
                ]
              },
              {
                stack: [
                  createArabicTextBlock(contractLabels.secondPartySignature.ar, 'signatureHeader'),
                  { text: '', margin: [0, 25, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(contractLabels.signatureName.ar, 'signatureLabel'),
                  { text: '', margin: [0, 10, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(contractLabels.signatureDate.ar, 'signatureLabel'),
                  { text: '', margin: [0, 10, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(contractLabels.signatureStamp.ar, 'signatureLabel')
                ]
              },
              {
                stack: [
                  createArabicTextBlock(contractLabels.witnessSignature.ar, 'signatureHeader'),
                  { text: '', margin: [0, 25, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(contractLabels.signatureName.ar, 'signatureLabel'),
                  { text: '', margin: [0, 10, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(contractLabels.signatureDate.ar, 'signatureLabel'),
                  { text: '', margin: [0, 10, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(contractLabels.signatureStamp.ar, 'signatureLabel')
                ]
              }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      }
    ],
    
    // Enhanced styles for professional Arabic legal document
    styles: {
      companyHeaderName: {
        fontSize: 20,
        bold: true,
        font: 'Amiri',
        color: colors.headerText,
        alignment: 'center'
      },
      companyHeaderInfo: {
        fontSize: 11,
        font: 'Amiri',
        color: colors.headerText,
        alignment: 'center'
      },
      contractMainTitle: {
        fontSize: 24,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        alignment: 'center'
      },
      documentMeta: {
        fontSize: 10,
        font: 'Amiri',
        color: colors.textLight,
        alignment: 'right'
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        alignment: 'right',
        decoration: 'underline'
      },
      partyMainInfo: {
        fontSize: 14,
        bold: true,
        font: 'Amiri',
        color: colors.text,
        alignment: 'right'
      },
      partySubInfo: {
        fontSize: 11,
        font: 'Amiri',
        color: colors.textLight,
        alignment: 'right'
      },
      labelStyle: {
        fontSize: 11,
        bold: true,
        font: 'Amiri',
        color: colors.textLight,
        alignment: 'right'
      },
      valueStyle: {
        fontSize: 12,
        font: 'Amiri',
        color: colors.text,
        alignment: 'right'
      },
      contractTerms: {
        fontSize: 11,
        font: 'Amiri',
        color: colors.text,
        alignment: 'right'
      },
      financialValue: {
        fontSize: 13,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        alignment: 'right'
      },
      articlesTitle: {
        fontSize: 18,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        alignment: 'center',
        decoration: 'underline'
      },
      articleTitle: {
        fontSize: 14,
        bold: true,
        font: 'Amiri',
        color: colors.text,
        alignment: 'right'
      },
      articleText: {
        fontSize: 11,
        font: 'Amiri',
        color: colors.text,
        alignment: 'right',
        margin: [0, 0, 0, 6],
        lineHeight: 1.4
      },
      signatureHeader: {
        fontSize: 12,
        bold: true,
        font: 'Amiri',
        color: colors.text,
        alignment: 'center'
      },
      signatureLabel: {
        fontSize: 9,
        font: 'Amiri',
        color: colors.textLight,
        alignment: 'center'
      },
      footerNotice: {
        fontSize: 8,
        font: 'Amiri',
        color: colors.textLight,
        alignment: 'center'
      },
      pageNumber: {
        fontSize: 8,
        font: 'Amiri',
        color: colors.textLight,
        alignment: 'center'
      }
    },
    
    defaultStyle: {
      font: 'Amiri',
      fontSize: 11,
      rtl: true,
      alignment: 'right',
      lineHeight: 1.3
    }
  };
}

// Main contract generation function
export async function generateArabicContract(agreement: Agreement): Promise<boolean> {
  try {
    console.log('Starting comprehensive Arabic contract generation for agreement:', agreement.id);
    
    // Ensure fonts are loaded
    await initializeFonts();
    
    // Map agreement data to contract placeholders
    const contractData = mapAgreementData(agreement);
    console.log('Mapped comprehensive contract data:', contractData);
    
    // Create document definition
    const docDefinition = createContractDocumentDefinition(contractData);
    
    // Generate and download the PDF
    const fileName = prepareArabicForPDF(`عقد-إيجار-مركبة-شامل-${agreement.agreement_number || 'غير-محدد'}.pdf`);
    
    console.log('Generating comprehensive PDF with filename:', fileName);
    pdfMake.createPdf(docDefinition).download(fileName);
    
    toast.success('تم إنشاء عقد الإيجار الشامل بنجاح');
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
