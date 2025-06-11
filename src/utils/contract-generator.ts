
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

// Simplified contract labels for core functionality
const contractLabels = {
  contractTitle: 'عقد إيجار مركبة',
  companyName: 'شركة العراف لتأجير السيارات ذ.م.م',
  
  // Basic contract info
  agreementNumber: 'رقم العقد',
  contractDate: 'تاريخ العقد',
  startDate: 'تاريخ البدء',
  endDate: 'تاريخ الانتهاء',
  duration: 'مدة الإيجار',
  
  // Customer info
  customerName: 'اسم المستأجر',
  nationality: 'الجنسية',
  phoneNumber: 'رقم الهاتف',
  email: 'البريد الإلكتروني',
  
  // Vehicle info
  vehicleDetails: 'تفاصيل المركبة',
  make: 'الماركة',
  model: 'الموديل',
  year: 'سنة الصنع',
  licensePlate: 'رقم اللوحة',
  
  // Financial terms
  monthlyRent: 'الإيجار الشهري',
  totalAmount: 'المبلغ الإجمالي',
  depositAmount: 'مبلغ الضمان',
  
  // Basic terms
  basicTerms: 'الشروط الأساسية',
  term1: '1. يلتزم المستأجر بدفع الإيجار الشهري في التاريخ المحدد.',
  term2: '2. المستأجر مسؤول عن أي أضرار تلحق بالمركبة.',
  term3: '3. جميع المخالفات المرورية على عهدة المستأجر.',
  
  // Signatures
  signatures: 'التوقيعات',
  firstParty: 'الطرف الأول (المؤجر)',
  secondParty: 'الطرف الثاني (المستأجر)',
  
  // Footer
  legalNotice: 'هذا العقد محرر باللغة العربية ويخضع للقوانين المعمول بها في دولة قطر'
};

// Simplified color scheme
const colors = {
  primary: '#1e40af',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb'
};

// Helper function to format date safely
function formatDateSafe(date: string | Date | undefined): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

// Calculate duration safely
function calculateDurationSafe(startDate: Date, endDate: Date): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
}

