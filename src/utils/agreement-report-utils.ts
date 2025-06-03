import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';

// Helper to dynamically load a script
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// Ensure both Amiri font files are loaded and vfs is merged
export async function ensureFontsLoaded() {
  (pdfMake as any).fonts = {
    Amiri: {
      normal: 'Amiri-Regular.ttf',
      bold: 'Amiri-Bold.ttf',
      italics: 'Amiri-Regular.ttf',
      bolditalics: 'Amiri-Bold.ttf',
    },
  };
}

pdfMake.fonts = {
  Amiri: {
    normal: 'Amiri-normal.ttf',
    bold: 'Amiri-Bold.ttf',
    italics: 'Amiri-normal.ttf', // fallback to normal
    bolditalics: 'Amiri-Bold.ttf', // fallback to bold
  }
};

const labels = {
  agreementInfo: { en: 'Agreement Information', ar: 'معلومات العقد' },
  agreementNumber: { en: 'Agreement Number', ar: 'رقم العقد' },
  status: { en: 'Status', ar: 'الحالة' },
  startDate: { en: 'Start Date', ar: 'تاريخ البدء' },
  endDate: { en: 'End Date', ar: 'تاريخ الانتهاء' },
  monthlyRent: { en: 'Monthly Rent', ar: 'الإيجار الشهري' },
  contractTotal: { en: 'Contract Total', ar: 'إجمالي العقد' },
  depositAmount: { en: 'Deposit Amount', ar: 'مبلغ التأمين' },
  rentDueDay: { en: 'Rent Due Day', ar: 'يوم استحقاق الإيجار' },
  customerInfo: { en: 'Customer Information', ar: 'معلومات العميل' },
  name: { en: 'Name', ar: 'الاسم' },
  email: { en: 'Email', ar: 'البريد الإلكتروني' },
  phone: { en: 'Phone', ar: 'رقم الهاتف' },
  driverLicense: { en: 'Driver License', ar: 'رخصة القيادة' },
  nationality: { en: 'Nationality', ar: 'الجنسية' },
  address: { en: 'Address', ar: 'العنوان' },
  vehicleInfo: { en: 'Vehicle Information', ar: 'معلومات السيارة' },
  makeModel: { en: 'Make/Model', ar: 'الماركة/الموديل' },
  year: { en: 'Year', ar: 'السنة' },
  licensePlate: { en: 'License Plate', ar: 'رقم اللوحة' },
  color: { en: 'Color', ar: 'اللون' },
  vin: { en: 'VIN', ar: 'رقم الهيكل' },
  paymentSummary: { en: 'Payment Summary', ar: 'ملخص الدفعات' },
  totalPaid: { en: 'Total Paid', ar: 'إجمالي المدفوع' },
  lateFees: { en: 'Late Fees', ar: 'رسوم التأخير' },
  remainingBalance: { en: 'Remaining Balance', ar: 'الرصيد المتبقي' },
  pendingPayments: { en: 'Pending Payments', ar: 'الدفعات المعلقة' },
  nextPaymentDue: { en: 'Next Payment Due', ar: 'تاريخ الدفعة القادمة' },
  trafficFines: { en: 'Traffic Fines', ar: 'المخالفات المرورية' },
  signature: { en: 'Signature', ar: 'التوقيع' },
  date: { en: 'Date', ar: 'التاريخ' },
};

