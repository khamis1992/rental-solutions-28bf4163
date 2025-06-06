
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  prepareArabicForPDF, 
  createArabicTextBlock, 
  formatArabicCurrency, 
  formatArabicDate 
} from './arabic-text-utils';

// Enhanced font configuration with better Arabic support
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
    // Fonts are preloaded via script tags and already available in pdfMake.vfs
  } catch (error) {
    console.warn('Font loading failed, using default fonts:', error);
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

// Enhanced Arabic labels with proper text direction
const labels = {
  // Header
  reportTitle: { ar: prepareArabicForPDF('تقرير عقد الإيجار الشامل'), en: 'COMPREHENSIVE RENTAL AGREEMENT REPORT' },
  companyName: { ar: prepareArabicForPDF('شركة العرف لتأجير السيارات ذ.م.م'), en: 'ALARAF CAR RENTAL COMPANY LLC' },
  
  // Document info
  agreementInfo: { ar: prepareArabicForPDF('معلومات العقد'), en: 'Agreement Information' },
  agreementNumber: { ar: prepareArabicForPDF('رقم العقد'), en: 'Agreement Number' },
  status: { ar: prepareArabicForPDF('حالة العقد'), en: 'Status' },
  startDate: { ar: prepareArabicForPDF('تاريخ البدء'), en: 'Start Date' },
  endDate: { ar: prepareArabicForPDF('تاريخ الانتهاء'), en: 'End Date' },
  duration: { ar: prepareArabicForPDF('مدة العقد'), en: 'Duration' },
  monthlyRent: { ar: prepareArabicForPDF('الإيجار الشهري'), en: 'Monthly Rent' },
  contractTotal: { ar: prepareArabicForPDF('إجمالي العقد'), en: 'Contract Total' },
  depositAmount: { ar: prepareArabicForPDF('مبلغ التأمين'), en: 'Deposit Amount' },
  
  // Customer info
  customerInfo: { ar: prepareArabicForPDF('معلومات العميل'), en: 'Customer Information' },
  name: { ar: prepareArabicForPDF('الاسم الكامل'), en: 'Full Name' },
  email: { ar: prepareArabicForPDF('البريد الإلكتروني'), en: 'Email' },
  phone: { ar: prepareArabicForPDF('رقم الهاتف'), en: 'Phone Number' },
  driverLicense: { ar: prepareArabicForPDF('رخصة القيادة'), en: 'Driver License' },
  nationality: { ar: prepareArabicForPDF('الجنسية'), en: 'Nationality' },
  address: { ar: prepareArabicForPDF('العنوان'), en: 'Address' },
  
  // Vehicle info
  vehicleInfo: { ar: prepareArabicForPDF('معلومات المركبة'), en: 'Vehicle Information' },
  makeModel: { ar: prepareArabicForPDF('الماركة والموديل'), en: 'Make & Model' },
  year: { ar: prepareArabicForPDF('سنة الصنع'), en: 'Year' },
  licensePlate: { ar: prepareArabicForPDF('رقم اللوحة'), en: 'License Plate' },
  color: { ar: prepareArabicForPDF('اللون'), en: 'Color' },
  vin: { ar: prepareArabicForPDF('رقم الهيكل'), en: 'VIN' },
  
  // Financial summary
  financialSummary: { ar: prepareArabicForPDF('الملخص المالي'), en: 'Financial Summary' },
  totalPaid: { ar: prepareArabicForPDF('إجمالي المدفوع'), en: 'Total Paid' },
  totalDue: { ar: prepareArabicForPDF('إجمالي المستحق'), en: 'Total Due' },
  lateFees: { ar: prepareArabicForPDF('رسوم التأخير'), en: 'Late Fees' },
  remainingBalance: { ar: prepareArabicForPDF('الرصيد المتبقي'), en: 'Remaining Balance' },
  paymentProgress: { ar: prepareArabicForPDF('تقدم الدفعات'), en: 'Payment Progress' },
  
  // Payment details
  paymentHistory: { ar: prepareArabicForPDF('سجل الدفعات'), en: 'Payment History' },
  paymentDate: { ar: prepareArabicForPDF('تاريخ الدفع'), en: 'Payment Date' },
  amount: { ar: prepareArabicForPDF('المبلغ'), en: 'Amount' },
  paymentStatus: { ar: prepareArabicForPDF('حالة الدفع'), en: 'Payment Status' },
  paymentMethod: { ar: prepareArabicForPDF('طريقة الدفع'), en: 'Payment Method' },
  
  // Traffic fines
  trafficFines: { ar: prepareArabicForPDF('المخالفات المرورية'), en: 'Traffic Fines' },
  fineAmount: { ar: prepareArabicForPDF('مبلغ المخالفة'), en: 'Fine Amount' },
  fineDate: { ar: prepareArabicForPDF('تاريخ المخالفة'), en: 'Fine Date' },
  fineStatus: { ar: prepareArabicForPDF('حالة المخالفة'), en: 'Fine Status' },
  fineLocation: { ar: prepareArabicForPDF('موقع المخالفة'), en: 'Fine Location' },
  totalFines: { ar: prepareArabicForPDF('إجمالي المخالفات'), en: 'Total Fines' },
  
  // Footer
  confidential: { ar: prepareArabicForPDF('سري - شركة العرف لتأجير السيارات'), en: 'CONFIDENTIAL - ALARAF CAR RENTAL' },
  generatedOn: { ar: prepareArabicForPDF('تم إنشاؤه في'), en: 'Generated on' },
  pageOf: { ar: prepareArabicForPDF('صفحة'), en: 'Page' }
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

// Helper function to create bilingual text blocks with proper alignment
const createBilingualText = (arabicText: string, englishText: string, style: string, isValue = false) => ({
  table: {
    widths: ['50%', '50%'],
    body: [[
      {
        text: arabicText,
        style: style,
        alignment: 'right',
        font: 'Amiri'
      },
      {
        text: englishText,
        style: style,
        alignment: 'left'
      }
    ]]
  },
  layout: 'noBorders'
});

// Helper function to create section headers with proper spacing
const createSectionHeader = (arabicText: string, englishText: string) => ({
  table: {
    widths: ['*'],
    body: [[{
      table: {
        widths: ['50%', '50%'],
        body: [[
          {
            text: arabicText,
            style: 'sectionHeaderAr',
            alignment: 'right',
            font: 'Amiri'
          },
          {
            text: englishText,
            style: 'sectionHeaderEn',
            alignment: 'left'
          }
        ]]
      },
      layout: 'noBorders'
    }]]
  },
  layout: {
    hLineWidth: () => 2,
    vLineWidth: () => 0,
    hLineColor: () => colors.primary
  },
  margin: [0, 15, 0, 10]
});

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
  
  // Enhanced document definition with proper Arabic RTL support
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 70, 40, 80],
    
    // Header with improved bilingual layout
    header: {
      margin: [40, 20, 40, 0],
      table: {
        widths: ['*'],
        body: [[{
          table: {
            widths: ['50%', '50%'],
            body: [[
              {
                stack: [
                  { text: labels.companyName.ar, style: 'companyNameAr' },
                  { text: 'Commercial Registration: 146832', style: 'companyDetailsAr' }
                ],
                alignment: 'right'
              },
              {
                stack: [
                  { text: labels.companyName.en, style: 'companyNameEn' },
                  { text: 'Commercial Registration: 146832', style: 'companyDetailsEn' }
                ],
                alignment: 'left'
              }
            ]]
          },
          layout: 'noBorders'
        }]]
      },
      layout: 'noBorders'
    },
    
    // Footer with proper bilingual layout
    footer: (currentPage: number, pageCount: number) => ({
      margin: [40, 10, 40, 20],
      table: {
        widths: ['33%', '34%', '33%'],
        body: [[
          {
            text: labels.confidential.ar,
            style: 'footerText',
            alignment: 'right',
            font: 'Amiri'
          },
          {
            text: `${labels.pageOf.en} ${currentPage} of ${pageCount}`,
            style: 'footerText',
            alignment: 'center'
          },
          {
            text: `${labels.generatedOn.en}: ${currentDate}`,
            style: 'footerText',
            alignment: 'left'
          }
        ]]
      },
      layout: 'noBorders'
    }),
    
    // Main content with enhanced bilingual support
    content: [
      // Report title with proper bilingual layout
      {
        table: {
          widths: ['*'],
          body: [[{
            table: {
              widths: ['50%', '50%'],
              body: [[
                {
                  text: labels.reportTitle.ar,
                  style: 'reportTitleAr',
                  alignment: 'right',
                  font: 'Amiri'
                },
                {
                  text: labels.reportTitle.en,
                  style: 'reportTitleEn',
                  alignment: 'left'
                }
              ]]
            },
            layout: 'noBorders'
          }]]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          fillColor: () => colors.primary
        },
        margin: [0, 0, 0, 25]
      },
      
      // Agreement overview with improved spacing and alignment
      createSectionHeader(labels.agreementInfo.ar, labels.agreementInfo.en),
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            // Headers
            [
              createBilingualText(labels.agreementNumber.ar, labels.agreementNumber.en, 'cardLabel'),
              createBilingualText(labels.status.ar, labels.status.en, 'cardLabel'),
              createBilingualText(labels.duration.ar, labels.duration.en, 'cardLabel'),
              createBilingualText(labels.monthlyRent.ar, labels.monthlyRent.en, 'cardLabel')
            ],
            // Values
            [
              createBilingualText(
                agreement.agreement_number || prepareArabicForPDF('غير محدد'),
                agreement.agreement_number || 'Not specified',
                'cardValue',
                true
              ),
              createBilingualText(
                agreement.status || prepareArabicForPDF('غير محدد'),
                agreement.status || 'Not specified',
                'cardValue',
                true
              ),
              createBilingualText(
                agreement.start_date && agreement.end_date 
                  ? prepareArabicForPDF(`${Math.ceil((new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} شهر`)
                  : prepareArabicForPDF('غير محدد'),
                agreement.start_date && agreement.end_date 
                  ? `${Math.ceil((new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} months`
                  : 'Not specified',
                'cardValue',
                true
              ),
              createBilingualText(
                formatArabicCurrency(rentAmount),
                formatEnglishCurrency(rentAmount),
                'cardValue',
                true
              )
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 25]
      },
      
      // Customer and Vehicle Information with improved spacing
      {
        table: {
          widths: ['48%', '4%', '48%'],
          body: [[
            // Customer Information
            {
              stack: [
                createSectionHeader(labels.customerInfo.ar, labels.customerInfo.en),
                {
                  table: {
                    widths: ['50%', '50%'],
                    body: [
                      [
                        createBilingualText(labels.name.ar, labels.name.en, 'labelStyle'),
                        createBilingualText(
                          agreement.customers?.full_name || prepareArabicForPDF('غير محدد'),
                          agreement.customers?.full_name || 'Not specified',
                          'valueStyle',
                          true
                        )
                      ],
                      [
                        createBilingualText(labels.phone.ar, labels.phone.en, 'labelStyle'),
                        createBilingualText(
                          agreement.customers?.phone_number || prepareArabicForPDF('غير محدد'),
                          agreement.customers?.phone_number || 'Not specified',
                          'valueStyle',
                          true
                        )
                      ],
                      [
                        createBilingualText(labels.nationality.ar, labels.nationality.en, 'labelStyle'),
                        createBilingualText(
                          agreement.customers?.nationality || prepareArabicForPDF('غير محدد'),
                          agreement.customers?.nationality || 'Not specified',
                          'valueStyle',
                          true
                        )
                      ],
                      [
                        createBilingualText(labels.driverLicense.ar, labels.driverLicense.en, 'labelStyle'),
                        createBilingualText(
                          agreement.customers?.driver_license || prepareArabicForPDF('غير محدد'),
                          agreement.customers?.driver_license || 'Not specified',
                          'valueStyle',
                          true
                        )
                      ]
                    ]
                  },
                  layout: 'lightHorizontalLines'
                }
              ]
            },
            // Spacer
            { text: '' },
            // Vehicle Information
            {
              stack: [
                createSectionHeader(labels.vehicleInfo.ar, labels.vehicleInfo.en),
                {
                  table: {
                    widths: ['50%', '50%'],
                    body: [
                      [
                        createBilingualText(labels.makeModel.ar, labels.makeModel.en, 'labelStyle'),
                        createBilingualText(
                          `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || prepareArabicForPDF('غير محدد'),
                          `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'Not specified',
                          'valueStyle',
                          true
                        )
                      ],
                      [
                        createBilingualText(labels.year.ar, labels.year.en, 'labelStyle'),
                        createBilingualText(
                          agreement.vehicles?.year?.toString() || prepareArabicForPDF('غير محدد'),
                          agreement.vehicles?.year?.toString() || 'Not specified',
                          'valueStyle',
                          true
                        )
                      ],
                      [
                        createBilingualText(labels.licensePlate.ar, labels.licensePlate.en, 'labelStyle'),
                        createBilingualText(
                          agreement.vehicles?.license_plate || prepareArabicForPDF('غير محدد'),
                          agreement.vehicles?.license_plate || 'Not specified',
                          'valueStyle',
                          true
                        )
                      ],
                      [
                        createBilingualText(labels.vin.ar, labels.vin.en, 'labelStyle'),
                        createBilingualText(
                          agreement.vehicles?.vin || prepareArabicForPDF('غير محدد'),
                          agreement.vehicles?.vin || 'Not specified',
                          'valueStyle',
                          true
                        )
                      ]
                    ]
                  },
                  layout: 'lightHorizontalLines'
                }
              ]
            }
          ]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 25]
      },
      
      // Financial summary with improved layout
      createSectionHeader(labels.financialSummary.ar, labels.financialSummary.en),
      {
        table: {
          widths: ['20%', '20%', '20%', '20%', '20%'],
          body: [
            // Headers
            [
              createBilingualText(labels.contractTotal.ar, labels.contractTotal.en, 'metricLabel'),
              createBilingualText(labels.totalPaid.ar, labels.totalPaid.en, 'metricLabel'),
              createBilingualText(labels.remainingBalance.ar, labels.remainingBalance.en, 'metricLabel'),
              createBilingualText(labels.lateFees.ar, labels.lateFees.en, 'metricLabel'),
              createBilingualText(labels.paymentProgress.ar, labels.paymentProgress.en, 'metricLabel')
            ],
            // Values
            [
              createBilingualText(
                formatArabicCurrency(contractAmount),
                formatEnglishCurrency(contractAmount),
                'metricValue',
                true
              ),
              createBilingualText(
                formatArabicCurrency(metrics.totalPaid),
                formatEnglishCurrency(metrics.totalPaid),
                'metricValueSuccess',
                true
              ),
              createBilingualText(
                formatArabicCurrency(metrics.remainingBalance),
                formatEnglishCurrency(metrics.remainingBalance),
                metrics.remainingBalance > 0 ? 'metricValueWarning' : 'metricValueSuccess',
                true
              ),
              createBilingualText(
                formatArabicCurrency(metrics.totalLateFees),
                formatEnglishCurrency(metrics.totalLateFees),
                metrics.totalLateFees > 0 ? 'metricValueDanger' : 'metricValueSuccess',
                true
              ),
              createBilingualText(
                prepareArabicForPDF(`${Math.round(metrics.paymentProgress)}%`),
                `${Math.round(metrics.paymentProgress)}%`,
                'metricValuePrimary',
                true
              )
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        fillColor: colors.light,
        margin: [0, 0, 0, 25]
      },
      
      // Payment history with improved formatting (if payments exist)
      ...(payments.length > 0 ? [
        createSectionHeader(labels.paymentHistory.ar, labels.paymentHistory.en),
        {
          table: {
            headerRows: 1,
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              // Headers
              [
                createBilingualText(labels.paymentDate.ar, labels.paymentDate.en, 'tableHeader'),
                createBilingualText(labels.amount.ar, labels.amount.en, 'tableHeader'),
                createBilingualText(labels.paymentStatus.ar, labels.paymentStatus.en, 'tableHeader'),
                createBilingualText(labels.paymentMethod.ar, labels.paymentMethod.en, 'tableHeader')
              ],
              // Payment rows
              ...payments.slice(0, 10).map(payment => [
                createBilingualText(
                  formatArabicDate(payment.payment_date),
                  new Date(payment.payment_date).toLocaleDateString('en-US'),
                  'tableCell',
                  true
                ),
                createBilingualText(
                  formatArabicCurrency(payment.amount),
                  formatEnglishCurrency(payment.amount),
                  'tableCell',
                  true
                ),
                createBilingualText(
                  payment.status || prepareArabicForPDF('غير محدد'),
                  payment.status || 'Not specified',
                  'tableCell',
                  true
                ),
                createBilingualText(
                  payment.payment_method || prepareArabicForPDF('غير محدد'),
                  payment.payment_method || 'Not specified',
                  'tableCell',
                  true
                )
              ])
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 25]
        }
      ] : []),
      
      // Traffic fines with improved formatting (if fines exist)
      ...(trafficFines.length > 0 ? [
        createSectionHeader(labels.trafficFines.ar, labels.trafficFines.en),
        {
          table: {
            headerRows: 1,
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              // Headers
              [
                createBilingualText(labels.fineDate.ar, labels.fineDate.en, 'tableHeader'),
                createBilingualText(labels.fineAmount.ar, labels.fineAmount.en, 'tableHeader'),
                createBilingualText(labels.fineStatus.ar, labels.fineStatus.en, 'tableHeader'),
                createBilingualText(labels.fineLocation.ar, labels.fineLocation.en, 'tableHeader')
              ],
              // Fine rows
              ...trafficFines.map(fine => [
                createBilingualText(
                  formatArabicDate(fine.date),
                  new Date(fine.date).toLocaleDateString('en-US'),
                  'tableCell',
                  true
                ),
                createBilingualText(
                  formatArabicCurrency(fine.amount),
                  formatEnglishCurrency(fine.amount),
                  'tableCell',
                  true
                ),
                createBilingualText(
                  fine.status || prepareArabicForPDF('غير محدد'),
                  fine.status || 'Not specified',
                  'tableCell',
                  true
                ),
                createBilingualText(
                  fine.location || prepareArabicForPDF('غير محدد'),
                  fine.location || 'Not specified',
                  'tableCell',
                  true
                )
              ]),
              // Total row
              [
                { ...createBilingualText(labels.totalFines.ar, labels.totalFines.en, 'tableHeader'), colSpan: 3 },
                {},
                {},
                createBilingualText(
                  formatArabicCurrency(trafficFines.reduce((sum, f) => sum + (f.amount || 0), 0)),
                  formatEnglishCurrency(trafficFines.reduce((sum, f) => sum + (f.amount || 0), 0)),
                  'tableHeaderDanger',
                  true
                )
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 25]
        }
      ] : [])
    ],
    
    // Enhanced styles with proper hierarchy and spacing
    styles: {
      // Company styles
      companyNameAr: {
        fontSize: 16,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        margin: [0, 0, 0, 2]
      },
      companyNameEn: {
        fontSize: 16,
        bold: true,
        color: colors.primary,
        margin: [0, 0, 0, 2]
      },
      companyDetailsAr: {
        fontSize: 10,
        font: 'Amiri',
        color: colors.textLight
      },
      companyDetailsEn: {
        fontSize: 10,
        color: colors.textLight
      },
      
      // Report title styles
      reportTitleAr: {
        fontSize: 18,
        bold: true,
        font: 'Amiri',
        color: 'white',
        margin: [5, 12, 5, 12]
      },
      reportTitleEn: {
        fontSize: 18,
        bold: true,
        color: 'white',
        margin: [5, 12, 5, 12]
      },
      
      // Section header styles
      sectionHeaderAr: {
        fontSize: 14,
        bold: true,
        font: 'Amiri',
        color: colors.primary,
        margin: [5, 8, 5, 8]
      },
      sectionHeaderEn: {
        fontSize: 14,
        bold: true,
        color: colors.primary,
        margin: [5, 8, 5, 8]
      },
      
      // Card styles
      cardLabel: {
        fontSize: 10,
        bold: true,
        color: colors.textLight,
        margin: [2, 3, 2, 3]
      },
      cardValue: {
        fontSize: 11,
        bold: true,
        color: colors.text,
        margin: [2, 3, 2, 3]
      },
      
      // Label and value styles
      labelStyle: {
        fontSize: 10,
        bold: true,
        color: colors.textLight,
        margin: [3, 4, 3, 4]
      },
      valueStyle: {
        fontSize: 10,
        color: colors.text,
        margin: [3, 4, 3, 4]
      },
      
      // Metric styles
      metricLabel: {
        fontSize: 9,
        bold: true,
        color: colors.textLight,
        margin: [2, 3, 2, 3]
      },
      metricValue: {
        fontSize: 12,
        bold: true,
        color: colors.text,
        margin: [2, 3, 2, 3]
      },
      metricValueSuccess: {
        fontSize: 12,
        bold: true,
        color: colors.success,
        margin: [2, 3, 2, 3]
      },
      metricValueWarning: {
        fontSize: 12,
        bold: true,
        color: colors.warning,
        margin: [2, 3, 2, 3]
      },
      metricValueDanger: {
        fontSize: 12,
        bold: true,
        color: colors.danger,
        margin: [2, 3, 2, 3]
      },
      metricValuePrimary: {
        fontSize: 12,
        bold: true,
        color: colors.primary,
        margin: [2, 3, 2, 3]
      },
      
      // Table styles
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: colors.primary,
        fillColor: colors.lighter,
        margin: [3, 4, 3, 4]
      },
      tableHeaderDanger: {
        fontSize: 10,
        bold: true,
        color: colors.danger,
        fillColor: colors.lighter,
        margin: [3, 4, 3, 4]
      },
      tableCell: {
        fontSize: 9,
        color: colors.text,
        margin: [3, 4, 3, 4]
      },
      
      // Footer styles
      footerText: {
        fontSize: 8,
        color: colors.textLight,
        margin: [2, 2, 2, 2]
      }
    },
    
    defaultStyle: {
      fontSize: 11,
      lineHeight: 1.3
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
