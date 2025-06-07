
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  prepareArabicForPDF, 
  createArabicTextBlock, 
  formatArabicCurrency, 
  formatArabicDate 
} from './arabic-text-utils';

// Simplified font configuration
export async function ensureFontsLoaded() {
  try {
    // Use basic Roboto fonts as fallback for now
    (pdfMake as any).fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    
    console.log('Using Roboto fonts for PDF generation');
  } catch (error) {
    console.warn('Font configuration failed, using defaults:', error);
  }
}

// Simplified Arabic labels
const labels = {
  // Header
  reportTitle: { ar: 'تقرير عقد الإيجار الشامل' },
  companyName: { ar: 'شركة العرف لتأجير السيارات ذ.م.م' },
  
  // Document info
  agreementInfo: { ar: 'معلومات العقد' },
  agreementNumber: { ar: 'رقم العقد' },
  status: { ar: 'حالة العقد' },
  startDate: { ar: 'تاريخ البدء' },
  endDate: { ar: 'تاريخ الانتهاء' },
  duration: { ar: 'مدة العقد' },
  monthlyRent: { ar: 'الإيجار الشهري' },
  contractTotal: { ar: 'إجمالي العقد' },
  depositAmount: { ar: 'مبلغ التأمين' },
  rentDueDay: { ar: 'يوم استحقاق الإيجار' },
  
  // Customer info
  customerInfo: { ar: 'معلومات العميل' },
  name: { ar: 'الاسم الكامل' },
  email: { ar: 'البريد الإلكتروني' },
  phone: { ar: 'رقم الهاتف' },
  driverLicense: { ar: 'رخصة القيادة' },
  nationality: { ar: 'الجنسية' },
  address: { ar: 'العنوان' },
  
  // Vehicle info
  vehicleInfo: { ar: 'معلومات المركبة' },
  makeModel: { ar: 'الماركة والموديل' },
  year: { ar: 'سنة الصنع' },
  licensePlate: { ar: 'رقم اللوحة' },
  color: { ar: 'اللون' },
  vin: { ar: 'رقم الهيكل' },
  
  // Financial summary
  financialSummary: { ar: 'الملخص المالي' },
  totalPaid: { ar: 'إجمالي المدفوع' },
  totalDue: { ar: 'إجمالي المستحق' },
  lateFees: { ar: 'رسوم التأخير' },
  remainingBalance: { ar: 'الرصيد المتبقي' },
  pendingPayments: { ar: 'الدفعات المعلقة' },
  nextPaymentDue: { ar: 'تاريخ الدفعة القادمة' },
  paymentProgress: { ar: 'تقدم الدفعات' },
  
  // Payment details
  paymentHistory: { ar: 'سجل الدفعات' },
  paymentDate: { ar: 'تاريخ الدفع' },
  amount: { ar: 'المبلغ' },
  paymentStatus: { ar: 'حالة الدفع' },
  paymentMethod: { ar: 'طريقة الدفع' },
  
  // Footer
  confidential: { ar: 'سري - شركة العرف لتأجير السيارات' },
  generatedOn: { ar: 'تم إنشاؤه في' },
  pageOf: { ar: 'صفحة' }
};

// Color scheme
const colors = {
  primary: '#1e40af',
  secondary: '#64748b',
  accent: '#0ea5e9',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  light: '#f8fafc',
  lighter: '#f1f5f9',
  border: '#e2e8f0',
  text: '#334155',
  textLight: '#64748b'
};

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active': case 'نشط': return colors.success;
    case 'pending': case 'معلق': return colors.warning;
    case 'completed': case 'مكتمل': return colors.primary;
    case 'cancelled': case 'ملغي': return colors.danger;
    default: return colors.secondary;
  }
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

