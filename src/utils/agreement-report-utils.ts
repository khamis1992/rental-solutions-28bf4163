
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  prepareArabicForPDF, 
  createArabicTextBlock, 
  formatArabicCurrency, 
  formatArabicDate 
} from './arabic-text-utils';

// Enhanced font configuration with better fallbacks
export async function ensureFontsLoaded() {
  try {
    // Set up font configuration with proper fallbacks
    (pdfMake as any).fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      },
      Amiri: {
        normal: 'Amiri-Regular.ttf',
        bold: 'Amiri-Bold.ttf',
        italics: 'Amiri-Regular.ttf',
        bolditalics: 'Amiri-Bold.ttf',
      }
    };
    
    // Set default font to Roboto with Amiri as fallback for Arabic
    (pdfMake as any).defaultFont = 'Roboto';
  } catch (error) {
    console.warn('Font loading failed, using browser defaults:', error);
    // Fallback to browser defaults if font loading fails
    (pdfMake as any).fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
  }
}

// Helper function to format numbers in English
const formatEnglishNumber = (value: number | null | undefined): string => {
  if (!value && value !== 0) return '0';
  return value.toLocaleString('en-US');
};

// Helper function to format currency in English
const formatEnglishCurrency = (value: number | null | undefined): string => {
  if (!value && value !== 0) return 'QAR 0';
  return `QAR ${value.toLocaleString('en-US')}`;
};

