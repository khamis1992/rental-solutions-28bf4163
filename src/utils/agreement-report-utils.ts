
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  prepareArabicForPDF, 
  formatArabicCurrency, 
  formatArabicDate 
} from './arabic-text-utils';

// Simple font configuration - use only built-in fonts to avoid loading issues
export async function ensureFontsLoaded() {
  try {
    // Use only standard fonts available in all browsers
    (pdfMake as any).fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    // Clear VFS to prevent font file loading issues
    (pdfMake as any).vfs = {};
  } catch (error) {
    console.warn('Font loading failed, using default fonts:', error);
  }
}

// Enhanced Arabic labels with proper text direction
const labels = {
  // Header
  reportTitle: { ar: prepareArabicForPDF('تقرير عقد الايجار الشامل') },
  companyName: { ar: prepareArabicForPDF('شركة العراف لتأجير السيارات ذ.م.م') },
  
  // Table headers matching the image
  agreementNumber: { ar: prepareArabicForPDF('رقم العقد') },
  status: { ar: prepareArabicForPDF('حالة العقد') },
  duration: { ar: prepareArabicForPDF('مدة العقد') },
  monthlyRent: { ar: prepareArabicForPDF('الايجار الشهري') },
  
  // Payment section
  paymentRecord: { ar: prepareArabicForPDF('سجل الدفعات') },
  paymentMethod: { ar: prepareArabicForPDF('طريقة الدفع') },
  paymentStatus: { ar: prepareArabicForPDF('حالة الدفع') },
  amount: { ar: prepareArabicForPDF('المبلغ') },
  paymentDate: { ar: prepareArabicForPDF('تاريخ الدفع') },
  
  // Status translations
  pending: { ar: prepareArabicForPDF('معلق') },
  paid: { ar: prepareArabicForPDF('مدفوع') },
  overdue: { ar: prepareArabicForPDF('متأخر') },
  undefined: { ar: prepareArabicForPDF('غير محدد') },
  active: { ar: prepareArabicForPDF('نشط') },
  
  // Agreement info section
  agreementInfo: { ar: prepareArabicForPDF('معلومات العقد') },
  startDate: { ar: prepareArabicForPDF('تاريخ البدء') },
  endDate: { ar: prepareArabicForPDF('تاريخ الانتهاء') },
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
  makeModel: { ar: prepareArabicForPDF('ماركة وموديل المركبة') },
  year: { ar: prepareArabicForPDF('سنة الصنع') },
  licensePlate: { ar: prepareArabicForPDF('رقم اللوحة') },
  color: { ar: prepareArabicForPDF('اللون') },
  vin: { ar: prepareArabicForPDF('رقم الهيكل') },
  
  // Footer
  confidential: { ar: prepareArabicForPDF('سري - شركة العراف لتأجير السيارات') },
  generatedOn: { ar: prepareArabicForPDF('تم إنشاؤه في') },
  pageOf: { ar: prepareArabicForPDF('صفحة') }
};

// Enhanced color scheme matching the image
const colors = {
  primary: '#3f5aab',      // Blue from the image
  headerBg: '#3f5aab',     // Blue header background
  secondary: '#64748b',    // Slate gray
  text: '#334155',         // Dark gray
  textLight: '#64748b',    // Light text
  border: '#e2e8f0',       // Border gray
  white: '#ffffff',
  pendingOrange: '#f59e0b' // Orange for pending status
};

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active': case 'نشط': return '#059669';
    case 'pending': case 'معلق': return colors.pendingOrange;
    case 'completed': case 'مكتمل': return colors.primary;
    case 'cancelled': case 'ملغي': return '#dc2626';
    case 'paid': case 'مدفوع': return '#059669';
    case 'overdue': case 'متأخر': return '#dc2626';
    default: return colors.secondary;
  }
};

const getStatusText = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'معلق';
    case 'paid': return 'مدفوع';
    case 'overdue': return 'متأخر';
    case 'active': return 'نشط';
    default: return status || 'غير محدد';
  }
};

