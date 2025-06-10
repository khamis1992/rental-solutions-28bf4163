
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

// Enhanced contract labels with better organization
const contractLabels = {
  // Header
  contractTitle: { ar: 'عقد إيجار مركبة' },
  companyName: { ar: 'شركة العراف لتأجير السيارات ذ.م.م' },
  
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
  idNumber: { ar: 'رقم الهوية' },
  phoneNumber: { ar: 'رقم الهاتف' },
  email: { ar: 'البريد الإلكتروني' },
  
  // Vehicle information
  vehicleDetails: { ar: 'تفاصيل المركبة' },
  make: { ar: 'الماركة' },
  model: { ar: 'الموديل' },
  year: { ar: 'سنة الصنع' },
  licensePlate: { ar: 'رقم اللوحة' },
  color: { ar: 'اللون' },
  vinNumber: { ar: 'رقم الهيكل' },
  
  // Financial terms
  financialTerms: { ar: 'الشروط المالية' },
  monthlyRent: { ar: 'الإيجار الشهري' },
  totalAmount: { ar: 'المبلغ الإجمالي' },
  depositAmount: { ar: 'مبلغ الضمان' },
  paymentDay: { ar: 'يوم الدفع' },
  
  // Terms and conditions
  termsConditions: { ar: 'الشروط والأحكام' },
  term1: { ar: '1. يلتزم المستأجر بدفع الإيجار الشهري في التاريخ المحدد.' },
  term2: { ar: '2. يحق للمؤجر استرداد المركبة في حالة عدم الدفع.' },
  term3: { ar: '3. المستأجر مسؤول عن أي أضرار تلحق بالمركبة.' },
  term4: { ar: '4. يجب إرجاع المركبة بنفس الحالة التي تم تسليمها بها.' },
  term5: { ar: '5. أي مخالفات مرورية تقع على عهدة المستأجر.' },
  term6: { ar: '6. يحق للمؤجر فسخ العقد في حالة مخالفة أي من هذه الشروط.' },
  
  // Signatures
  signatures: { ar: 'التوقيعات' },
  firstPartySignature: { ar: 'توقيع الطرف الأول' },
  secondPartySignature: { ar: 'توقيع الطرف الثاني' },
  date: { ar: 'التاريخ' },
  
  // Footer
  legalNotice: { ar: 'هذا العقد محرر باللغة العربية ويخضع للقوانين المعمول بها في دولة قطر' }
};

// Professional color scheme
const colors = {
  primary: '#1e40af',
  secondary: '#64748b',
  accent: '#0ea5e9',
  text: '#334155',
  textLight: '#64748b',
  border: '#e2e8f0',
  light: '#f8fafc',
  lighter: '#f1f5f9'
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
    
    // Vehicle info
    vehicleMake: agreement.vehicles?.make || 'غير محدد',
    vehicleModel: agreement.vehicles?.model || 'غير محدد',
    vehicleYear: agreement.vehicles?.year?.toString() || 'غير محدد',
    licensePlate: agreement.vehicles?.license_plate || 'غير محدد',
    vehicleColor: agreement.vehicles?.color || 'غير محدد',
    vinNumber: agreement.vehicles?.vin || 'غير محدد',
    
    // Financial info
    monthlyRent: formatArabicCurrency(agreement.rent_amount),
    totalAmount: formatArabicCurrency(agreement.total_amount),
    depositAmount: formatArabicCurrency(agreement.deposit_amount)
  };
}

