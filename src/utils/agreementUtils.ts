import { Agreement } from '@/types/agreement';
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
      console.warn('Font initialization failed, using built-in fonts');
      configurePdfMakeFonts();
    }
  } catch (error) {
    console.warn('Font loading failed, using built-in fonts:', error);
  }
}

// Arabic labels for vehicle rental contract
const contractLabels = {
  // Header
  contractTitle: { ar: 'عقد إيجار مركبة' },
  companyName: { ar: 'شركة العراف لتأجير السيارات ذ.م.م' },
  
  // Parties
  firstParty: { ar: 'الطرف الأول (المؤجر)' },
  secondParty: { ar: 'الطرف الثاني (المستأجر)' },
  
  // Agreement details
  agreementNumber: { ar: 'رقم العقد' },
  contractDate: { ar: 'تاريخ العقد' },
  startDate: { ar: 'تاريخ البدء' },
  endDate: { ar: 'تاريخ الانتهاء' },
  duration: { ar: 'مدة الإيجار' },
  
  // Customer information
  customerName: { ar: 'اسم المستأجر' },
  nationality: { ar: 'الجنسية' },
  idNumber: { ar: 'رقم الهوية' },
  phoneNumber: { ar: 'رقم الهاتف' },
  email: { ar: 'البريد الإلكتروني' },
  
  // Vehicle information
  vehicleDetails: { ar: 'تفاصيل المركبة' },
  make: { ar: 'الماركة' },
  model: { ar: 'الموديل' },
  year: { ar: 'سنة الصنع' },
  licensePlate: { ar: 'رقم اللوحة' },
  color: { ar: 'اللون' },
  vinNumber: { ar: 'رقم الهيكل' },
  
  // Financial terms
  financialTerms: { ar: 'الشروط المالية' },
  monthlyRent: { ar: 'الإيجار الشهري' },
  totalAmount: { ar: 'المبلغ الإجمالي' },
  depositAmount: { ar: 'مبلغ الضمان' },
  paymentDay: { ar: 'يوم الدفع' },
  
  // Terms and conditions
  termsConditions: { ar: 'الشروط والأحكام' },
  term1: { ar: '1. يلتزم المستأجر بدفع الإيجار الشهري في التاريخ المحدد.' },
  term2: { ar: '2. يحق للمؤجر استرداد المركبة في حالة عدم الدفع.' },
  term3: { ar: '3. المستأجر مسؤول عن أي أضرار تلحق بالمركبة.' },
  term4: { ar: '4. يجب إرجاع المركبة بنفس الحالة التي تم تسليمها بها.' },
  term5: { ar: '5. أي مخالفات مرورية تقع على عهدة المستأجر.' },
  term6: { ar: '6. يحق للمؤجر فسخ العقد في حالة مخالفة أي من هذه الشروط.' },
  
  // Signatures
  signatures: { ar: 'التوقيعات' },
  firstPartySignature: { ar: 'توقيع الطرف الأول' },
  secondPartySignature: { ar: 'توقيع الطرف الثاني' },
  date: { ar: 'التاريخ' },
  
  // Footer
  legalNotice: { ar: 'هذا العقد محرر باللغة العربية ويخضع للقوانين المعمول بها في دولة قطر' }
};

// Enhanced color scheme for official documents
const colors = {
  primary: '#1e40af',      // Professional blue
  secondary: '#64748b',    // Slate gray
  accent: '#0ea5e9',       // Sky blue
  text: '#334155',         // Dark gray
  textLight: '#64748b',    // Light text
  border: '#e2e8f0',       // Border gray
  light: '#f8fafc',        // Very light gray
  lighter: '#f1f5f9'       // Light gray
};

