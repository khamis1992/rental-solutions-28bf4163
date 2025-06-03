
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  processArabicText, 
  createArabicPdfText, 
  formatArabicCurrency, 
  formatArabicDate,
  formatArabicStatus,
  formatArabicPaymentMethod 
} from './arabic-text-processor';
import { 
  getArabicPdfConfig,
  createArabicTable,
  createArabicHeader,
  createArabicFooter,
  setupArabicFonts 
} from './pdf-arabic-enhancer';

// Enhanced Arabic labels with proper text processing
const labels = {
  // Header
  reportTitle: processArabicText('تقرير عقد الإيجار الشامل'),
  companyName: processArabicText('شركة العرف لتأجير السيارات ذ.م.م'),
  
  // Document info
  agreementInfo: processArabicText('معلومات العقد'),
  agreementNumber: processArabicText('رقم العقد'),
  status: processArabicText('حالة العقد'),
  startDate: processArabicText('تاريخ البدء'),
  endDate: processArabicText('تاريخ الانتهاء'),
  duration: processArabicText('مدة العقد'),
  monthlyRent: processArabicText('الإيجار الشهري'),
  contractTotal: processArabicText('إجمالي العقد'),
  depositAmount: processArabicText('مبلغ التأمين'),
  rentDueDay: processArabicText('يوم استحقاق الإيجار'),
  
  // Customer info
  customerInfo: processArabicText('معلومات العميل'),
  name: processArabicText('الاسم الكامل'),
  email: processArabicText('البريد الإلكتروني'),
  phone: processArabicText('رقم الهاتف'),
  driverLicense: processArabicText('رخصة القيادة'),
  nationality: processArabicText('الجنسية'),
  address: processArabicText('العنوان'),
  
  // Vehicle info
  vehicleInfo: processArabicText('معلومات المركبة'),
  makeModel: processArabicText('الماركة والموديل'),
  year: processArabicText('سنة الصنع'),
  licensePlate: processArabicText('رقم اللوحة'),
  color: processArabicText('اللون'),
  vin: processArabicText('رقم الهيكل'),
  
  // Financial summary
  financialSummary: processArabicText('الملخص المالي'),
  totalPaid: processArabicText('إجمالي المدفوع'),
  totalDue: processArabicText('إجمالي المستحق'),
  lateFees: processArabicText('رسوم التأخير'),
  remainingBalance: processArabicText('الرصيد المتبقي'),
  pendingPayments: processArabicText('الدفعات المعلقة'),
  nextPaymentDue: processArabicText('تاريخ الدفعة القادمة'),
  paymentProgress: processArabicText('تقدم الدفعات'),
  
  // Payment details
  paymentHistory: processArabicText('سجل الدفعات'),
  paymentDate: processArabicText('تاريخ الدفع'),
  amount: processArabicText('المبلغ'),
  paymentStatus: processArabicText('حالة الدفع'),
  paymentMethod: processArabicText('طريقة الدفع'),
  
  // Traffic fines
  trafficFines: processArabicText('المخالفات المرورية'),
  fineAmount: processArabicText('مبلغ المخالفة'),
  fineDate: processArabicText('تاريخ المخالفة'),
  fineStatus: processArabicText('حالة المخالفة'),
  fineLocation: processArabicText('موقع المخالفة'),
  totalFines: processArabicText('إجمالي المخالفات'),
  
  // Legal info
  legalInfo: processArabicText('المعلومات القانونية'),
  signature: processArabicText('التوقيع'),
  date: processArabicText('التاريخ'),
  terms: processArabicText('الأحكام والشروط'),
  
  // Footer
  confidential: processArabicText('سري - شركة العرف لتأجير السيارات'),
  generatedOn: processArabicText('تم إنشاؤه في'),
  pageOf: processArabicText('صفحة')
};