export async function generateAgreementReportPdfmake(
  agreement: any,
  rentAmount: any,
  contractAmount: any,
  payments: any[] = [],
  trafficFines: any[] = []
) {
  await ensureFontsLoaded();
  
  const metrics = calculateFinancialMetrics(payments, contractAmount);
  const currentDate = formatArabicDate(new Date());
  
  // Simplified document definition
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 80],
    
    // Header
    header: {
      margin: [40, 20, 40, 0],
      table: {
        widths: ['*', 'auto'],
        body: [[
          {
            stack: [
              { text: labels.companyName.ar, style: 'companyName' },
              { text: 'Commercial Registration: 146832', style: 'companyDetails' }
            ]
          },
          {
            text: '🏢',
            style: 'logo',
            alignment: 'left'
          }
        ]]
      },
      layout: 'noBorders'
    },
    
    // Footer
    footer: (currentPage: number, pageCount: number) => ({
      margin: [40, 10, 40, 20],
      table: {
        widths: ['*', 'auto', '*'],
        body: [[
          { text: labels.confidential.ar, style: 'footerText', alignment: 'right' },
          { text: `${labels.pageOf.ar} ${currentPage} من ${pageCount}`, style: 'footerText', alignment: 'center' },
          { text: `${labels.generatedOn.ar}: ${currentDate}`, style: 'footerText', alignment: 'left' }
        ]]
      },
      layout: 'noBorders'
    }),
    
    // Main content
    content: [
      // Report title
      {
        table: {
          widths: ['*'],
          body: [[
            { text: labels.reportTitle.ar, style: 'reportTitle', alignment: 'center' }
          ]]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          fillColor: () => colors.primary
        },
        margin: [0, 0, 0, 20]
      },
      
      // Agreement overview
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: labels.agreementNumber.ar, style: 'cardLabel', alignment: 'center' },
              { text: labels.status.ar, style: 'cardLabel', alignment: 'center' },
              { text: labels.duration.ar, style: 'cardLabel', alignment: 'center' },
              { text: labels.monthlyRent.ar, style: 'cardLabel', alignment: 'center' }
            ],
            [
              { text: agreement.agreement_number || 'غير محدد', style: 'cardValue', alignment: 'center' },
              { 
                text: agreement.status || 'غير محدد', 
                style: 'cardValue', 
                alignment: 'center',
                color: getStatusColor(agreement.status)
              },
              { 
                text: agreement.start_date && agreement.end_date 
                  ? `${Math.ceil((new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} شهر`
                  : 'غير محدد', 
                style: 'cardValue', 
                alignment: 'center'
              },
              { text: formatArabicCurrency(rentAmount), style: 'cardValue', alignment: 'center' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Customer and vehicle info
      {
        columns: [
          {
            width: '48%',
            stack: [
              {
                text: labels.customerInfo.ar,
                style: 'sectionHeader',
                margin: [0, 0, 0, 8],
                alignment: 'right'
              },
              {
                table: {
                  widths: ['60%', '40%'],
                  body: [
                    [
                      { text: agreement.customers?.full_name || 'غير محدد', style: 'valueStyle', alignment: 'left' },
                      { text: labels.name.ar, style: 'labelStyle', alignment: 'right' }
                    ],
                    [
                      { text: agreement.customers?.phone_number || 'غير محدد', style: 'valueStyle', alignment: 'left' },
                      { text: labels.phone.ar, style: 'labelStyle', alignment: 'right' }
                    ],
                    [
                      { text: agreement.customers?.nationality || 'غير محدد', style: 'valueStyle', alignment: 'left' },
                      { text: labels.nationality.ar, style: 'labelStyle', alignment: 'right' }
                    ],
                    [
                      { text: agreement.customers?.driver_license || 'غير محدد', style: 'valueStyle', alignment: 'left' },
                      { text: labels.driverLicense.ar, style: 'labelStyle', alignment: 'right' }
                    ]
                  ]
                },
                layout: 'lightHorizontalLines'
              }
            ]
          },
          { width: '4%', text: '' }, // Spacer
          {
            width: '48%',
            stack: [
              {
                text: labels.vehicleInfo.ar,
                style: 'sectionHeader',
                margin: [0, 0, 0, 8],
                alignment: 'right'
              },
              {
                table: {
                  widths: ['60%', '40%'],
                  body: [
                    [
                      { text: `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'غير محدد', style: 'valueStyle', alignment: 'left' },
                      { text: labels.makeModel.ar, style: 'labelStyle', alignment: 'right' }
                    ],
                    [
                      { text: agreement.vehicles?.year?.toString() || 'غير محدد', style: 'valueStyle', alignment: 'left' },
                      { text: labels.year.ar, style: 'labelStyle', alignment: 'right' }
                    ],
                    [
                      { text: agreement.vehicles?.license_plate || 'غير محدد', style: 'valueStyle', alignment: 'left' },
                      { text: labels.licensePlate.ar, style: 'labelStyle', alignment: 'right' }
                    ],
                    [
                      { text: agreement.vehicles?.vin || 'غير محدد', style: 'valueStyle', alignment: 'left' },
                      { text: labels.vin.ar, style: 'labelStyle', alignment: 'right' }
                    ]
                  ]
                },
                layout: 'lightHorizontalLines'
              }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },
      
      // Financial summary
      {
        text: labels.financialSummary.ar,
        style: 'sectionHeader',
        margin: [0, 0, 0, 8],
        alignment: 'right'
      },
      {
        table: {
          widths: ['20%', '20%', '20%', '20%', '20%'],
          body: [
            [
              { text: labels.contractTotal.ar, style: 'metricLabel', alignment: 'center' },
              { text: labels.totalPaid.ar, style: 'metricLabel', alignment: 'center' },
              { text: labels.remainingBalance.ar, style: 'metricLabel', alignment: 'center' },
              { text: labels.lateFees.ar, style: 'metricLabel', alignment: 'center' },
              { text: labels.paymentProgress.ar, style: 'metricLabel', alignment: 'center' }
            ],
            [
              { text: formatArabicCurrency(contractAmount), style: 'metricValue', alignment: 'center' },
              { text: formatArabicCurrency(metrics.totalPaid), style: 'metricValue', alignment: 'center', color: colors.success },
              { 
                text: formatArabicCurrency(metrics.remainingBalance), 
                style: 'metricValue', 
                alignment: 'center',
                color: metrics.remainingBalance > 0 ? colors.warning : colors.success 
              },
              { 
                text: formatArabicCurrency(metrics.totalLateFees), 
                style: 'metricValue', 
                alignment: 'center',
                color: metrics.totalLateFees > 0 ? colors.danger : colors.success 
              },
              { text: `${Math.round(metrics.paymentProgress)}%`, style: 'metricValue', alignment: 'center', color: colors.primary }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      }
    ],
    
    // Styles
    styles: {
      companyName: {
        fontSize: 16,
        bold: true,
        color: colors.primary,
        alignment: 'right'
      },
      companyDetails: {
        fontSize: 10,
        color: colors.textLight,
        alignment: 'right'
      },
      logo: {
        fontSize: 24,
        color: colors.primary
      },
      reportTitle: {
        fontSize: 20,
        bold: true,
        margin: [0, 10, 0, 10],
        alignment: 'center',
        color: 'white'
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        color: colors.primary,
        fillColor: colors.lighter,
        margin: [5, 8, 5, 8],
        alignment: 'right'
      },
      cardLabel: {
        fontSize: 10,
        bold: true,
        color: colors.textLight,
        alignment: 'center'
      },
      cardValue: {
        fontSize: 12,
        bold: true,
        color: colors.text,
        alignment: 'center'
      },
      labelStyle: {
        fontSize: 11,
        bold: true,
        color: colors.textLight,
        alignment: 'right'
      },
      valueStyle: {
        fontSize: 11,
        color: colors.text,
        alignment: 'left'
      },
      metricLabel: {
        fontSize: 10,
        bold: true,
        color: colors.textLight,
        alignment: 'center'
      },
      metricValue: {
        fontSize: 14,
        bold: true,
        alignment: 'center'
      },
      footerText: {
        fontSize: 8,
        color: colors.textLight,
        alignment: 'center'
      }
    },
    
    defaultStyle: {
      fontSize: 12,
      alignment: 'right'
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
