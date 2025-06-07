
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  prepareArabicForPDF, 
  createArabicTextBlock, 
  formatArabicCurrency, 
  formatArabicDate 
} from './arabic-text-utils';

// Simple font configuration for basic PDF generation
export async function ensureFontsLoaded() {
  try {
    // Use only basic fonts to avoid loading issues
    (pdfMake as any).fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    // Clear VFS to avoid font file loading issues
    (pdfMake as any).vfs = {};
  } catch (error) {
    console.warn('Font loading failed, using default fonts:', error);
  }
}

// Enhanced Arabic labels with proper text direction
const labels = {
  // Header
  reportTitle: { ar: prepareArabicForPDF('تقرير عقد الإيجار الشامل') },
  companyName: { ar: prepareArabicForPDF('شركة العرف لتأجير السيارات ذ.م.م') },
  
  // Document info
  agreementInfo: { ar: prepareArabicForPDF('معلومات العقد') },
  agreementNumber: { ar: prepareArabicForPDF('رقم العقد') },
  status: { ar: prepareArabicForPDF('حالة العقد') },
  startDate: { ar: prepareArabicForPDF('تاريخ البدء') },
  endDate: { ar: prepareArabicForPDF('تاريخ الانتهاء') },
  duration: { ar: prepareArabicForPDF('مدة العقد') },
  monthlyRent: { ar: prepareArabicForPDF('الإيجار الشهري') },
  contractTotal: { ar: prepareArabicForPDF('إجمالي العقد') },
  depositAmount: { ar: prepareArabicForPDF('مبلغ التأمين') },
  rentDueDay: { ar: prepareArabicForPDF('يوم استحقاق الإيجار') },
  
  // Customer info
  customerInfo: { ar: prepareArabicForPDF('معلومات العميل') },
  name: { ar: prepareArabicForPDF('الاسم الكامل') },
  email: { ar: prepareArabicForPDF('البريد الإلكتروني') },
  phone: { ar: prepareArabicForPDF('الهاتف رقم') },
  driverLicense: { ar: prepareArabicForPDF('رخصة القيادة') },
  nationality: { ar: prepareArabicForPDF('الجنسية') },
  address: { ar: prepareArabicForPDF('العنوان') },
  
  // Vehicle info
  vehicleInfo: { ar: prepareArabicForPDF('معلومات المركبة') },
  makeModel: { ar: prepareArabicForPDF('ماركة المركبة') },
  year: { ar: prepareArabicForPDF('الصنعة') },
  licensePlate: { ar: prepareArabicForPDF('رقم اللوحة') },
  color: { ar: prepareArabicForPDF('اللون') },
  vin: { ar: prepareArabicForPDF('رقم الهيكل') },
  
  // Financial summary
  financialSummary: { ar: prepareArabicForPDF('الملخص المالي') },
  totalPaid: { ar: prepareArabicForPDF('إجمالي المدفوع') },
  totalDue: { ar: prepareArabicForPDF('إجمالي المستحق') },
  lateFees: { ar: prepareArabicForPDF('رسوم التأخير') },
  remainingBalance: { ar: prepareArabicForPDF('الرصيد المتبقي') },
  pendingPayments: { ar: prepareArabicForPDF('الدفعات المعلقة') },
  nextPaymentDue: { ar: prepareArabicForPDF('تاريخ الدفعة القادمة') },
  paymentProgress: { ar: prepareArabicForPDF('تقدم الدفعات') },
  
  // Payment details
  paymentHistory: { ar: prepareArabicForPDF('سجل الدفعات') },
  paymentDate: { ar: prepareArabicForPDF('تاريخ الدفع') },
  amount: { ar: prepareArabicForPDF('المبلغ') },
  paymentStatus: { ar: prepareArabicForPDF('حالة الدفع') },
  paymentMethod: { ar: prepareArabicForPDF('طريقة الدفع') },
  
  // Traffic fines
  trafficFines: { ar: prepareArabicForPDF('المخالفات المرورية') },
  fineAmount: { ar: prepareArabicForPDF('مبلغ المخالفة') },
  fineDate: { ar: prepareArabicForPDF('تاريخ المخالفة') },
  fineStatus: { ar: prepareArabicForPDF('حالة المخالفة') },
  fineLocation: { ar: prepareArabicForPDF('موقع المخالفة') },
  totalFines: { ar: prepareArabicForPDF('إجمالي المخالفات') },
  
  // Legal info
  legalInfo: { ar: prepareArabicForPDF('المعلومات القانونية') },
  signature: { ar: prepareArabicForPDF('التوقيع') },
  date: { ar: prepareArabicForPDF('التاريخ') },
  terms: { ar: prepareArabicForPDF('الأحكام والشروط') },
  
  // Footer
  confidential: { ar: prepareArabicForPDF('سري - شركة العرف لتأجير السيارات') },
  generatedOn: { ar: prepareArabicForPDF('تم إنشاؤه في') },
  pageOf: { ar: prepareArabicForPDF('صفحة') }
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
  
  // Document definition with updated layout matching the image
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
            text: labels.companyName.ar,
            style: 'companyName',
            alignment: 'right'
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
          {
            text: labels.confidential.ar,
            style: 'footerText',
            alignment: 'right'
          },
          {
            text: `${labels.pageOf.ar} ${currentPage} من ${pageCount}`,
            style: 'footerText',
            alignment: 'center'
          },
          {
            text: `${labels.generatedOn.ar}: ${currentDate}`,
            style: 'footerText',
            alignment: 'left'
          }
        ]]
      },
      layout: 'noBorders'
    }),
    
    // Main content with updated layout matching the image
    content: [
      // Report title
      {
        text: labels.reportTitle.ar,
        style: 'reportTitle',
        alignment: 'center',
        margin: [0, 0, 0, 30]
      },
      
      // Agreement overview section
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: labels.agreementNumber.ar, style: 'cardLabel' },
              { text: labels.status.ar, style: 'cardLabel' },
              { text: labels.duration.ar, style: 'cardLabel' },
              { text: labels.monthlyRent.ar, style: 'cardLabel' }
            ],
            [
              { text: agreement.agreement_number || 'غير محدد', style: 'cardValue' },
              { 
                text: agreement.status || 'غير محدد', 
                style: 'cardValue',
                color: getStatusColor(agreement.status)
              },
              { 
                text: agreement.start_date && agreement.end_date 
                  ? `${Math.ceil((new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} شهر`
                  : 'غير محدد', 
                style: 'cardValue'
              },
              { text: formatArabicCurrency(rentAmount), style: 'cardValue' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 30]
      },
      
      // Customer and Vehicle Information - Matching the image layout
      {
        table: {
          widths: ['48%', '4%', '48%'],
          body: [[
            // Vehicle Information (Right side - matching image)
            {
              stack: [
                { text: labels.vehicleInfo.ar, style: 'sectionHeader', alignment: 'center' },
                {
                  table: {
                    widths: ['40%', '60%'],
                    body: [
                      [
                        { text: labels.makeModel.ar, style: 'labelStyle', alignment: 'right' },
                        { text: `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'غير محدد', style: 'valueStyle', alignment: 'right' }
                      ],
                      [
                        { text: labels.year.ar, style: 'labelStyle', alignment: 'right' },
                        { text: agreement.vehicles?.year?.toString() || 'غير محدد', style: 'valueStyle', alignment: 'right' }
                      ],
                      [
                        { text: labels.licensePlate.ar, style: 'labelStyle', alignment: 'right' },
                        { text: agreement.vehicles?.license_plate || 'غير محدد', style: 'valueStyle', alignment: 'right' }
                      ],
                      [
                        { text: labels.vin.ar, style: 'labelStyle', alignment: 'right' },
                        { text: agreement.vehicles?.vin || 'غير محدد', style: 'valueStyle', alignment: 'right' }
                      ]
                    ]
                  },
                  layout: {
                    hLineWidth: function (i, node) {
                      return (i === 0 || i === node.table.body.length) ? 2 : 1;
                    },
                    vLineWidth: function (i, node) {
                      return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                    },
                    hLineColor: function (i, node) {
                      return colors.border;
                    },
                    vLineColor: function (i, node) {
                      return colors.border;
                    }
                  }
                }
              ]
            },
            
            // Spacer
            { text: '', border: [false, false, false, false] },
            
            // Customer Information (Left side - matching image)
            {
              stack: [
                { text: labels.customerInfo.ar, style: 'sectionHeader', alignment: 'center' },
                {
                  table: {
                    widths: ['40%', '60%'],
                    body: [
                      [
                        { text: labels.name.ar, style: 'labelStyle', alignment: 'right' },
                        { text: agreement.customers?.full_name || 'غير محدد', style: 'valueStyle', alignment: 'right' }
                      ],
                      [
                        { text: labels.phone.ar, style: 'labelStyle', alignment: 'right' },
                        { text: agreement.customers?.phone_number || 'غير محدد', style: 'valueStyle', alignment: 'right' }
                      ],
                      [
                        { text: labels.nationality.ar, style: 'labelStyle', alignment: 'right' },
                        { text: agreement.customers?.nationality || 'غير محدد', style: 'valueStyle', alignment: 'right' }
                      ],
                      [
                        { text: labels.driverLicense.ar, style: 'labelStyle', alignment: 'right' },
                        { text: agreement.customers?.driver_license || 'غير محدد', style: 'valueStyle', alignment: 'right' }
                      ]
                    ]
                  },
                  layout: {
                    hLineWidth: function (i, node) {
                      return (i === 0 || i === node.table.body.length) ? 2 : 1;
                    },
                    vLineWidth: function (i, node) {
                      return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                    },
                    hLineColor: function (i, node) {
                      return colors.border;
                    },
                    vLineColor: function (i, node) {
                      return colors.border;
                    }
                  }
                }
              ]
            }
          ]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 30]
      },
      
      // Financial summary
      { text: labels.financialSummary.ar, style: 'sectionHeader', margin: [0, 20, 0, 10] },
      {
        table: {
          widths: ['20%', '20%', '20%', '20%', '20%'],
          body: [
            [
              { text: labels.contractTotal.ar, style: 'metricLabel' },
              { text: labels.totalPaid.ar, style: 'metricLabel' },
              { text: labels.remainingBalance.ar, style: 'metricLabel' },
              { text: labels.lateFees.ar, style: 'metricLabel' },
              { text: labels.paymentProgress.ar, style: 'metricLabel' }
            ],
            [
              { text: formatArabicCurrency(contractAmount), style: 'metricValue' },
              { text: formatArabicCurrency(metrics.totalPaid), style: 'metricValue', color: colors.success },
              { 
                text: formatArabicCurrency(metrics.remainingBalance), 
                style: 'metricValue', 
                color: metrics.remainingBalance > 0 ? colors.warning : colors.success 
              },
              { 
                text: formatArabicCurrency(metrics.totalLateFees), 
                style: 'metricValue', 
                color: metrics.totalLateFees > 0 ? colors.danger : colors.success 
              },
              { text: `${Math.round(metrics.paymentProgress)}%`, style: 'metricValue', color: colors.primary }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Payment history (if payments exist)
      ...(payments.length > 0 ? [
        { text: labels.paymentHistory.ar, style: 'sectionHeader', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: labels.paymentDate.ar, style: 'tableHeader' },
                { text: labels.amount.ar, style: 'tableHeader' },
                { text: labels.paymentStatus.ar, style: 'tableHeader' },
                { text: labels.paymentMethod.ar, style: 'tableHeader' }
              ],
              ...payments.slice(0, 10).map(payment => [
                { text: formatArabicDate(payment.payment_date), style: 'tableCell' },
                { text: formatArabicCurrency(payment.amount), style: 'tableCell' },
                { 
                  text: payment.status || 'غير محدد', 
                  style: 'tableCell',
                  color: getStatusColor(payment.status)
                },
                { text: payment.payment_method || 'غير محدد', style: 'tableCell' }
              ])
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        }
      ] : []),
      
      // Traffic fines (if fines exist)
      ...(trafficFines.length > 0 ? [
        { text: labels.trafficFines.ar, style: 'sectionHeader', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: labels.fineDate.ar, style: 'tableHeader' },
                { text: labels.fineAmount.ar, style: 'tableHeader' },
                { text: labels.fineStatus.ar, style: 'tableHeader' },
                { text: labels.fineLocation.ar, style: 'tableHeader' }
              ],
              ...trafficFines.map(fine => [
                { text: formatArabicDate(fine.date), style: 'tableCell' },
                { text: formatArabicCurrency(fine.amount), style: 'tableCell' },
                { 
                  text: fine.status || 'غير محدد', 
                  style: 'tableCell',
                  color: getStatusColor(fine.status)
                },
                { text: fine.location || 'غير محدد', style: 'tableCell' }
              ]),
              [
                { text: labels.totalFines.ar, style: 'tableHeader', colSpan: 3 },
                {},
                {},
                { 
                  text: formatArabicCurrency(trafficFines.reduce((sum, f) => sum + (f.amount || 0), 0)), 
                  style: 'tableHeader',
                  color: colors.danger
                }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        }
      ] : [])
    ],
    
    // Styles
    styles: {
      companyName: {
        fontSize: 16,
        bold: true,
        color: colors.primary
      },
      logo: {
        fontSize: 24,
        color: colors.primary
      },
      reportTitle: {
        fontSize: 20,
        bold: true,
        color: colors.primary
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        color: colors.primary,
        fillColor: colors.lighter,
        margin: [5, 8, 5, 8]
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
        color: colors.textLight
      },
      valueStyle: {
        fontSize: 11,
        color: colors.text
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
      tableHeader: {
        fontSize: 11,
        bold: true,
        color: colors.primary,
        fillColor: colors.lighter,
        alignment: 'center'
      },
      tableCell: {
        fontSize: 10,
        color: colors.text,
        alignment: 'center'
      },
      footerText: {
        fontSize: 8,
        color: colors.textLight
      }
    },
    
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 12
    }
  };

  try {
    const fileName = `تقرير-عقد-${agreement.agreement_number || 'غير-محدد'}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('فشل في إنشاء تقرير PDF');
  }
}