// Create simplified document definition using built-in fonts
function createSimpleContractDocument(agreement: Agreement) {
  console.log('Creating contract document for agreement:', agreement.id);
  
  const currentDate = new Date();
  const startDate = new Date(agreement.start_date);
  const endDate = new Date(agreement.end_date);
  const duration = calculateDurationSafe(startDate, endDate);
  
  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    content: [
      // Header
      {
        text: contractLabels.companyName,
        style: 'companyName',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      
      {
        text: contractLabels.contractTitle,
        style: 'contractTitle',
        alignment: 'center',
        margin: [0, 0, 0, 30]
      },
      
      // Contract basic info
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: `${contractLabels.agreementNumber}: ${agreement.agreement_number || 'غير محدد'}`, style: 'contractInfo' },
              { text: `${contractLabels.contractDate}: ${formatDateSafe(currentDate)}`, style: 'contractInfo' }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      },
      
      // Customer information
      {
        text: 'معلومات المستأجر',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: contractLabels.customerName, style: 'labelStyle' },
              { text: agreement.customers?.full_name || 'غير محدد', style: 'valueStyle' }
            ],
            [
              { text: contractLabels.phoneNumber, style: 'labelStyle' },
              { text: agreement.customers?.phone_number || 'غير محدد', style: 'valueStyle' }
            ],
            [
              { text: contractLabels.email, style: 'labelStyle' },
              { text: agreement.customers?.email || 'غير محدد', style: 'valueStyle' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Vehicle information
      {
        text: contractLabels.vehicleDetails,
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: contractLabels.make, style: 'labelStyle' },
              { text: agreement.vehicles?.make || 'غير محدد', style: 'valueStyle' }
            ],
            [
              { text: contractLabels.model, style: 'labelStyle' },
              { text: agreement.vehicles?.model || 'غير محدد', style: 'valueStyle' }
            ],
            [
              { text: contractLabels.year, style: 'labelStyle' },
              { text: agreement.vehicles?.year?.toString() || 'غير محدد', style: 'valueStyle' }
            ],
            [
              { text: contractLabels.licensePlate, style: 'labelStyle' },
              { text: agreement.vehicles?.license_plate || 'غير محدد', style: 'valueStyle' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Financial terms
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: contractLabels.monthlyRent, style: 'labelStyle' },
              { text: formatArabicCurrency(agreement.rent_amount), style: 'financialValue' }
            ],
            [
              { text: contractLabels.totalAmount, style: 'labelStyle' },
              { text: formatArabicCurrency(agreement.total_amount), style: 'financialValue' }
            ],
            [
              { text: contractLabels.depositAmount, style: 'labelStyle' },
              { text: formatArabicCurrency(agreement.deposit_amount), style: 'financialValue' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 20, 0, 30]
      },
      
      // Basic terms
      {
        text: contractLabels.basicTerms,
        style: 'sectionHeader',
        margin: [0, 20, 0, 15]
      },
      
      {
        ul: [
          contractLabels.term1,
          contractLabels.term2,
          contractLabels.term3
        ],
        style: 'termsList',
        margin: [0, 0, 0, 40]
      },
      
      // Signatures
      {
        text: contractLabels.signatures,
        style: 'sectionHeader',
        alignment: 'center',
        margin: [0, 30, 0, 20]
      },
      
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                stack: [
                  { text: contractLabels.firstParty, style: 'signatureLabel' },
                  { text: '', margin: [0, 30, 0, 0] },
                  { text: '________________________', alignment: 'center' }
                ]
              },
              {
                stack: [
                  { text: contractLabels.secondParty, style: 'signatureLabel' },
                  { text: '', margin: [0, 30, 0, 0] },
                  { text: '________________________', alignment: 'center' }
                ]
              }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 40]
      },
      
      // Footer notice
      {
        text: contractLabels.legalNotice,
        style: 'footerNotice',
        alignment: 'center',
        margin: [0, 20, 0, 0]
      }
    ],
    
    // Updated styles to use built-in fonts only
    styles: {
      companyName: {
        fontSize: 18,
        color: colors.primary,
        font: 'Helvetica'
      },
      contractTitle: {
        fontSize: 16,
        color: colors.text,
        font: 'Helvetica'
      },
      contractInfo: {
        fontSize: 11,
        color: colors.text,
        alignment: 'right',
        font: 'Helvetica'
      },
      sectionHeader: {
        fontSize: 14,
        color: colors.primary,
        alignment: 'right',
        font: 'Helvetica'
      },
      labelStyle: {
        fontSize: 11,
        color: colors.textLight,
        alignment: 'right',
        font: 'Helvetica'
      },
      valueStyle: {
        fontSize: 11,
        color: colors.text,
        alignment: 'right',
        font: 'Helvetica'
      },
      financialValue: {
        fontSize: 12,
        color: colors.primary,
        alignment: 'right',
        font: 'Helvetica'
      },
      termsList: {
        fontSize: 11,
        color: colors.text,
        alignment: 'right',
        font: 'Helvetica'
      },
      signatureLabel: {
        fontSize: 11,
        color: colors.text,
        alignment: 'center',
        font: 'Helvetica'
      },
      footerNotice: {
        fontSize: 8,
        color: colors.textLight,
        font: 'Helvetica'
      }
    },
    
    // Updated defaultStyle to use built-in fonts
    defaultStyle: {
      fontSize: 11,
      alignment: 'right',
      font: 'Helvetica'
    }
  };
}

// Main contract generation function with enhanced error handling
export async function generateArabicContract(agreement: Agreement): Promise<boolean> {
  console.log('Starting Arabic contract generation for agreement:', agreement.id);
  
  try {
    // Initialize fonts with fallback
    console.log('Initializing fonts...');
    const fontsReady = await initializeFonts();
    console.log('Fonts initialization result:', fontsReady);
    
    // Create document definition
    console.log('Creating document definition...');
    const docDefinition = createSimpleContractDocument(agreement);
    console.log('Document definition created successfully');
    console.log('Using font configuration:', (pdfMake as any).fonts);
    
    // Generate filename safely
    const safeAgreementNumber = agreement.agreement_number || 'غير-محدد';
    const fileName = `عقد-إيجار-${safeAgreementNumber}.pdf`;
    console.log('Generating PDF with filename:', fileName);
    
    // Generate and download PDF
    const pdf = pdfMake.createPdf(docDefinition);
    pdf.download(fileName);
    
    console.log('PDF generation completed successfully');
    toast.success('تم إنشاء عقد الإيجار بنجاح');
    return true;
    
  } catch (error) {
    console.error('Error in generateArabicContract:', error);
    
    // Provide user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('Contract generation failed:', errorMessage);
    
    toast.error('فشل في إنشاء عقد الإيجار. يرجى المحاولة مرة أخرى.');
    return false;
  }
}

// Generate and store contract (for future integration)
export async function generateAndStoreContract(agreement: Agreement): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('Generating and storing contract for agreement:', agreement.id);
    const success = await generateArabicContract(agreement);
    
    if (success) {
      return { 
        success: true, 
        url: `contract-${agreement.id}-${Date.now()}.pdf`
      };
    } else {
      return { 
        success: false, 
        error: 'فشل في إنشاء العقد' 
      };
    }
  } catch (error) {
    console.error('Error in generateAndStoreContract:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'خطأ غير معروف' 
    };
  }
}