export async function generateAgreementReportPdfmake(
  agreement: any,
  rentAmount: any,
  contractAmount: any,
  payments: any[] = [],
  trafficFines: any[] = []
) {
  await ensureFontsLoaded();
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      { text: 'تقرير عقد الإيجار', style: 'headerAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0, 0, 0, 8] },
      { text: `${labels.date.ar}: ${new Date().toLocaleDateString()}`, alignment: 'right', font: 'Amiri', rtl: true, margin: [0, 0, 0, 10] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#eee' }] },
      { text: labels.agreementInfo.ar, style: 'sectionAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0, 10, 0, 2] },
      {
        table: {
          headerRows: 1,
          widths: [80, 80, 80, 80],
          body: [
            [
              { text: labels.agreementNumber.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0,0,4,0] },
              { text: labels.startDate.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true },
              { text: labels.endDate.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true },
              { text: labels.contractTotal.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true }
            ],
            [
              agreement.agreement_number || '',
              agreement.start_date ? new Date(agreement.start_date).toLocaleDateString() : '',
              agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : '',
              contractAmount || agreement.total_amount || ''
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10],
        fontSize: 11
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#eee' }] },
      { text: labels.customerInfo.ar, style: 'sectionAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0, 10, 0, 2] },
      {
        table: {
          headerRows: 1,
          widths: [120, 120, 120],
          body: [
            [
              { text: labels.name.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0,0,4,0] },
              { text: labels.phone.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true },
              { text: labels.nationality.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true }
            ],
            [
              agreement.customers?.full_name || '',
              agreement.customers?.phone_number || '',
              agreement.customers?.nationality || ''
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10],
        fontSize: 11
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#eee' }] },
      { text: labels.vehicleInfo.ar, style: 'sectionAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0, 10, 0, 2] },
      {
        table: {
          headerRows: 1,
          widths: [99, 99, 99, 99, 99],
          body: [
            [
              { text: labels.makeModel.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0,0,4,0] },
              { text: labels.year.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true },
              { text: labels.licensePlate.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true },
              { text: labels.color.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true },
              { text: labels.vin.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true }
            ],
            [
              `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim(),
              agreement.vehicles?.year || '',
              agreement.vehicles?.license_plate || '',
              agreement.vehicles?.color || '',
              agreement.vehicles?.vin || ''
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10],
        fontSize: 11
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#eee' }] },
      { text: labels.paymentSummary.ar, style: 'sectionAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0, 10, 0, 2] },
      {
        table: {
          headerRows: 1,
          widths: [150, 150, 150],
          body: [
            [
              { text: labels.lateFees.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0,0,4,0] },
              { text: labels.pendingPayments.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true },
              { text: labels.nextPaymentDue.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true }
            ],
            [
              payments.reduce((sum, p) => sum + (p.late_fine_amount || 0), 0),
              payments.filter(p => p.status === 'pending' || p.status === 'partially_paid').reduce((sum, p) => sum + (p.amount || 0), 0),
              agreement.next_payment_date ? new Date(agreement.next_payment_date).toLocaleDateString() : ''
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10],
        fontSize: 11
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#eee' }] },
      { text: labels.trafficFines.ar, style: 'sectionAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0, 10, 0, 2] },
      {
        table: {
          headerRows: 1,
          widths: [125, 125, 125, 124],
          body: [
            [
              { text: labels.date.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0,0,4,0] },
              { text: 'المبلغ', style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true },
              { text: 'الحالة', style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true },
              { text: labels.date.ar, style: 'tableHeaderAr', alignment: 'right', font: 'Amiri', rtl: true }
            ],
            ...trafficFines.map(fine => [
              fine.date ? new Date(fine.date).toLocaleDateString() : '',
              fine.amount || '',
              fine.status || '',
              fine.date ? new Date(fine.date).toLocaleDateString() : ''
            ])
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10],
        fontSize: 11
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#eee' }] },
      { text: labels.signature.ar, style: 'sectionAr', alignment: 'right', font: 'Amiri', rtl: true, margin: [0, 10, 0, 2] },
      {
        columns: [
          { text: '_________________________', width: '50%', alignment: 'right', font: 'Amiri' },
          { text: '_________________________', width: '50%', alignment: 'right', font: 'Amiri' }
        ]
      },
      {
        columns: [
          { text: `${labels.name.ar}`, width: '50%', alignment: 'right', font: 'Amiri' },
          { text: `${labels.date.ar}`, width: '50%', alignment: 'right', font: 'Amiri' }
        ]
      }
    ],
    styles: {
      headerAr: { fontSize: 18, bold: true, font: 'Amiri', alignment: 'right', rtl: true, margin: [0, 0, 0, 8] },
      sectionAr: { fontSize: 14, bold: true, font: 'Amiri', color: '#333', rtl: true, alignment: 'right', margin: [0, 10, 0, 2] },
      tableHeaderAr: { fontSize: 12, bold: true, fillColor: '#f5f5f5', font: 'Amiri', rtl: true, alignment: 'right' },
    },
    defaultStyle: {
      font: 'Amiri',
      fontSize: 12
    }
  };

  pdfMake.createPdf(docDefinition).download(`agreement-report-${agreement.agreement_number || ''}.pdf`);
}
