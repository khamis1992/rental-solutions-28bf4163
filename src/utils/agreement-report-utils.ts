import { Agreement } from '@/lib/validation-schemas/agreement'; 
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import { configurePdfMakeFonts, initializeFonts } from './font-loader';
import { 
  prepareArabicForPDF, 
  createArabicTextBlock, 
  formatArabicCurrency, 
  formatArabicDate 
} from './arabic-text-utils';

// Enhanced font configuration with better Arabic support
export async function ensureFontsLoaded() {
  try {
    const fontsInitialized = await initializeFonts();
    if (!fontsInitialized) {
      console.warn('Font initialization failed, using fallback configuration');
      configurePdfMakeFonts();
    }
  } catch (error) {
    console.warn('Font loading failed, using default fonts:', error);
    // Always configure fonts as fallback
    configurePdfMakeFonts();
  }
}

// Enhanced Arabic labels with proper text direction
const labels = {
  // Header
  reportTitle: { ar: 'الشامل الإيجار  تقرير' },
  companyName: { ar: ' ذ.م.م السيارات لتأجير العراف  شركة' },
  
  // Document info
  agreementInfo: { ar: 'العقد معلومات' },
  agreementNumber: { ar: 'العقد  رقم' },
  status: { ar: 'العقد حالة' },
  startDate: { ar: 'البدء تاريخ ' },
  endDate: { ar: 'الانتهاء تاريخ ' },
  duration: { ar: ' المدة' },
  monthlyRent: { ar: 'الشهري  الايجار' },
  contractTotal: { ar: ' العقد إجمالي' },
  depositAmount: { ar: 'الضمان مبلغ  ' },
  rentDueDay: { ar: 'الايجار استحقاق يوم ' },
  
  // Customer info
  customerInfo: { ar: ' العميل  معلومات' },
  name: { ar: 'الكامل  الاسم' },
  email: { ar: 'الالكتروني البريد' },
  phone: { ar: 'الهاتف رقم ' },
  driverLicense: { ar: 'الشخصي الرقم ' },
  nationality: { ar: 'الجنسية' },
  address: { ar: 'العنوان' },
  
  // Vehicle info
  vehicleInfo: { ar: ' المركبة معلومات' },
  makeModel: { ar: ' المركبة  نوع' },
  year: { ar: 'الصنع سنة ' },
  licensePlate: { ar: 'اللوحة رقم ' },
  color: { ar: 'اللون' },
  vin: { ar: 'الهيكل رقم ' },
  
  // Financial summary
  financialSummary: { ar: ' المالي الملخص' },
  totalPaid: { ar: ' المدفوع  المبلغ ' },
  totalDue: { ar: ' المستحق المبلغ' },
  lateFees: { ar: ' التاخير  رسوم' },
  remainingBalance: { ar: ' العقد من المتبقي  المبلغ' },
  pendingPayments: { ar: ' مسدد الغير المبلغ' },
  nextPaymentDue: { ar: 'القادمة الدفعة تاريخ  ' },
  paymentProgress: { ar: 'العقد تقدم ' },
  
  // Payment details
  paymentHistory: { ar: 'الدفعات  سجل' },
  paymentDate: { ar: 'الدفع  تاريخ' },
  amount: { ar: 'الايجار  مبلغ' },
  paymentStatus: { ar: 'الدفع  حالة' },
  paymentMethod: { ar: 'الدفع  طريقة' },
  
  // Traffic fines
  trafficFines: { ar: 'المرورية المخالفات' },
  fineAmount: { ar: 'المخالفة مبلغ' },
  fineDate: { ar: 'المخالفة تاريخ' },
  fineStatus: { ar: 'المخالفة حالة' },
  fineLocation: { ar: 'المخالفة موقع' },
  fineViolation: { ar: 'المخالفة نوع' },
  totalFines: { ar: 'المخالفات اجمالي ' },
  
  // Legal info
  legalInfo: { ar: 'القانونية المعلومات' },
  signature: { ar: 'التوقيع' },
  date: { ar: 'التاريخ' },
  terms: { ar: 'و الشروط الاحكام' },
  
  // Footer
  confidential: { ar: '  السيارات لتأجير العراف شركة ' },
  generatedOn: { ar: 'في انشاءه تم ' },
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

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active': case 'نشط': return colors.success;
    case 'pending': case 'معلق': return colors.warning;
    case 'completed': case 'مكتمل': return colors.primary;
    case 'cancelled': case 'ملغي': return colors.danger;
    case 'paid': case 'مسدد': return colors.success;
    case 'unpaid': case 'غير مسدد': return colors.danger;
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

// Helper to force English numerals
function toEnglishNumber(num: any): string {
  if (typeof num === 'number') return num.toLocaleString('en-US');
  if (typeof num === 'string') return num.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return String(num);
}

// Helper to format date as dd/mm/yyyy in English
function formatDateEnglish(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

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
        widths: ['auto', '*', 'auto'],
        body: [[
          // Left: date
          {
            text: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
            style: 'companyDetails',
            alignment: 'left',
            margin: [0, 0, 0, 0]
          },
          // Center: 'تقرير الإيجار الشامل'
          {
            text: 'تقرير الإيجار الشامل',
            style: 'reportTitle',
            alignment: 'center',
            margin: [0, 0, 0, 0]
          },
          // Right: logo
          {
            text: '🏢',
            style: 'logo',
            alignment: 'right'
          }
        ]]
      },
      layout: 'noBorders'
    },
    
    // Footer with RTL support
    footer: (currentPage: number, pageCount: number) => {
      return {
        margin: [40, 10, 40, 20],
        table: {
          widths: ['33%', '34%', '33%'],
          body: [[
            // Left: 'شركة العراف لتأجير السيارات'
            { text: 'ذ.م.م السيارات لتأجير العراف شركة   ', style: 'footerText', alignment: 'left' },
            // Center: page number only
            { text: String(currentPage), style: 'footerText', alignment: 'center' },
            // Right: 'سري'
            { text: 'سري', style: 'footerText', alignment: 'right' }
          ]]
        },
        layout: 'noBorders'
      };
    },
    
    // Main content with enhanced Arabic support
    content: [
      // Report title with blue background
      {
        table: {
          widths: ['*'],
          body: [[
            { text: labels.reportTitle.ar, style: 'reportTitle', alignment: 'right' }
          ]]
        },
        rtl: true,
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
                  createArabicTextBlock(toEnglishNumber(agreement.agreement_number) || prepareArabicForPDF('محدد غير'), 'cardValue'),
                  { 
                    ...createArabicTextBlock(agreement.status || prepareArabicForPDF('محدد غير'), 'cardValue'),
                    color: getStatusColor(agreement.status)
                  },
                  createArabicTextBlock(
                    agreement.start_date && agreement.end_date 
                      ? toEnglishNumber(`${Math.ceil((new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))}`) + ' شهر'
                      : prepareArabicForPDF('محدد غير'), 
                    'cardValue'
                  ),
                  createArabicTextBlock(toEnglishNumber(rentAmount), 'cardValue')
                ]
              ]
            },
            fillColor: colors.lighter
          }]]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Two-column layout for customer and vehicle info, matching the screenshot
      {
        columns: [
          {
            width: '48%',
            stack: [
              {
                text: labels.customerInfo.ar,
                style: 'sectionHeader',
                margin: [0, 0, 0, 8],
                alignment: 'right',
                rtl: true
              },
              {
                table: {
                  widths: ['60%', '40%'],
                  body: [
                    [
                      { text: agreement.customers?.full_name || prepareArabicForPDF('محدد غير'), style: 'valueStyle', alignment: 'left', border: [false, true, false, false] },
                      { text: labels.name.ar, style: 'labelStyle', alignment: 'right', border: [false, true, false, false] }
                    ],
                    [
                      { text: agreement.customers?.phone_number || prepareArabicForPDF('محدد غير'), style: 'valueStyle', alignment: 'left', border: [false, true, false, false] },
                      { text: labels.phone.ar, style: 'labelStyle', alignment: 'right', border: [false, true, false, false] }
                    ],
                    [
                      { text: agreement.customers?.nationality || prepareArabicForPDF('محدد غير'), style: 'valueStyle', alignment: 'left', border: [false, true, false, false] },
                      { text: labels.nationality.ar, style: 'labelStyle', alignment: 'right', border: [false, true, false, false] }
                    ],
                    [
                      { text: agreement.customers?.driver_license || prepareArabicForPDF('محدد غير'), style: 'valueStyle', alignment: 'left', border: [false, true, false, false] },
                      { text: labels.driverLicense.ar, style: 'labelStyle', alignment: 'right', border: [false, true, false, false] }
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
                alignment: 'right',
                rtl: true
              },
              {
                table: {
                  widths: ['60%', '40%'],
                  body: [
                    [
                      { text: `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || prepareArabicForPDF('محدد غير'), style: 'valueStyle', alignment: 'left', border: [false, true, false, false] },
                      { text: labels.makeModel.ar, style: 'labelStyle', alignment: 'right', border: [false, true, false, false] }
                    ],
                    [
                      { text: agreement.vehicles?.year?.toString() || prepareArabicForPDF('محدد غير'), style: 'valueStyle', alignment: 'left', border: [false, true, false, false] },
                      { text: labels.year.ar, style: 'labelStyle', alignment: 'right', border: [false, true, false, false] }
                    ],
                    [
                      { text: agreement.vehicles?.license_plate || prepareArabicForPDF('محدد غير'), style: 'valueStyle', alignment: 'left', border: [false, true, false, false] },
                      { text: labels.licensePlate.ar, style: 'labelStyle', alignment: 'right', border: [false, true, false, false] }
                    ],
                    [
                      { text: agreement.vehicles?.vin || prepareArabicForPDF('محدد غير'), style: 'valueStyle', alignment: 'left', border: [false, true, false, false] },
                      { text: labels.vin.ar, style: 'labelStyle', alignment: 'right', border: [false, true, false, false] }
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
                  createArabicTextBlock(toEnglishNumber(contractAmount), 'metricValue'),
                  { ...createArabicTextBlock(toEnglishNumber(metrics.totalPaid), 'metricValue'), color: colors.success },
                  { 
                    ...createArabicTextBlock(toEnglishNumber(metrics.remainingBalance), 'metricValue'), 
                    color: metrics.remainingBalance > 0 ? colors.warning : colors.success 
                  },
                  { 
                    ...createArabicTextBlock(toEnglishNumber(metrics.totalLateFees), 'metricValue'), 
                    color: metrics.totalLateFees > 0 ? colors.danger : colors.success 
                  },
                  { ...createArabicTextBlock(toEnglishNumber(Math.round(metrics.paymentProgress)) + '%', 'metricValue'), color: colors.primary }
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
                { text: labels.paymentMethod.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.lighter, color: colors.primary, border: [false, false, false, true], margin: [0, 4, 0, 4] },
                { text: labels.paymentStatus.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.lighter, color: colors.primary, border: [false, false, false, true], margin: [0, 4, 0, 4] },
                { text: labels.amount.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.lighter, color: colors.primary, border: [false, false, false, true], margin: [0, 4, 0, 4] },
                { text: labels.paymentDate.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.lighter, color: colors.primary, border: [false, false, false, true], margin: [0, 4, 0, 4] }
              ],
              ...payments.slice(0, 10).map(payment => [
                { text: payment.payment_method || prepareArabicForPDF('محدد غير'), style: 'tableCell', alignment: 'center', border: [false, false, false, false] },
                { text: payment.status === 'pending' ? 'Pending' : payment.status || prepareArabicForPDF('محدد غير'), style: 'tableCell', alignment: 'center', color: payment.status === 'pending' ? colors.warning : colors.text, bold: payment.status === 'pending', border: [false, false, false, false] },
                { text: toEnglishNumber(payment.amount), style: 'tableCell', alignment: 'center', border: [false, false, false, false] },
                { text: payment.payment_date ? formatArabicDate(payment.payment_date) : prepareArabicForPDF('محدد غير'), style: 'tableCell', alignment: 'center', border: [false, false, false, false] }
              ])
            ]
          },
          layout: {
            hLineWidth: function (i: number, node: any) {
              // Thicker line under header
              if (i === 1) return 2;
              // Thin lines between rows
              return 0.5;
            },
            hLineColor: function (i: number, node: any) {
              // Dark line under header
              if (i === 1) return colors.primary;
              // Light gray for other lines
              return colors.border;
            },
            vLineWidth: function () { return 0; }
          },
          margin: [0, 0, 0, 20]
        }
      ] : []),
      
      // Traffic fines with RTL support (if fines exist)
      ...(trafficFines.length > 0 ? [
        createArabicTextBlock(labels.trafficFines.ar, 'sectionHeader'),
        {
          table: {
            headerRows: 1,
            widths: ['20%', '20%', '20%', '20%', '20%'],
            body: [
              [
                { text: labels.fineLocation.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.lighter, color: colors.primary, border: [false, false, false, true], margin: [0, 4, 0, 4] },
                { text: labels.fineViolation.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.lighter, color: colors.primary, border: [false, false, false, true], margin: [0, 4, 0, 4] },
                { text: labels.fineStatus.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.lighter, color: colors.primary, border: [false, false, false, true], margin: [0, 4, 0, 4] },
                { text: labels.fineAmount.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.lighter, color: colors.primary, border: [false, false, false, true], margin: [0, 4, 0, 4] },
                { text: labels.fineDate.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.lighter, color: colors.primary, border: [false, false, false, true], margin: [0, 4, 0, 4] }
              ],
              ...trafficFines.map(fine => [
                { text: fine.location || prepareArabicForPDF('محدد غير'), style: 'tableCell', alignment: 'center', border: [false, false, false, false] },
                { text: fine.violationCharge || fine.violation_charge || prepareArabicForPDF('محدد غير'), style: 'tableCell', alignment: 'center', border: [false, false, false, false] },
                { 
                  text: fine.paymentStatus === 'paid' ? 'مسدد' : fine.paymentStatus === 'pending' ? 'معلق' : prepareArabicForPDF('محدد غير'), 
                  style: 'tableCell', 
                  alignment: 'center', 
                  color: getStatusColor(fine.paymentStatus),
                  border: [false, false, false, false]
                },
                { text: toEnglishNumber(fine.fineAmount || fine.fine_amount), style: 'tableCell', alignment: 'center', border: [false, false, false, false] },
                { text: fine.violationDate ? formatDateEnglish(fine.violationDate) : formatDateEnglish(fine.violation_date) || prepareArabicForPDF('N/A'), style: 'tableCell', alignment: 'center', border: [false, false, false, false] }
              ]),
              [
                { ...createArabicTextBlock(labels.totalFines.ar, 'tableHeader'), colSpan: 4, alignment: 'center' },
                {},
                {},
                {},
                { 
                  ...createArabicTextBlock(toEnglishNumber(trafficFines.reduce((sum, f) => sum + (f.fineAmount || f.fine_amount || 0), 0)), 'tableHeader'),
                  color: colors.danger,
                  alignment: 'center'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i: number, node: any) {
              // Thicker line under header
              if (i === 1) return 2;
              // Thin lines between rows
              return 0.5;
            },
            hLineColor: function (i: number, node: any) {
              // Dark line under header
              if (i === 1) return colors.primary;
              // Light gray for other lines
              return colors.border;
            },
            vLineWidth: function () { return 0; }
          },
          margin: [0, 0, 0, 20]
        }
      ] : [])
    ],
    
    // Enhanced styles with proper Arabic text handling and corrected font references
    styles: {
      companyName: {
        fontSize: 18,
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
        alignment: 'right'
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
        color: colors.textLight,
        alignment: 'center'
      },
      arabicText: {
        alignment: 'right'
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

  try {
    // Generate and download the PDF
    const fileName = prepareArabicForPDF(`تقرير-إيجار-${agreement.agreement_number || 'غير-محدد'}.pdf`);
    pdfMake.createPdf(docDefinition).download(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating Arabic agreement report PDF:', error);
    return false;
  }
}