// Create the PDF document definition
function createContractDocumentDefinition(agreementData: ReturnType<typeof mapAgreementData>) {
  return {
    pageSize: 'A4',
    pageMargins: [50, 80, 50, 100],
    
    // Header with company branding
    header: {
      margin: [50, 30, 50, 0],
      table: {
        widths: ['*'],
        body: [[
          {
            stack: [
              {
                text: contractLabels.companyName.ar,
                style: 'companyName',
                alignment: 'center',
                margin: [0, 0, 0, 5]
              },
              {
                text: contractLabels.contractTitle.ar,
                style: 'contractTitle',
                alignment: 'center',
                margin: [0, 0, 0, 10]
              }
            ],
            fillColor: colors.lighter,
            border: [false, false, false, true],
            borderColor: [colors.primary, colors.primary, colors.primary, colors.primary]
          }
        ]]
      },
      layout: 'noBorders'
    },
    
    // Footer with legal notice
    footer: (currentPage: number, pageCount: number) => {
      return {
        margin: [50, 20, 50, 30],
        table: {
          widths: ['*'],
          body: [[
            {
              stack: [
                {
                  text: contractLabels.legalNotice.ar,
                  style: 'legalNotice',
                  alignment: 'center',
                  margin: [0, 0, 0, 5]
                },
                {
                  text: `صفحة ${currentPage} من ${pageCount}`,
                  style: 'pageNumber',
                  alignment: 'center'
                }
              ]
            }
          ]]
        },
        layout: 'noBorders'
      };
    },
    
    // Main content
    content: [
      // Contract header information
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              createArabicTextBlock(`${contractLabels.agreementNumber.ar}: ${agreementData.agreementNumber}`, 'contractInfo'),
              createArabicTextBlock(`${contractLabels.contractDate.ar}: ${agreementData.contractDate}`, 'contractInfo')
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 20, 0, 20]
      },
      
      // Parties section
      {
        text: contractLabels.firstParty.ar,
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        text: contractLabels.companyName.ar,
        style: 'partyInfo',
        margin: [20, 0, 0, 15]
      },
      
      {
        text: contractLabels.secondParty.ar,
        style: 'sectionHeader',
        margin: [0, 10, 0, 10]
      },
      
      // Customer information table
      {
        table: {
          widths: ['30%', '70%'],
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
          widths: ['30%', '70%'],
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
          widths: ['40%', '60%'],
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
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 30]
      },
      
      // Terms and conditions
      {
        text: contractLabels.termsConditions.ar,
        style: 'sectionHeader',
        margin: [0, 20, 0, 15]
      },
      
      {
        stack: [
          createArabicTextBlock(contractLabels.term1.ar, 'termText'),
          createArabicTextBlock(contractLabels.term2.ar, 'termText'),
          createArabicTextBlock(contractLabels.term3.ar, 'termText'),
          createArabicTextBlock(contractLabels.term4.ar, 'termText'),
          createArabicTextBlock(contractLabels.term5.ar, 'termText'),
          createArabicTextBlock(contractLabels.term6.ar, 'termText')
        ],
        margin: [0, 0, 0, 40]
      },
      
      // Signatures section
      {
        text: contractLabels.signatures.ar,
        style: 'sectionHeader',
        margin: [0, 30, 0, 20]
      },
      
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                stack: [
                  createArabicTextBlock(contractLabels.firstPartySignature.ar, 'signatureLabel'),
                  { text: '', margin: [0, 30, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(`${contractLabels.date.ar}: _______________`, 'signatureDate')
                ]
              },
              {
                stack: [
                  createArabicTextBlock(contractLabels.secondPartySignature.ar, 'signatureLabel'),
                  { text: '', margin: [0, 30, 0, 0] },
                  { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                  createArabicTextBlock(`${contractLabels.date.ar}: _______________`, 'signatureDate')
                ]
              }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      }
    ],
    
    // Enhanced styles for Arabic legal document
    styles: {
      companyName: {
        fontSize: 18,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        alignment: 'center'
      },
      contractTitle: {
        fontSize: 16,
        bold: true,
        font: 'Amiri',
        color: colors.text,
        alignment: 'center'
      },
      contractInfo: {
        fontSize: 11,
        font: 'Amiri',
        color: colors.text,
        alignment: 'right'
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        alignment: 'right'
      },
      partyInfo: {
        fontSize: 12,
        font: 'Amiri',
        color: colors.text,
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
        fontSize: 11,
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
        fontSize: 12,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        alignment: 'right'
      },
      termText: {
        fontSize: 10,
        font: 'Amiri',
        color: colors.text,
        alignment: 'right',
        margin: [0, 0, 0, 8]
      },
      signatureLabel: {
        fontSize: 11,
        bold: true,
        font: 'Amiri',
        color: colors.text,
        alignment: 'center'
      },
      signatureDate: {
        fontSize: 10,
        font: 'Amiri',
        color: colors.textLight,
        alignment: 'center'
      },
      legalNotice: {
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
      alignment: 'right'
    }
  };
}

// Main contract generation function
export async function generateArabicContract(agreement: Agreement): Promise<boolean> {
  try {
    console.log('Starting Arabic contract generation for agreement:', agreement.id);
    
    // Ensure fonts are loaded - using initializeFonts instead of ensureFontsLoaded
    await initializeFonts();
    
    // Map agreement data to contract placeholders
    const contractData = mapAgreementData(agreement);
    console.log('Mapped contract data:', contractData);
    
    // Create document definition
    const docDefinition = createContractDocumentDefinition(contractData);
    
    // Generate and download the PDF
    const fileName = prepareArabicForPDF(`عقد-إيجار-مركبة-${agreement.agreement_number || 'غير-محدد'}.pdf`);
    
    console.log('Generating PDF with filename:', fileName);
    pdfMake.createPdf(docDefinition).download(fileName);
    
    toast.success('تم إنشاء عقد الإيجار بنجاح');
    return true;
    
  } catch (error) {
    console.error('Error generating Arabic contract:', error);
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
        url: `contract-${agreement.id}-${Date.now()}.pdf` // Placeholder URL
      };
    } else {
      return { 
        success: false, 
        error: 'Failed to generate contract' 
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
