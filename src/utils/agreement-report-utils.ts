import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import '../fonts/amiri-vfs.js';

pdfMake.vfs = (window as any).pdfMake ? (window as any).pdfMake.vfs : pdfMake.vfs;
pdfMake.fonts = {
  Amiri: {
    normal: 'Amiri-Regular.ttf',
    bold: 'Amiri-Bold.ttf',
    italics: 'Amiri-Slanted.ttf',
    bolditalics: 'Amiri-BoldSlanted.ttf'
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

export function generateAgreementReportPdfmake(
  agreement: any,
  rentAmount: any,
  contractAmount: any,
  payments: any[] = [],
  trafficFines: any[] = []
) {
  const docDefinition = {
    content: [
      { text: 'Rental Agreement Report', style: 'header', alignment: 'left', font: 'Amiri' },
      { text: 'تقرير عقد الإيجار', style: 'header', alignment: 'right', font: 'Amiri' },
      { text: `${labels.date.en}: ${new Date().toLocaleDateString()}  |  ${labels.date.ar}: ${new Date().toLocaleDateString()}`, alignment: 'center', margin: [0, 0, 0, 10], font: 'Amiri' },
      { text: labels.agreementInfo.en, style: 'subheader', alignment: 'left', font: 'Amiri' },
      { text: labels.agreementInfo.ar, style: 'subheader', alignment: 'right', font: 'Amiri' },
      {
        table: {
          widths: ['*', '*', '*', '*', '*', '*', '*', '*'],
          body: [
            [
              labels.agreementNumber.en, labels.status.en, labels.startDate.en, labels.endDate.en,
              labels.monthlyRent.en, labels.contractTotal.en, labels.depositAmount.en, labels.rentDueDay.en
            ],
            [
              agreement.agreement_number || '',
              agreement.status || '',
              agreement.start_date ? new Date(agreement.start_date).toLocaleDateString() : '',
              agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : '',
              rentAmount || '',
              contractAmount || agreement.total_amount || '',
              agreement.deposit_amount || '',
              agreement.rent_due_day || ''
            ]
          ]
        },
        margin: [0, 0, 0, 10],
        font: 'Amiri'
      },
      { text: labels.customerInfo.en, style: 'subheader', alignment: 'left', font: 'Amiri' },
      { text: labels.customerInfo.ar, style: 'subheader', alignment: 'right', font: 'Amiri' },
      {
        table: {
          widths: ['*', '*', '*', '*', '*', '*'],
          body: [
            [
              labels.name.en, labels.email.en, labels.phone.en, labels.driverLicense.en, labels.nationality.en, labels.address.en
            ],
            [
              agreement.customers?.full_name || '',
              agreement.customers?.email || '',
              agreement.customers?.phone_number || '',
              agreement.customers?.driver_license || '',
              agreement.customers?.nationality || '',
              agreement.customers?.address || ''
            ]
          ]
        },
        margin: [0, 0, 0, 10],
        font: 'Amiri'
      },
      { text: labels.vehicleInfo.en, style: 'subheader', alignment: 'left', font: 'Amiri' },
      { text: labels.vehicleInfo.ar, style: 'subheader', alignment: 'right', font: 'Amiri' },
      {
        table: {
          widths: ['*', '*', '*', '*', '*'],
          body: [
            [
              labels.makeModel.en, labels.year.en, labels.licensePlate.en, labels.color.en, labels.vin.en
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
        margin: [0, 0, 0, 10],
        font: 'Amiri'
      },
      { text: labels.paymentSummary.en, style: 'subheader', alignment: 'left', font: 'Amiri' },
      { text: labels.paymentSummary.ar, style: 'subheader', alignment: 'right', font: 'Amiri' },
      {
        table: {
          widths: ['*', '*', '*', '*', '*'],
          body: [
            [
              labels.totalPaid.en, labels.lateFees.en, labels.remainingBalance.en, labels.pendingPayments.en, labels.nextPaymentDue.en
            ],
            [
              payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount_paid || p.amount || 0), 0),
              payments.reduce((sum, p) => sum + (p.late_fine_amount || 0), 0),
              (contractAmount || agreement.total_amount || 0) - payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount_paid || p.amount || 0), 0),
              payments.filter(p => p.status === 'pending' || p.status === 'partially_paid').reduce((sum, p) => sum + (p.amount || 0), 0),
              agreement.next_payment_date ? new Date(agreement.next_payment_date).toLocaleDateString() : ''
            ]
          ]
        },
        margin: [0, 0, 0, 10],
        font: 'Amiri'
      },
      { text: labels.trafficFines.en, style: 'subheader', alignment: 'left', font: 'Amiri' },
      { text: labels.trafficFines.ar, style: 'subheader', alignment: 'right', font: 'Amiri' },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            [labels.date.en, labels.date.ar, 'Amount', 'Status'],
            ...trafficFines.map(fine => [
              fine.date ? new Date(fine.date).toLocaleDateString() : '',
              fine.date ? new Date(fine.date).toLocaleDateString() : '',
              fine.amount || '',
              fine.status || ''
            ])
          ]
        },
        margin: [0, 0, 0, 10],
        font: 'Amiri'
      },
      { text: labels.signature.en, style: 'subheader', alignment: 'left', font: 'Amiri' },
      { text: labels.signature.ar, style: 'subheader', alignment: 'right', font: 'Amiri' },
      {
        columns: [
          { text: '_________________________', width: '50%', font: 'Amiri' },
          { text: '_________________________', width: '50%', alignment: 'right', font: 'Amiri' }
        ]
      },
      {
        columns: [
          { text: `${labels.name.en} / ${labels.name.ar}`, width: '50%', font: 'Amiri' },
          { text: `${labels.date.en} / ${labels.date.ar}`, width: '50%', alignment: 'right', font: 'Amiri' }
        ]
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 14, bold: true },
    },
    defaultStyle: {
      font: 'Amiri',
      fontSize: 12
    }
  };

  pdfMake.createPdf(docDefinition).download(`agreement-report-${agreement.agreement_number || ''}.pdf`);
}
