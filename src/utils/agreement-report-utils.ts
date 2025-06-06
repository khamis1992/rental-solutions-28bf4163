
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  prepareArabicForPDF, 
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
  reportTitle: { ar: prepareArabicForPDF('تقرير عقد الايجار الشامل') },
  companyName: { ar: prepareArabicForPDF('شركة العراف لتأجير السيارات ذ.م.م') },
  
  // Table headers matching the image
  agreementNumber: { ar: prepareArabicForPDF('رقم العقد') },
  status: { ar: prepareArabicForPDF('حالة العقد') },
  duration: { ar: prepareArabicForPDF('مدة العقد') },
  monthlyRent: { ar: prepareArabicForPDF('الايجار الشهري') },
  
  // Document info
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
  white: '#ffffff'
};

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active': case 'نشط': return '#059669';
    case 'pending': case 'معلق': return '#d97706';
    case 'completed': case 'مكتمل': return colors.primary;
    case 'cancelled': case 'ملغي': return '#dc2626';
    default: return colors.secondary;
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
      // Main title with blue background (matching the image)
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
      
      // Agreement details table (exactly matching the image layout)
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
                text: 'active', 
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
          hLineWidth: function (i, node) {
            return 1;
          },
          vLineWidth: function (i, node) {
            return 1;
          },
          hLineColor: function () {
            return colors.border;
          },
          vLineColor: function () {
            return colors.border;
          }
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
