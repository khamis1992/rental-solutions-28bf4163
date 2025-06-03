
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';

// Enhanced font configuration
export async function ensureFontsLoaded() {
  try {
    (pdfMake as any).fonts = {
      Amiri: {
        normal: 'Amiri-Regular.ttf',
        bold: 'Amiri-Bold.ttf',
        italics: 'Amiri-Regular.ttf',
        bolditalics: 'Amiri-Bold.ttf',
      },
    };
    
    // Set VFS if not already set
    if (!(pdfMake as any).vfs) {
      (pdfMake as any).vfs = {};
    }
  } catch (error) {
    console.warn('Font loading failed, using default fonts:', error);
  }
}

// Enhanced Arabic labels with better organization
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
  
  // Traffic fines
  trafficFines: { ar: 'المخالفات المرورية' },
  fineAmount: { ar: 'مبلغ المخالفة' },
  fineDate: { ar: 'تاريخ المخالفة' },
  fineStatus: { ar: 'حالة المخالفة' },
  fineLocation: { ar: 'موقع المخالفة' },
  totalFines: { ar: 'إجمالي المخالفات' },
  
  // Legal info
  legalInfo: { ar: 'المعلومات القانونية' },
  signature: { ar: 'التوقيع' },
  date: { ar: 'التاريخ' },
  terms: { ar: 'الأحكام والشروط' },
  
  // Footer
  confidential: { ar: 'سري - شركة العرف لتأجير السيارات' },
  generatedOn: { ar: 'تم إنشاؤه في' },
  pageOf: { ar: 'صفحة' }
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

// Helper functions
const formatArabicCurrency = (amount: number | null | undefined): string => {
  if (!amount) return '0 ر.ق';
  return `${amount.toLocaleString('ar-QA')} ر.ق`;
};

const formatArabicDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'غير محدد';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ar-QA');
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
  const currentDate = new Date().toLocaleDateString('ar-QA');
  
  // Enhanced document definition
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
            text: [
              { text: labels.companyName.ar, style: 'companyName' },
              '\n',
              { text: 'Commercial Registration: 146832', style: 'companyDetails' }
            ],
            alignment: 'right'
          },
          {
            // Company logo placeholder
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
      // Report title with decorative elements
      {
        table: {
          widths: ['*'],
          body: [[{
            text: labels.reportTitle.ar,
            style: 'reportTitle',
            alignment: 'center',
            fillColor: colors.primary,
            color: 'white'
          }]]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0
        },
        margin: [0, 0, 0, 20]
      },
      
      // Agreement overview card
      {
        table: {
          widths: ['*'],
          body: [[{
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
            fillColor: colors.lighter
          }]]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Two-column layout for customer and vehicle info
      {
        columns: [
          {
            width: '48%',
            stack: [
              { text: labels.customerInfo.ar, style: 'sectionHeader' },
              {
                table: {
                  widths: ['40%', '60%'],
                  body: [
                    [
                      { text: labels.name.ar, style: 'labelStyle' },
                      { text: agreement.customers?.full_name || 'غير محدد', style: 'valueStyle' }
                    ],
                    [
                      { text: labels.phone.ar, style: 'labelStyle' },
                      { text: agreement.customers?.phone_number || 'غير محدد', style: 'valueStyle' }
                    ],
                    [
                      { text: labels.nationality.ar, style: 'labelStyle' },
                      { text: agreement.customers?.nationality || 'غير محدد', style: 'valueStyle' }
                    ],
                    [
                      { text: labels.driverLicense.ar, style: 'labelStyle' },
                      { text: agreement.customers?.driver_license || 'غير محدد', style: 'valueStyle' }
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
              { text: labels.vehicleInfo.ar, style: 'sectionHeader' },
              {
                table: {
                  widths: ['40%', '60%'],
                  body: [
                    [
                      { text: labels.makeModel.ar, style: 'labelStyle' },
                      { text: `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'غير محدد', style: 'valueStyle' }
                    ],
                    [
                      { text: labels.year.ar, style: 'labelStyle' },
                      { text: agreement.vehicles?.year?.toString() || 'غير محدد', style: 'valueStyle' }
                    ],
                    [
                      { text: labels.licensePlate.ar, style: 'labelStyle' },
                      { text: agreement.vehicles?.license_plate || 'غير محدد', style: 'valueStyle' }
                    ],
                    [
                      { text: labels.vin.ar, style: 'labelStyle' },
                      { text: agreement.vehicles?.vin || 'غير محدد', style: 'valueStyle' }
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
      
      // Financial summary with visual indicators
      { text: labels.financialSummary.ar, style: 'sectionHeader', margin: [0, 10, 0, 10] },
      {
        table: {
          widths: ['*'],
          body: [[{
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
                  { text: formatArabicCurrency(metrics.remainingBalance), style: 'metricValue', color: metrics.remainingBalance > 0 ? colors.warning : colors.success },
                  { text: formatArabicCurrency(metrics.totalLateFees), style: 'metricValue', color: metrics.totalLateFees > 0 ? colors.danger : colors.success },
                  { text: `${Math.round(metrics.paymentProgress)}%`, style: 'metricValue', color: colors.primary }
                ]
              ]
            },
            fillColor: colors.light
          }]]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Payment history (if payments exist)
      ...(payments.length > 0 ? [
        { text: labels.paymentHistory.ar, style: 'sectionHeader', margin: [0, 10, 0, 10] },
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
      
      // Traffic fines summary (if fines exist)
      ...(trafficFines.length > 0 ? [
        { text: labels.trafficFines.ar, style: 'sectionHeader', margin: [0, 10, 0, 10] },
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
    
    // Enhanced styles
    styles: {
      companyName: {
        fontSize: 16,
        bold: true,
        font: 'Amiri',
        color: colors.primary
      },
      companyDetails: {
        fontSize: 10,
        font: 'Amiri',
        color: colors.textLight
      },
      logo: {
        fontSize: 24,
        color: colors.primary
      },
      reportTitle: {
        fontSize: 20,
        bold: true,
        font: 'Amiri',
        margin: [0, 10, 0, 10]
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        fillColor: colors.lighter,
        margin: [5, 8, 5, 8]
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
        color: colors.textLight
      },
      valueStyle: {
        fontSize: 11,
        font: 'Amiri',
        color: colors.text
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
        color: colors.textLight
      }
    },
    
    defaultStyle: {
      font: 'Amiri',
      fontSize: 12,
      rtl: true
    }
  };

  try {
    pdfMake.createPdf(docDefinition).download(`تقرير-عقد-${agreement.agreement_number || 'غير-محدد'}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('فشل في إنشاء تقرير PDF');
  }
}