// Helper function to format date as dd/mm/yyyy in Arabic
function formatDateArabic(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to calculate duration in months
function calculateDurationMonths(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

export async function generatePdfDocument(agreement: Agreement): Promise<boolean> {
  try {
    await ensureFontsLoaded();
    
    const currentDate = new Date();
    const startDate = new Date(agreement.start_date);
    const endDate = new Date(agreement.end_date);
    const duration = calculateDurationMonths(startDate, endDate);
    
    // Enhanced document definition for Arabic vehicle rental contract
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [50, 80, 50, 100],
      
      // Header with company branding
      header: {
        margin: [50, 30, 50, 0],
        table: {
          widths: ['*'],
          body: [[
            {
              stack: [
                {
                  text: contractLabels.companyName.ar,
                  style: 'companyName',
                  alignment: 'center',
                  margin: [0, 0, 0, 5]
                },
                {
                  text: contractLabels.contractTitle.ar,
                  style: 'contractTitle',
                  alignment: 'center',
                  margin: [0, 0, 0, 10]
                }
              ],
              fillColor: colors.lighter,
              border: [false, false, false, true],
              borderColor: [colors.primary, colors.primary, colors.primary, colors.primary]
            }
          ]]
        },
        layout: 'noBorders'
      },
      
      // Footer with legal notice
      footer: (currentPage: number, pageCount: number) => {
        return {
          margin: [50, 20, 50, 30],
          table: {
            widths: ['*'],
            body: [[
              {
                stack: [
                  {
                    text: contractLabels.legalNotice.ar,
                    style: 'legalNotice',
                    alignment: 'center',
                    margin: [0, 0, 0, 5]
                  },
                  {
                    text: `صفحة ${currentPage} من ${pageCount}`,
                    style: 'pageNumber',
                    alignment: 'center'
                  }
                ]
              }
            ]]
          },
          layout: 'noBorders'
        };
      },
      
      // Main content
      content: [
        // Contract header information
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                createArabicTextBlock(`${contractLabels.agreementNumber.ar}: ${agreement.agreement_number || 'غير محدد'}`, 'contractInfo'),
                createArabicTextBlock(`${contractLabels.contractDate.ar}: ${formatDateArabic(currentDate)}`, 'contractInfo')
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 20, 0, 20]
        },
        
        // Parties section
        {
          text: contractLabels.firstParty.ar,
          style: 'sectionHeader',
          margin: [0, 20, 0, 10]
        },
        {
          text: contractLabels.companyName.ar,
          style: 'partyInfo',
          margin: [20, 0, 0, 15]
        },
        
        {
          text: contractLabels.secondParty.ar,
          style: 'sectionHeader',
          margin: [0, 10, 0, 10]
        },
        
        // Customer information table
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              [
                createArabicTextBlock(contractLabels.customerName.ar, 'labelStyle'),
                createArabicTextBlock(agreement.customers?.full_name || 'غير محدد', 'valueStyle')
              ],
              [
                createArabicTextBlock(contractLabels.nationality.ar, 'labelStyle'),
                createArabicTextBlock(agreement.customers?.nationality || 'غير محدد', 'valueStyle')
              ],
              [
                createArabicTextBlock(contractLabels.idNumber.ar, 'labelStyle'),
                createArabicTextBlock(agreement.customers?.driver_license || 'غير محدد', 'valueStyle')
              ],
              [
                createArabicTextBlock(contractLabels.phoneNumber.ar, 'labelStyle'),
                createArabicTextBlock(agreement.customers?.phone_number || 'غير محدد', 'valueStyle')
              ],
              [
                createArabicTextBlock(contractLabels.email.ar, 'labelStyle'),
                createArabicTextBlock(agreement.customers?.email || 'غير محدد', 'valueStyle')
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },
        
        // Vehicle details section
        {
          text: contractLabels.vehicleDetails.ar,
          style: 'sectionHeader',
          margin: [0, 20, 0, 10]
        },
        
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              [
                createArabicTextBlock(contractLabels.make.ar, 'labelStyle'),
                createArabicTextBlock(agreement.vehicles?.make || 'غير محدد', 'valueStyle')
              ],
              [
                createArabicTextBlock(contractLabels.model.ar, 'labelStyle'),
                createArabicTextBlock(agreement.vehicles?.model || 'غير محدد', 'valueStyle')
              ],
              [
                createArabicTextBlock(contractLabels.year.ar, 'labelStyle'),
                createArabicTextBlock(agreement.vehicles?.year?.toString() || 'غير محدد', 'valueStyle')
              ],
              [
                createArabicTextBlock(contractLabels.licensePlate.ar, 'labelStyle'),
                createArabicTextBlock(agreement.vehicles?.license_plate || 'غير محدد', 'valueStyle')
              ],
              [
                createArabicTextBlock(contractLabels.color.ar, 'labelStyle'),
                createArabicTextBlock(agreement.vehicles?.color || 'غير محدد', 'valueStyle')
              ],
              [
                createArabicTextBlock(contractLabels.vinNumber.ar, 'labelStyle'),
                createArabicTextBlock(agreement.vehicles?.vin || 'غير محدد', 'valueStyle')
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },
        
        // Contract terms section
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                createArabicTextBlock(`${contractLabels.startDate.ar}: ${formatDateArabic(agreement.start_date)}`, 'contractTerms'),
                createArabicTextBlock(`${contractLabels.endDate.ar}: ${formatDateArabic(agreement.end_date)}`, 'contractTerms')
              ],
              [
                createArabicTextBlock(`${contractLabels.duration.ar}: ${duration} شهر`, 'contractTerms'),
                createArabicTextBlock(`${contractLabels.paymentDay.ar}: ${agreement.rent_due_day || 1}`, 'contractTerms')
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 20, 0, 20]
        },
        
        // Financial terms section
        {
          text: contractLabels.financialTerms.ar,
          style: 'sectionHeader',
          margin: [0, 20, 0, 10]
        },
        
        {
          table: {
            widths: ['40%', '60%'],
            body: [
              [
                createArabicTextBlock(contractLabels.monthlyRent.ar, 'labelStyle'),
                createArabicTextBlock(formatArabicCurrency(agreement.rent_amount), 'financialValue')
              ],
              [
                createArabicTextBlock(contractLabels.totalAmount.ar, 'labelStyle'),
                createArabicTextBlock(formatArabicCurrency(agreement.total_amount), 'financialValue')
              ],
              [
                createArabicTextBlock(contractLabels.depositAmount.ar, 'labelStyle'),
                createArabicTextBlock(formatArabicCurrency(agreement.deposit_amount), 'financialValue')
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 30]
        },
        
        // Terms and conditions
        {
          text: contractLabels.termsConditions.ar,
          style: 'sectionHeader',
          margin: [0, 20, 0, 15]
        },
        
        {
          stack: [
            createArabicTextBlock(contractLabels.term1.ar, 'termText'),
            createArabicTextBlock(contractLabels.term2.ar, 'termText'),
            createArabicTextBlock(contractLabels.term3.ar, 'termText'),
            createArabicTextBlock(contractLabels.term4.ar, 'termText'),
            createArabicTextBlock(contractLabels.term5.ar, 'termText'),
            createArabicTextBlock(contractLabels.term6.ar, 'termText')
          ],
          margin: [0, 0, 0, 40]
        },
        
        // Signatures section
        {
          text: contractLabels.signatures.ar,
          style: 'sectionHeader',
          margin: [0, 30, 0, 20]
        },
        
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  stack: [
                    createArabicTextBlock(contractLabels.firstPartySignature.ar, 'signatureLabel'),
                    { text: '', margin: [0, 30, 0, 0] }, // Space for signature
                    { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                    createArabicTextBlock(`${contractLabels.date.ar}: _______________`, 'signatureDate')
                  ]
                },
                {
                  stack: [
                    createArabicTextBlock(contractLabels.secondPartySignature.ar, 'signatureLabel'),
                    { text: '', margin: [0, 30, 0, 0] }, // Space for signature
                    { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                    createArabicTextBlock(`${contractLabels.date.ar}: _______________`, 'signatureDate')
                  ]
                }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        }
      ],
      
      // Enhanced styles for Arabic legal document using built-in fonts
      styles: {
        companyName: {
          fontSize: 18,
          color: colors.primary,
          alignment: 'center',
          font: 'Helvetica'
        },
        contractTitle: {
          fontSize: 16,
          color: colors.text,
          alignment: 'center',
          font: 'Helvetica'
        },
        contractInfo: {
          fontSize: 11,
          color: colors.text,
          alignment: 'right',
          font: 'Helvetica'
        },
        sectionHeader: {
          fontSize: 14,
          color: colors.primary,
          alignment: 'right',
          font: 'Helvetica'
        },
        partyInfo: {
          fontSize: 12,
          color: colors.text,
          alignment: 'right',
          font: 'Helvetica'
        },
        labelStyle: {
          fontSize: 11,
          color: colors.textLight,
          alignment: 'right',
          font: 'Helvetica'
        },
        valueStyle: {
          fontSize: 11,
          color: colors.text,
          alignment: 'right',
          font: 'Helvetica'
        },
        contractTerms: {
          fontSize: 11,
          color: colors.text,
          alignment: 'right',
          font: 'Helvetica'
        },
        financialValue: {
          fontSize: 12,
          color: colors.primary,
          alignment: 'right',
          font: 'Helvetica'
        },
        termText: {
          fontSize: 10,
          color: colors.text,
          alignment: 'right',
          margin: [0, 0, 0, 8],
          font: 'Helvetica'
        },
        signatureLabel: {
          fontSize: 11,
          color: colors.text,
          alignment: 'center',
          font: 'Helvetica'
        },
        signatureDate: {
          fontSize: 10,
          color: colors.textLight,
          alignment: 'center',
          font: 'Helvetica'
        },
        legalNotice: {
          fontSize: 8,
          color: colors.textLight,
          alignment: 'center',
          font: 'Helvetica'
        },
        pageNumber: {
          fontSize: 8,
          color: colors.textLight,
          alignment: 'center',
          font: 'Helvetica'
        }
      },
      
      // Updated defaultStyle to use built-in fonts
      defaultStyle: {
        fontSize: 11,
        rtl: true,
        alignment: 'right',
        font: 'Helvetica'
      }
    };

    // Generate and download the PDF
    const fileName = prepareArabicForPDF(`عقد-إيجار-مركبة-${agreement.agreement_number || 'غير-محدد'}.pdf`);
    pdfMake.createPdf(docDefinition).download(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating Arabic vehicle rental contract PDF:', error);
    return false;
  }
}