export async function generateAgreementReportPdfmake(
  agreement: any,
  rentAmount: any,
  contractAmount: any,
  payments: any[] = [],
  trafficFines: any[] = []
) {
  await ensureFontsLoaded();
  
  const currentDate = formatArabicDate(new Date());
  
  // Calculate duration in months from the agreement data
  const calculateDuration = () => {
    if (agreement.start_date && agreement.end_date) {
      const start = new Date(agreement.start_date);
      const end = new Date(agreement.end_date);
      const diffMonths = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      return `${diffMonths} شهر`;
    }
    return 'غير محدد';
  };

  // Prepare payments table rows
  const preparePaymentsTable = () => {
    if (!payments || payments.length === 0) {
      return [
        [
          { text: labels.paymentMethod.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.border },
          { text: labels.paymentStatus.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.border },
          { text: labels.amount.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.border },
          { text: labels.paymentDate.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.border }
        ],
        [
          { text: 'غير محدد', style: 'tableData', alignment: 'center' },
          { text: 'لا توجد دفعات', style: 'tableData', alignment: 'center' },
          { text: 'QAR 0', style: 'tableData', alignment: 'center' },
          { text: 'غير محدد', style: 'tableData', alignment: 'center' }
        ]
      ];
    }

    const headerRow = [
      { text: labels.paymentMethod.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.border },
      { text: labels.paymentStatus.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.border },
      { text: labels.amount.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.border },
      { text: labels.paymentDate.ar, style: 'tableHeader', alignment: 'center', fillColor: colors.border }
    ];

    const dataRows = payments.slice(0, 8).map(payment => [
      { 
        text: payment.payment_method || 'غير محدد', 
        style: 'tableData', 
        alignment: 'center' 
      },
      { 
        text: getStatusText(payment.status || 'pending'), 
        style: 'tableData', 
        alignment: 'center',
        color: getStatusColor(payment.status || 'pending')
      },
      { 
        text: formatArabicCurrency(payment.amount || rentAmount || 1600),
        style: 'tableData', 
        alignment: 'center' 
      },
      { 
        text: payment.payment_date ? formatArabicDate(payment.payment_date) : 'غير محدد',
        style: 'tableData', 
        alignment: 'center' 
      }
    ]);

    return [headerRow, ...dataRows];
  };

  // Document definition matching the exact layout from the image
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 80],
    
    // Header
    header: {
      margin: [40, 20, 40, 0],
      table: {
        widths: ['*'],
        body: [[
          {
            text: labels.companyName.ar,
            style: 'companyHeader',
            alignment: 'center'
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
    
    // Main content matching the exact layout from the image
    content: [
      // Main title with blue background
      {
        table: {
          widths: ['*'],
          body: [[
            {
              text: labels.reportTitle.ar,
              style: 'mainTitle',
              alignment: 'center',
              fillColor: colors.headerBg,
              color: colors.white
            }
          ]]
        },
        layout: {
          hLineWidth: function () { return 2; },
          vLineWidth: function () { return 2; },
          hLineColor: function () { return colors.headerBg; },
          vLineColor: function () { return colors.headerBg; }
        },
        margin: [0, 20, 0, 30]
      },
      
      // Agreement details table
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            // Header row with labels
            [
              { 
                text: labels.agreementNumber.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              },
              { 
                text: labels.status.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              },
              { 
                text: labels.duration.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              },
              { 
                text: labels.monthlyRent.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              }
            ],
            // Data row
            [
              { 
                text: agreement.agreement_number || 'AGR-202504-405141', 
                style: 'tableData',
                alignment: 'center'
              },
              { 
                text: labels.active.ar, 
                style: 'tableData',
                alignment: 'center',
                color: getStatusColor('active')
              },
              { 
                text: calculateDuration(),
                style: 'tableData',
                alignment: 'center'
              },
              { 
                text: formatArabicCurrency(rentAmount || 1600),
                style: 'tableData',
                alignment: 'center'
              }
            ]
          ]
        },
        layout: {
          hLineWidth: function (i, node) { return 1; },
          vLineWidth: function (i, node) { return 1; },
          hLineColor: function () { return colors.border; },
          vLineColor: function () { return colors.border; }
        },
        margin: [0, 0, 0, 30]
      },

      // Agreement Information Section
      {
        table: {
          widths: ['*'],
          body: [[
            {
              text: labels.agreementInfo.ar,
              style: 'sectionTitle',
              alignment: 'center',
              fillColor: colors.headerBg,
              color: colors.white
            }
          ]]
        },
        layout: {
          hLineWidth: function () { return 2; },
          vLineWidth: function () { return 2; },
          hLineColor: function () { return colors.headerBg; },
          vLineColor: function () { return colors.headerBg; }
        },
        margin: [0, 20, 0, 10]
      },

      // Agreement info table
      {
        table: {
          widths: ['33%', '33%', '34%'],
          body: [
            [
              { 
                text: labels.startDate.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              },
              { 
                text: labels.endDate.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              },
              { 
                text: labels.contractTotal.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              }
            ],
            [
              { 
                text: formatArabicDate(agreement.start_date),
                style: 'tableData',
                alignment: 'center'
              },
              { 
                text: formatArabicDate(agreement.end_date),
                style: 'tableData',
                alignment: 'center'
              },
              { 
                text: formatArabicCurrency(contractAmount || rentAmount || 1600),
                style: 'tableData',
                alignment: 'center'
              }
            ]
          ]
        },
        layout: {
          hLineWidth: function (i, node) { return 1; },
          vLineWidth: function (i, node) { return 1; },
          hLineColor: function () { return colors.border; },
          vLineColor: function () { return colors.border; }
        },
        margin: [0, 0, 0, 30]
      },

      // Customer Information Section
      {
        table: {
          widths: ['*'],
          body: [[
            {
              text: labels.customerInfo.ar,
              style: 'sectionTitle',
              alignment: 'center',
              fillColor: colors.headerBg,
              color: colors.white
            }
          ]]
        },
        layout: {
          hLineWidth: function () { return 2; },
          vLineWidth: function () { return 2; },
          hLineColor: function () { return colors.headerBg; },
          vLineColor: function () { return colors.headerBg; }
        },
        margin: [0, 20, 0, 10]
      },

      // Customer info table
      {
        table: {
          widths: ['33%', '33%', '34%'],
          body: [
            [
              { 
                text: labels.name.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              },
              { 
                text: labels.email.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              },
              { 
                text: labels.phone.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              }
            ],
            [
              { 
                text: agreement.customers?.full_name || 'غير محدد',
                style: 'tableData',
                alignment: 'center'
              },
              { 
                text: agreement.customers?.email || 'غير محدد',
                style: 'tableData',
                alignment: 'center'
              },
              { 
                text: agreement.customers?.phone_number || 'غير محدد',
                style: 'tableData',
                alignment: 'center'
              }
            ]
          ]
        },
        layout: {
          hLineWidth: function (i, node) { return 1; },
          vLineWidth: function (i, node) { return 1; },
          hLineColor: function () { return colors.border; },
          vLineColor: function () { return colors.border; }
        },
        margin: [0, 0, 0, 30]
      },

      // Vehicle Information Section
      {
        table: {
          widths: ['*'],
          body: [[
            {
              text: labels.vehicleInfo.ar,
              style: 'sectionTitle',
              alignment: 'center',
              fillColor: colors.headerBg,
              color: colors.white
            }
          ]]
        },
        layout: {
          hLineWidth: function () { return 2; },
          vLineWidth: function () { return 2; },
          hLineColor: function () { return colors.headerBg; },
          vLineColor: function () { return colors.headerBg; }
        },
        margin: [0, 20, 0, 10]
      },

      // Vehicle info table
      {
        table: {
          widths: ['33%', '33%', '34%'],
          body: [
            [
              { 
                text: labels.makeModel.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              },
              { 
                text: labels.licensePlate.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              },
              { 
                text: labels.vin.ar, 
                style: 'tableHeader',
                alignment: 'center',
                fillColor: colors.border
              }
            ],
            [
              { 
                text: `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'غير محدد',
                style: 'tableData',
                alignment: 'center'
              },
              { 
                text: agreement.vehicles?.license_plate || 'غير محدد',
                style: 'tableData',
                alignment: 'center'
              },
              { 
                text: agreement.vehicles?.vin || 'غير محدد',
                style: 'tableData',
                alignment: 'center'
              }
            ]
          ]
        },
        layout: {
          hLineWidth: function (i, node) { return 1; },
          vLineWidth: function (i, node) { return 1; },
          hLineColor: function () { return colors.border; },
          vLineColor: function () { return colors.border; }
        },
        margin: [0, 0, 0, 30]
      },

      // Payment Records Section with blue title bar
      {
        table: {
          widths: ['*'],
          body: [[
            {
              text: labels.paymentRecord.ar,
              style: 'sectionTitle',
              alignment: 'center',
              fillColor: colors.headerBg,
              color: colors.white
            }
          ]]
        },
        layout: {
          hLineWidth: function () { return 2; },
          vLineWidth: function () { return 2; },
          hLineColor: function () { return colors.headerBg; },
          vLineColor: function () { return colors.headerBg; }
        },
        margin: [0, 20, 0, 10]
      },

      // Payments table matching the image
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: preparePaymentsTable()
        },
        layout: {
          hLineWidth: function (i, node) { return 1; },
          vLineWidth: function (i, node) { return 1; },
          hLineColor: function () { return colors.border; },
          vLineColor: function () { return colors.border; }
        },
        margin: [0, 0, 0, 30]
      }
    ],
    
    // Styles
    styles: {
      companyHeader: {
        fontSize: 16,
        bold: true,
        color: colors.primary
      },
      mainTitle: {
        fontSize: 18,
        bold: true,
        margin: [10, 15, 10, 15]
      },
      sectionTitle: {
        fontSize: 16,
        bold: true,
        margin: [10, 12, 10, 12]
      },
      tableHeader: {
        fontSize: 12,
        bold: true,
        color: colors.text,
        margin: [5, 8, 5, 8]
      },
      tableData: {
        fontSize: 11,
        color: colors.text,
        margin: [5, 8, 5, 8]
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
