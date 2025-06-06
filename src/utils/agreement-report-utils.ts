
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';

// Configure fonts to use only browser defaults without any file loading
export async function ensureFontsLoaded() {
  try {
    // Use only basic font names that don't require file loading
    pdfMake.fonts = {
      Roboto: {
        normal: 'Times-Roman',
        bold: 'Times-Bold',
        italics: 'Times-Italic',
        bolditalics: 'Times-BoldItalic'
      }
    };
    
    // Set empty VFS to avoid any file loading
    pdfMake.vfs = {};
    console.log('Fonts configured successfully with system defaults');
  } catch (error) {
    console.warn('Font configuration failed, using fallback:', error);
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
  
  // Simple document definition with minimal font requirements
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      fontSize: 11,
      font: 'Roboto'
    },
    
    content: [
      // Company Header
      {
        text: labels.companyName.en,
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      
      // Report Title
      {
        text: labels.reportTitle.en,
        style: 'title',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      
      // Agreement Information Section
      {
        text: labels.agreementInfo.en,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: labels.agreementNumber.en, style: 'label' },
              { text: agreement.agreement_number || 'Not specified', style: 'value' }
            ],
            [
              { text: labels.status.en, style: 'label' },
              { text: agreement.status || 'Not specified', style: 'value' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15]
      },
      
      // Customer Information Section
      {
        text: labels.customerInfo.en,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: labels.name.en, style: 'label' },
              { text: agreement.customers?.full_name || 'Not specified', style: 'value' }
            ],
            [
              { text: labels.phone.en, style: 'label' },
              { text: agreement.customers?.phone_number || 'Not specified', style: 'value' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15]
      },
      
      // Vehicle Information Section
      {
        text: labels.vehicleInfo.en,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: labels.makeModel.en, style: 'label' },
              { text: `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'Not specified', style: 'value' }
            ],
            [
              { text: labels.licensePlate.en, style: 'label' },
              { text: agreement.vehicles?.license_plate || 'Not specified', style: 'value' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15]
      },
      
      // Financial Summary Section
      {
        text: labels.financialSummary.en,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: labels.contractTotal.en, style: 'label' },
              { text: formatEnglishCurrency(contractAmount), style: 'value' }
            ],
            [
              { text: labels.totalPaid.en, style: 'label' },
              { text: formatEnglishCurrency(metrics.totalPaid), style: 'value' }
            ],
            [
              { text: labels.remainingBalance.en, style: 'label' },
              { text: formatEnglishCurrency(metrics.remainingBalance), style: 'value' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Footer
      {
        text: `${labels.generatedOn.en}: ${currentDate}`,
        style: 'footer',
        alignment: 'center',
        margin: [0, 30, 0, 0]
      },
      {
        text: labels.confidential.en,
        style: 'footer',
        alignment: 'center'
      }
    ],
    
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: colors.primary
      },
      title: {
        fontSize: 16,
        bold: true,
        color: colors.text
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: colors.primary
      },
      label: {
        fontSize: 11,
        bold: true,
        color: colors.text
      },
      value: {
        fontSize: 11,
        color: colors.text
      },
      footer: {
        fontSize: 9,
        color: '#666666'
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