// Enhanced color scheme
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
  // Setup Arabic fonts with fallback
  const fontsLoaded = setupArabicFonts(pdfMake);
  
  const metrics = calculateFinancialMetrics(payments, contractAmount);
  const currentDate = formatArabicDate(new Date());
  
  // Get Arabic PDF configuration
  const config = getArabicPdfConfig();
  
  // Enhanced document definition with proper Arabic RTL support
  const docDefinition = {
    ...config,
    
    // Header with enhanced Arabic support
    header: createArabicHeader({}),
    
    // Footer with enhanced Arabic support  
    footer: (currentPage: number, pageCount: number) => 
      createArabicFooter(currentPage, pageCount),
    
    // Main content with enhanced Arabic support
    content: [
      // Report title
      {
        table: {
          widths: ['*'],
          body: [[{
            text: labels.reportTitle,
            style: 'arabicHeader',
            alignment: 'center',
            color: 'white',
            margin: [0, 10, 0, 10]
          }]]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          fillColor: () => colors.primary
        },
        margin: [0, 0, 0, 20]
      },
      
      // Agreement overview with enhanced Arabic
      createArabicTable(
        [
          labels.agreementNumber,
          labels.status,
          labels.duration,
          labels.monthlyRent
        ],
        [[
          agreement.agreement_number || processArabicText('غير محدد'),
          formatArabicStatus(agreement.status),
          agreement.start_date && agreement.end_date 
            ? processArabicText(`${Math.ceil((new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} شهر`)
            : processArabicText('غير محدد'),
          formatArabicCurrency(rentAmount)
        ]],
        { 
          widths: ['25%', '25%', '25%', '25%'],
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        }
      ),
      
      // Two-column layout for customer and vehicle info
      {
        columns: [
          {
            width: '48%',
            stack: [
              {
                text: labels.customerInfo,
                style: 'arabicHeader',
                margin: [0, 0, 0, 10]
              },
              createArabicTable(
                [processArabicText('البيان'), processArabicText('القيمة')],
                [
                  [labels.name, processArabicText(agreement.customers?.full_name || 'غير محدد')],
                  [labels.phone, processArabicText(agreement.customers?.phone_number || 'غير محدد')],
                  [labels.nationality, processArabicText(agreement.customers?.nationality || 'غير محدد')],
                  [labels.driverLicense, processArabicText(agreement.customers?.driver_license || 'غير محدد')]
                ],
                { widths: ['40%', '60%'] }
              )
            ]
          },
          { width: '4%', text: '' }, // Spacer
          {
            width: '48%',
            stack: [
              {
                text: labels.vehicleInfo,
                style: 'arabicHeader',
                margin: [0, 0, 0, 10]
              },
              createArabicTable(
                [processArabicText('البيان'), processArabicText('القيمة')],
                [
                  [labels.makeModel, processArabicText(`${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'غير محدد')],
                  [labels.year, processArabicText(agreement.vehicles?.year?.toString() || 'غير محدد')],
                  [labels.licensePlate, processArabicText(agreement.vehicles?.license_plate || 'غير محدد')],
                  [labels.vin, processArabicText(agreement.vehicles?.vin || 'غير محدد')]
                ],
                { widths: ['40%', '60%'] }
              )
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },
      
      // Financial summary with enhanced Arabic
      {
        text: labels.financialSummary,
        style: 'arabicHeader',
        margin: [0, 0, 0, 10]
      },
      createArabicTable(
        [
          labels.contractTotal,
          labels.totalPaid,
          labels.remainingBalance,
          labels.lateFees,
          labels.paymentProgress
        ],
        [[
          formatArabicCurrency(contractAmount),
          formatArabicCurrency(metrics.totalPaid),
          formatArabicCurrency(metrics.remainingBalance),
          formatArabicCurrency(metrics.totalLateFees),
          processArabicText(`${Math.round(metrics.paymentProgress)}%`)
        ]],
        { 
          widths: ['20%', '20%', '20%', '20%', '20%'],
          margin: [0, 0, 0, 20]
        }
      ),
      
      // Payment history with enhanced Arabic (if payments exist)
      ...(payments.length > 0 ? [
        {
          text: labels.paymentHistory,
          style: 'arabicHeader',
          margin: [0, 0, 0, 10]
        },
        createArabicTable(
          [
            labels.paymentDate,
            labels.amount,
            labels.paymentStatus,
            labels.paymentMethod
          ],
          payments.slice(0, 10).map(payment => [
            formatArabicDate(payment.payment_date),
            formatArabicCurrency(payment.amount),
            formatArabicStatus(payment.status),
            formatArabicPaymentMethod(payment.payment_method)
          ]),
          { 
            widths: ['25%', '25%', '25%', '25%'],
            margin: [0, 0, 0, 20]
          }
        )
      ] : []),
      
      // Traffic fines with enhanced Arabic (if fines exist)
      ...(trafficFines.length > 0 ? [
        {
          text: labels.trafficFines,
          style: 'arabicHeader',
          margin: [0, 0, 0, 10]
        },
        createArabicTable(
          [
            labels.fineDate,
            labels.fineAmount,
            labels.fineStatus,
            labels.fineLocation
          ],
          [
            ...trafficFines.map(fine => [
              formatArabicDate(fine.date),
              formatArabicCurrency(fine.amount),
              formatArabicStatus(fine.status),
              processArabicText(fine.location || 'غير محدد')
            ]),
            [
              { text: labels.totalFines, colSpan: 3, style: 'arabicTableHeader' },
              {},
              {},
              { 
                text: formatArabicCurrency(trafficFines.reduce((sum, f) => sum + (f.amount || 0), 0)),
                style: 'arabicTableHeader',
                color: colors.danger
              }
            ]
          ],
          { 
            widths: ['25%', '25%', '25%', '25%'],
            margin: [0, 0, 0, 20]
          }
        )
      ] : [])
    ]
  };

  try {
    const fileName = `تقرير-عقد-${agreement.agreement_number || 'غير-محدد'}.pdf`;
    console.log('✓ Generating Arabic PDF report with enhanced text processing');
    pdfMake.createPdf(docDefinition).download(fileName);
  } catch (error) {
    console.error('❌ Error generating Arabic PDF:', error);
    throw new Error('فشل في إنشاء تقرير PDF');
  }
}
