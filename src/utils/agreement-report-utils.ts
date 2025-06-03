import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  prepareArabicForPDF, 
  createArabicTextBlock, 
  formatArabicCurrency, 
  formatArabicDate 
} from './arabic-text-utils';
import { amiriNormalVfs } from '@/fonts/Amiri-normal.js';
import { amiriBoldVfs } from '@/fonts/Amiri-Bold.js';

// Enhanced font configuration with better Arabic support
export async function ensureFontsLoaded() {
  try {
    (pdfMake as any).fonts = {
  Amiri: {
        normal: 'Amiri-normal.ttf',
    bold: 'Amiri-Bold.ttf',
        italics: 'Amiri-normal.ttf',
        bolditalics: 'Amiri-Bold.ttf',
      },
    };
    // Merge both VFS objects
    (pdfMake as any).vfs = {
      ...amiriNormalVfs,
      ...amiriBoldVfs,
    };
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
  phone: { ar: prepareArabicForPDF('رقم الهاتف') },
  driverLicense: { ar: prepareArabicForPDF('رخصة القيادة') },
  nationality: { ar: prepareArabicForPDF('الجنسية') },
  address: { ar: prepareArabicForPDF('العنوان') },
  
  // Vehicle info
  vehicleInfo: { ar: prepareArabicForPDF('معلومات المركبة') },
  makeModel: { ar: prepareArabicForPDF('الماركة والموديل') },
  year: { ar: prepareArabicForPDF('سنة الصنع') },
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
  
  // Enhanced document definition with proper Arabic RTL support
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 80],
    
    // Header with RTL support
    header: {
      margin: [40, 20, 40, 0],
      table: {
        widths: ['*', 'auto'],
        body: [[
          createArabicTextBlock([
            { text: labels.companyName.ar, style: 'companyName' },
            '\n',
            { text: 'Commercial Registration: 146832', style: 'companyDetails' }
          ]),
          {
            text: '🏢',
            style: 'logo',
            alignment: 'left'
          }
        ]]
      },
      layout: 'noBorders'
    },
    
    // Footer with RTL support
    footer: (currentPage: number, pageCount: number) => ({
      margin: [40, 10, 40, 20],
      table: {
        widths: ['*', 'auto', '*'],
        body: [[
          createArabicTextBlock(labels.confidential.ar, 'footerText'),
          createArabicTextBlock(`${labels.pageOf.ar} ${currentPage} من ${pageCount}`, 'footerText'),
          createArabicTextBlock(`${labels.generatedOn.ar}: ${currentDate}`, 'footerText')
        ]]
      },
      layout: 'noBorders'
    }),
    
    // Main content with enhanced Arabic support
    content: [
      // Report title with proper RTL
      {
        table: {
          widths: ['*'],
          body: [[createArabicTextBlock(labels.reportTitle.ar, 'reportTitle')]]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          fillColor: () => colors.primary
        },
        margin: [0, 0, 0, 20]
      },
      
      // Agreement overview card with RTL support
      {
        table: {
          widths: ['*'],
          body: [[{
            table: {
              widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
                  createArabicTextBlock(labels.agreementNumber.ar, 'cardLabel'),
                  createArabicTextBlock(labels.status.ar, 'cardLabel'),
                  createArabicTextBlock(labels.duration.ar, 'cardLabel'),
                  createArabicTextBlock(labels.monthlyRent.ar, 'cardLabel')
                ],
                [
                  createArabicTextBlock(agreement.agreement_number || prepareArabicForPDF('غير محدد'), 'cardValue'),
                  { 
                    ...createArabicTextBlock(agreement.status || prepareArabicForPDF('غير محدد'), 'cardValue'),
                    color: getStatusColor(agreement.status)
                  },
                  createArabicTextBlock(
                    agreement.start_date && agreement.end_date 
                      ? prepareArabicForPDF(`${Math.ceil((new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} شهر`)
                      : prepareArabicForPDF('غير محدد'), 
                    'cardValue'
                  ),
                  createArabicTextBlock(formatArabicCurrency(rentAmount), 'cardValue')
                ]
              ]
            },
            fillColor: colors.lighter
          }]]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Two-column layout for customer and vehicle info with RTL
      {
        columns: [
          {
            width: '48%',
            stack: [
              createArabicTextBlock(labels.customerInfo.ar, 'sectionHeader'),
      {
        table: {
                  widths: ['40%', '60%'],
          body: [
            [
                      createArabicTextBlock(labels.name.ar, 'labelStyle'),
                      createArabicTextBlock(agreement.customers?.full_name || prepareArabicForPDF('غير محدد'), 'valueStyle')
                    ],
                    [
                      createArabicTextBlock(labels.phone.ar, 'labelStyle'),
                      createArabicTextBlock(agreement.customers?.phone_number || prepareArabicForPDF('غير محدد'), 'valueStyle')
                    ],
                    [
                      createArabicTextBlock(labels.nationality.ar, 'labelStyle'),
                      createArabicTextBlock(agreement.customers?.nationality || prepareArabicForPDF('غير محدد'), 'valueStyle')
                    ],
                    [
                      createArabicTextBlock(labels.driverLicense.ar, 'labelStyle'),
                      createArabicTextBlock(agreement.customers?.driver_license || prepareArabicForPDF('غير محدد'), 'valueStyle')
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
              createArabicTextBlock(labels.vehicleInfo.ar, 'sectionHeader'),
              {
                table: {
                  widths: ['40%', '60%'],
                  body: [
                    [
                      createArabicTextBlock(labels.makeModel.ar, 'labelStyle'),
                      createArabicTextBlock(`${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || prepareArabicForPDF('غير محدد'), 'valueStyle')
                    ],
                    [
                      createArabicTextBlock(labels.year.ar, 'labelStyle'),
                      createArabicTextBlock(agreement.vehicles?.year?.toString() || prepareArabicForPDF('غير محدد'), 'valueStyle')
                    ],
                    [
                      createArabicTextBlock(labels.licensePlate.ar, 'labelStyle'),
                      createArabicTextBlock(agreement.vehicles?.license_plate || prepareArabicForPDF('غير محدد'), 'valueStyle')
                    ],
                    [
                      createArabicTextBlock(labels.vin.ar, 'labelStyle'),
                      createArabicTextBlock(agreement.vehicles?.vin || prepareArabicForPDF('غير محدد'), 'valueStyle')
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
      
      // Financial summary with RTL support
      createArabicTextBlock(labels.financialSummary.ar, 'sectionHeader'),
      {
        table: {
          widths: ['*'],
          body: [[{
            table: {
              widths: ['20%', '20%', '20%', '20%', '20%'],
          body: [
            [
                  createArabicTextBlock(labels.contractTotal.ar, 'metricLabel'),
                  createArabicTextBlock(labels.totalPaid.ar, 'metricLabel'),
                  createArabicTextBlock(labels.remainingBalance.ar, 'metricLabel'),
                  createArabicTextBlock(labels.lateFees.ar, 'metricLabel'),
                  createArabicTextBlock(labels.paymentProgress.ar, 'metricLabel')
                ],
                [
                  createArabicTextBlock(formatArabicCurrency(contractAmount), 'metricValue'),
                  { ...createArabicTextBlock(formatArabicCurrency(metrics.totalPaid), 'metricValue'), color: colors.success },
                  { 
                    ...createArabicTextBlock(formatArabicCurrency(metrics.remainingBalance), 'metricValue'), 
                    color: metrics.remainingBalance > 0 ? colors.warning : colors.success 
                  },
                  { 
                    ...createArabicTextBlock(formatArabicCurrency(metrics.totalLateFees), 'metricValue'), 
                    color: metrics.totalLateFees > 0 ? colors.danger : colors.success 
                  },
                  { ...createArabicTextBlock(prepareArabicForPDF(`${Math.round(metrics.paymentProgress)}%`), 'metricValue'), color: colors.primary }
                ]
              ]
            },
            fillColor: colors.light
          }]]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Payment history with RTL support (if payments exist)
      ...(payments.length > 0 ? [
        createArabicTextBlock(labels.paymentHistory.ar, 'sectionHeader'),
      {
        table: {
            headerRows: 1,
            widths: ['25%', '25%', '25%', '25%'],
          body: [
              [
                createArabicTextBlock(labels.paymentDate.ar, 'tableHeader'),
                createArabicTextBlock(labels.amount.ar, 'tableHeader'),
                createArabicTextBlock(labels.paymentStatus.ar, 'tableHeader'),
                createArabicTextBlock(labels.paymentMethod.ar, 'tableHeader')
              ],
              ...payments.slice(0, 10).map(payment => [
                createArabicTextBlock(formatArabicDate(payment.payment_date), 'tableCell'),
                createArabicTextBlock(formatArabicCurrency(payment.amount), 'tableCell'),
                { 
                  ...createArabicTextBlock(payment.status || prepareArabicForPDF('غير محدد'), 'tableCell'),
                  color: getStatusColor(payment.status)
                },
                createArabicTextBlock(payment.payment_method || prepareArabicForPDF('غير محدد'), 'tableCell')
            ])
          ]
        },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        }
      ] : []),
      
      // Traffic fines with RTL support (if fines exist)
      ...(trafficFines.length > 0 ? [
        createArabicTextBlock(labels.trafficFines.ar, 'sectionHeader'),
        {
          table: {
            headerRows: 1,
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                createArabicTextBlock(labels.fineDate.ar, 'tableHeader'),
                createArabicTextBlock(labels.fineAmount.ar, 'tableHeader'),
                createArabicTextBlock(labels.fineStatus.ar, 'tableHeader'),
                createArabicTextBlock(labels.fineLocation.ar, 'tableHeader')
              ],
              ...trafficFines.map(fine => [
                createArabicTextBlock(formatArabicDate(fine.date), 'tableCell'),
                createArabicTextBlock(formatArabicCurrency(fine.amount), 'tableCell'),
                { 
                  ...createArabicTextBlock(fine.status || prepareArabicForPDF('غير محدد'), 'tableCell'),
                  color: getStatusColor(fine.status)
                },
                createArabicTextBlock(fine.location || prepareArabicForPDF('غير محدد'), 'tableCell')
              ]),
              [
                { ...createArabicTextBlock(labels.totalFines.ar, 'tableHeader'), colSpan: 3 },
                {},
                {},
                { 
                  ...createArabicTextBlock(formatArabicCurrency(trafficFines.reduce((sum, f) => sum + (f.amount || 0), 0)), 'tableHeader'),
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
    
    // Enhanced styles with proper Arabic text handling
    styles: {
      companyName: {
        fontSize: 16,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        alignment: 'right'
      },
      companyDetails: {
        fontSize: 10,
        font: 'Amiri',
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
        font: 'Amiri',
        margin: [0, 10, 0, 10],
        alignment: 'center',
        color: 'white'
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        fillColor: colors.lighter,
        margin: [5, 8, 5, 8],
        alignment: 'right'
      },
      cardLabel: {
        fontSize: 10,
        bold: true,
        font: 'Amiri',
        color: colors.textLight,
        alignment: 'center'
      },
      cardValue: {
        fontSize: 12,
        bold: true,
        font: 'Amiri',
        color: colors.text,
        alignment: 'center'
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
      metricLabel: {
        fontSize: 10,
        bold: true,
        font: 'Amiri',
        color: colors.textLight,
        alignment: 'center'
      },
      metricValue: {
        fontSize: 14,
        bold: true,
        font: 'Amiri',
        alignment: 'center'
      },
      tableHeader: {
        fontSize: 11,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        fillColor: colors.lighter,
        alignment: 'center'
      },
      tableCell: {
        fontSize: 10,
        font: 'Amiri',
        color: colors.text,
        alignment: 'center'
      },
      footerText: {
        fontSize: 8,
        font: 'Amiri',
        color: colors.textLight,
        alignment: 'center'
      },
      arabicText: {
        font: 'Amiri',
        alignment: 'right'
      }
    },
    
    defaultStyle: {
      font: 'Amiri',
      fontSize: 12,
      rtl: true,
      alignment: 'right'
    }
  };

  try {
    const fileName = prepareArabicForPDF(`تقرير-عقد-${agreement.agreement_number || 'غير-محدد'}.pdf`);
    pdfMake.createPdf(docDefinition).download(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(prepareArabicForPDF('فشل في إنشاء تقرير PDF'));
  }
}
