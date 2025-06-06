
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';

// Configure pdfMake to use minimal font setup without any file loading
export async function ensureFontsLoaded() {
  try {
    // Use the most basic font configuration possible
    pdfMake.fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica',
        italics: 'Helvetica',
        bolditalics: 'Helvetica'
      }
    };
    
    // Completely empty VFS to prevent any file system access
    pdfMake.vfs = {};
    
    console.log('Fonts configured successfully with browser defaults');
  } catch (error) {
    console.warn('Font configuration failed, using fallback:', error);
    // Fallback: don't set any fonts at all
    pdfMake.fonts = {};
    pdfMake.vfs = {};
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

// Labels for bilingual content
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
  monthlyRent: { ar: 'الإيجار الشهري', en: 'Monthly Rent' },
  contractTotal: { ar: 'إجمالي العقد', en: 'Contract Total' },
  
  // Customer info
  customerInfo: { ar: 'معلومات العميل', en: 'Customer Information' },
  name: { ar: 'الاسم الكامل', en: 'Full Name' },
  phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
  
  // Vehicle info
  vehicleInfo: { ar: 'معلومات المركبة', en: 'Vehicle Information' },
  makeModel: { ar: 'الماركة والموديل', en: 'Make & Model' },
  licensePlate: { ar: 'رقم اللوحة', en: 'License Plate' },
  
  // Financial summary
  financialSummary: { ar: 'الملخص المالي', en: 'Financial Summary' },
  totalPaid: { ar: 'إجمالي المدفوع', en: 'Total Paid' },
  remainingBalance: { ar: 'الرصيد المتبقي', en: 'Remaining Balance' },
  
  // Footer
  confidential: { ar: 'سري - شركة العرف لتأجير السيارات', en: 'CONFIDENTIAL - ALARAF CAR RENTAL' },
  generatedOn: { ar: 'تم إنشاؤه في', en: 'Generated on' },
  pageOf: { ar: 'صفحة', en: 'Page' }
};

// Color scheme
const colors = {
  primary: '#1e40af',
  text: '#334155',
  light: '#f8fafc',
  border: '#e2e8f0'
};

// Calculate financial metrics
const calculateFinancialMetrics = (payments: any[], contractAmount: number | null) => {
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingBalance = (contractAmount || 0) - totalPaid;
  
  return {
    totalPaid,
    remainingBalance: Math.max(0, remainingBalance)
  };
};

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
  
  // Ultra-simple document definition without any font specifications
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    content: [
      // Company Header
      {
        text: labels.companyName.en,
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10],
        color: colors.primary
      },
      
      // Report Title
      {
        text: labels.reportTitle.en,
        fontSize: 16,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20],
        color: colors.text
      },
      
      // Agreement Information Section
      {
        text: labels.agreementInfo.en,
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
        color: colors.primary
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: labels.agreementNumber.en, fontSize: 11, bold: true, color: colors.text },
              { text: agreement.agreement_number || 'Not specified', fontSize: 11, color: colors.text }
            ],
            [
              { text: labels.status.en, fontSize: 11, bold: true, color: colors.text },
              { text: agreement.status || 'Not specified', fontSize: 11, color: colors.text }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15]
      },
      
      // Customer Information Section
      {
        text: labels.customerInfo.en,
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
        color: colors.primary
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: labels.name.en, fontSize: 11, bold: true, color: colors.text },
              { text: agreement.customers?.full_name || 'Not specified', fontSize: 11, color: colors.text }
            ],
            [
              { text: labels.phone.en, fontSize: 11, bold: true, color: colors.text },
              { text: agreement.customers?.phone_number || 'Not specified', fontSize: 11, color: colors.text }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15]
      },
      
      // Vehicle Information Section
      {
        text: labels.vehicleInfo.en,
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
        color: colors.primary
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: labels.makeModel.en, fontSize: 11, bold: true, color: colors.text },
              { text: `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'Not specified', fontSize: 11, color: colors.text }
            ],
            [
              { text: labels.licensePlate.en, fontSize: 11, bold: true, color: colors.text },
              { text: agreement.vehicles?.license_plate || 'Not specified', fontSize: 11, color: colors.text }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15]
      },
      
      // Financial Summary Section
      {
        text: labels.financialSummary.en,
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
        color: colors.primary
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: labels.contractTotal.en, fontSize: 11, bold: true, color: colors.text },
              { text: formatEnglishCurrency(contractAmount), fontSize: 11, color: colors.text }
            ],
            [
              { text: labels.totalPaid.en, fontSize: 11, bold: true, color: colors.text },
              { text: formatEnglishCurrency(metrics.totalPaid), fontSize: 11, color: colors.text }
            ],
            [
              { text: labels.remainingBalance.en, fontSize: 11, bold: true, color: colors.text },
              { text: formatEnglishCurrency(metrics.remainingBalance), fontSize: 11, color: colors.text }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Footer
      {
        text: `${labels.generatedOn.en}: ${currentDate}`,
        fontSize: 9,
        alignment: 'center',
        margin: [0, 30, 0, 0],
        color: '#666666'
      },
      {
        text: labels.confidential.en,
        fontSize: 9,
        alignment: 'center',
        color: '#666666'
      }
    ]
  };

  try {
    const fileName = `agreement-report-${agreement.agreement_number || 'unknown'}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}