// Simplified Arabic labels without complex RTL formatting
const labels = {
  // Header
  reportTitle: { ar: 'تقرير عقد الإيجار الشامل', en: 'COMPREHENSIVE RENTAL AGREEMENT REPORT' },
  companyName: { ar: 'شركة العرف لتأجير السيارات ذ.م.م', en: 'ALARAF CAR RENTAL COMPANY LLC' },
  
  // Document info
  agreementInfo: { ar: 'معلومات العقد', en: 'Agreement Information' },
  agreementNumber: { ar: 'رقم العقد', en: 'Agreement Number' },
  status: { ar: 'حالة العقد', en: 'Status' },
  startDate: { ar: 'تاريخ البدء', en: 'Start Date' },
  endDate: { ar: 'تاريخ الانتهاء', en: 'End Date' },
  duration: { ar: 'مدة العقد', en: 'Duration' },
  monthlyRent: { ar: 'الإيجار الشهري', en: 'Monthly Rent' },
  contractTotal: { ar: 'إجمالي العقد', en: 'Contract Total' },
  depositAmount: { ar: 'مبلغ التأمين', en: 'Deposit Amount' },
  
  // Customer info
  customerInfo: { ar: 'معلومات العميل', en: 'Customer Information' },
  name: { ar: 'الاسم الكامل', en: 'Full Name' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
  driverLicense: { ar: 'رخصة القيادة', en: 'Driver License' },
  nationality: { ar: 'الجنسية', en: 'Nationality' },
  address: { ar: 'العنوان', en: 'Address' },
  
  // Vehicle info
  vehicleInfo: { ar: 'معلومات المركبة', en: 'Vehicle Information' },
  makeModel: { ar: 'الماركة والموديل', en: 'Make & Model' },
  year: { ar: 'سنة الصنع', en: 'Year' },
  licensePlate: { ar: 'رقم اللوحة', en: 'License Plate' },
  color: { ar: 'اللون', en: 'Color' },
  vin: { ar: 'رقم الهيكل', en: 'VIN' },
  
  // Financial summary
  financialSummary: { ar: 'الملخص المالي', en: 'Financial Summary' },
  totalPaid: { ar: 'إجمالي المدفوع', en: 'Total Paid' },
  totalDue: { ar: 'إجمالي المستحق', en: 'Total Due' },
  lateFees: { ar: 'رسوم التأخير', en: 'Late Fees' },
  remainingBalance: { ar: 'الرصيد المتبقي', en: 'Remaining Balance' },
  paymentProgress: { ar: 'تقدم الدفعات', en: 'Payment Progress' },
  
  // Payment details
  paymentHistory: { ar: 'سجل الدفعات', en: 'Payment History' },
  paymentDate: { ar: 'تاريخ الدفع', en: 'Payment Date' },
  amount: { ar: 'المبلغ', en: 'Amount' },
  paymentStatus: { ar: 'حالة الدفع', en: 'Payment Status' },
  paymentMethod: { ar: 'طريقة الدفع', en: 'Payment Method' },
  
  // Traffic fines
  trafficFines: { ar: 'المخالفات المرورية', en: 'Traffic Fines' },
  fineAmount: { ar: 'مبلغ المخالفة', en: 'Fine Amount' },
  fineDate: { ar: 'تاريخ المخالفة', en: 'Fine Date' },
  fineStatus: { ar: 'حالة المخالفة', en: 'Fine Status' },
  fineLocation: { ar: 'موقع المخالفة', en: 'Fine Location' },
  totalFines: { ar: 'إجمالي المخالفات', en: 'Total Fines' },
  
  // Footer
  confidential: { ar: 'سري - شركة العرف لتأجير السيارات', en: 'CONFIDENTIAL - ALARAF CAR RENTAL' },
  generatedOn: { ar: 'تم إنشاؤه في', en: 'Generated on' },
  pageOf: { ar: 'صفحة', en: 'Page' }
};

// Enhanced color scheme
const colors = {
  primary: '#1e40af',      // Professional blue
  secondary: '#64748b',    // Slate gray
  accent: '#0ea5e9',       // Sky blue
  success: '#059669',      // Emerald
  warning: '#d97706',      // Amber
  danger: '#dc2626',       // Red
  light: '#f8fafc',        // Very light gray
  lighter: '#f1f5f9',      // Light gray
  border: '#e2e8f0',       // Border gray
  text: '#334155',         // Dark gray
  textLight: '#64748b'     // Light text
};

// Calculate financial metrics
const calculateFinancialMetrics = (payments: any[], contractAmount: number | null) => {
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalLateFees = payments.reduce((sum, p) => sum + (p.late_fine_amount || 0), 0);
  const pendingPayments = payments
    .filter(p => p.status === 'pending' || p.status === 'partially_paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingBalance = (contractAmount || 0) - totalPaid;
  
  return {
    totalPaid,
    totalLateFees,
    pendingPayments,
    remainingBalance: Math.max(0, remainingBalance),
    paymentProgress: contractAmount ? Math.min(100, (totalPaid / contractAmount) * 100) : 0
  };
};

// Simplified bilingual text creation without complex RTL handling
const createBilingualRow = (arabicText: string, englishText: string, arabicStyle: string = 'arabicText', englishStyle: string = 'englishText') => [
  {
    text: arabicText,
    style: arabicStyle,
    alignment: 'right'
  },
  {
    text: englishText,
    style: englishStyle,
    alignment: 'left'
  }
];

// Helper function to create section headers
const createSectionHeader = (arabicText: string, englishText: string) => ({
  table: {
    widths: ['50%', '50%'],
    body: [createBilingualRow(arabicText, englishText, 'sectionHeaderAr', 'sectionHeaderEn')]
  },
  layout: {
    hLineWidth: () => 2,
    vLineWidth: () => 0,
    hLineColor: () => colors.primary
  },
  margin: [0, 15, 0, 10]
});

export async function generateAgreementReportPdfmake(
  agreement: any,
  rentAmount: any,
  contractAmount: any,
  payments: any[] = [],
  trafficFines: any[] = []
) {
  await ensureFontsLoaded();
  
  const metrics = calculateFinancialMetrics(payments, contractAmount);
  const currentDate = new Date().toLocaleDateString('en-US');
  
  // Simplified document definition
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 70, 40, 80],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 11,
      lineHeight: 1.3
    },
    
    // Header
    header: {
      margin: [40, 20, 40, 0],
      table: {
        widths: ['50%', '50%'],
        body: [createBilingualRow(
          labels.companyName.ar,
          labels.companyName.en,
          'companyNameAr',
          'companyNameEn'
        )]
      },
      layout: 'noBorders'
    },
    
    // Footer
    footer: (currentPage: number, pageCount: number) => ({
      margin: [40, 10, 40, 20],
      table: {
        widths: ['33%', '34%', '33%'],
        body: [[
          {
            text: labels.confidential.ar,
            style: 'footerText',
            alignment: 'right'
          },
          {
            text: `${labels.pageOf.en} ${currentPage} of ${pageCount}`,
            style: 'footerText',
            alignment: 'center'
          },
          {
            text: `${labels.generatedOn.en}: ${currentDate}`,
            style: 'footerText',
            alignment: 'left'
          }
        ]]
      },
      layout: 'noBorders'
    }),
    
    // Main content
    content: [
      // Report title
      {
        table: {
          widths: ['50%', '50%'],
          body: [createBilingualRow(
            labels.reportTitle.ar,
            labels.reportTitle.en,
            'reportTitleAr',
            'reportTitleEn'
          )]
        },
        layout: 'noBorders',
        fillColor: colors.primary,
        margin: [0, 0, 0, 25]
      },
      
      // Agreement overview
      createSectionHeader(labels.agreementInfo.ar, labels.agreementInfo.en),
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            // Headers
            createBilingualRow(labels.agreementNumber.ar, labels.agreementNumber.en).concat(
              createBilingualRow(labels.status.ar, labels.status.en)
            ),
            // Values
            createBilingualRow(
              agreement.agreement_number || 'غير محدد',
              agreement.agreement_number || 'Not specified'
            ).concat(
              createBilingualRow(
                agreement.status || 'غير محدد',
                agreement.status || 'Not specified'
              )
            )
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 25]
      },
      
      // Customer and Vehicle Information
      {
        table: {
          widths: ['48%', '4%', '48%'],
          body: [[
            // Customer Information
            {
              stack: [
                createSectionHeader(labels.customerInfo.ar, labels.customerInfo.en),
                {
                  table: {
                    widths: ['50%', '50%'],
                    body: [
                      createBilingualRow(labels.name.ar, labels.name.en),
                      createBilingualRow(
                        agreement.customers?.full_name || 'غير محدد',
                        agreement.customers?.full_name || 'Not specified'
                      ),
                      createBilingualRow(labels.phone.ar, labels.phone.en),
                      createBilingualRow(
                        agreement.customers?.phone_number || 'غير محدد',
                        agreement.customers?.phone_number || 'Not specified'
                      )
                    ]
                  },
                  layout: 'lightHorizontalLines'
                }
              ]
            },
            // Spacer
            { text: '' },
            // Vehicle Information
            {
              stack: [
                createSectionHeader(labels.vehicleInfo.ar, labels.vehicleInfo.en),
                {
                  table: {
                    widths: ['50%', '50%'],
                    body: [
                      createBilingualRow(labels.makeModel.ar, labels.makeModel.en),
                      createBilingualRow(
                        `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'غير محدد',
                        `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'Not specified'
                      ),
                      createBilingualRow(labels.licensePlate.ar, labels.licensePlate.en),
                      createBilingualRow(
                        agreement.vehicles?.license_plate || 'غير محدد',
                        agreement.vehicles?.license_plate || 'Not specified'
                      )
                    ]
                  },
                  layout: 'lightHorizontalLines'
                }
              ]
            }
          ]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 25]
      },
      
      // Financial summary
      createSectionHeader(labels.financialSummary.ar, labels.financialSummary.en),
      {
        table: {
          widths: ['20%', '20%', '20%', '20%', '20%'],
          body: [
            // Headers
            createBilingualRow(labels.contractTotal.ar, labels.contractTotal.en).concat([
              { text: labels.totalPaid.ar, style: 'metricLabel', alignment: 'right' },
              { text: labels.totalPaid.en, style: 'metricLabel', alignment: 'left' },
              { text: labels.remainingBalance.en, style: 'metricLabel', alignment: 'center' }
            ]),
            // Values
            createBilingualRow(
              formatEnglishCurrency(contractAmount),
              formatEnglishCurrency(contractAmount)
            ).concat([
              { text: formatEnglishCurrency(metrics.totalPaid), style: 'metricValueSuccess', alignment: 'right' },
              { text: formatEnglishCurrency(metrics.totalPaid), style: 'metricValueSuccess', alignment: 'left' },
              { text: formatEnglishCurrency(metrics.remainingBalance), style: 'metricValue', alignment: 'center' }
            ])
          ]
        },
        layout: 'lightHorizontalLines',
        fillColor: colors.light,
        margin: [0, 0, 0, 25]
      }
    ],
    
    // Simplified styles
    styles: {
      // Company styles
      companyNameAr: {
        fontSize: 16,
        bold: true,
        color: colors.primary,
        margin: [0, 0, 0, 2]
      },
      companyNameEn: {
        fontSize: 16,
        bold: true,
        color: colors.primary,
        margin: [0, 0, 0, 2]
      },
      
      // Report title styles
      reportTitleAr: {
        fontSize: 18,
        bold: true,
        color: 'white',
        margin: [5, 12, 5, 12]
      },
      reportTitleEn: {
        fontSize: 18,
        bold: true,
        color: 'white',
        margin: [5, 12, 5, 12]
      },
      
      // Section header styles
      sectionHeaderAr: {
        fontSize: 14,
        bold: true,
        color: colors.primary,
        margin: [5, 8, 5, 8]
      },
      sectionHeaderEn: {
        fontSize: 14,
        bold: true,
        color: colors.primary,
        margin: [5, 8, 5, 8]
      },
      
      // Text styles
      arabicText: {
        fontSize: 10,
        color: colors.text,
        margin: [3, 4, 3, 4]
      },
      englishText: {
        fontSize: 10,
        color: colors.text,
        margin: [3, 4, 3, 4]
      },
      
      // Metric styles
      metricLabel: {
        fontSize: 9,
        bold: true,
        color: colors.textLight,
        margin: [2, 3, 2, 3]
      },
      metricValue: {
        fontSize: 12,
        bold: true,
        color: colors.text,
        margin: [2, 3, 2, 3]
      },
      metricValueSuccess: {
        fontSize: 12,
        bold: true,
        color: colors.success,
        margin: [2, 3, 2, 3]
      },
      
      // Footer styles
      footerText: {
        fontSize: 8,
        color: colors.textLight,
        margin: [2, 2, 2, 2]
      }
    }
  };

  try {
    const fileName = `agreement-report-${agreement.agreement_number || 'unknown'}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}
