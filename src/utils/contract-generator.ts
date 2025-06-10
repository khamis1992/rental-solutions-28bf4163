
import pdfMake from 'pdfmake/build/pdfmake';
import { Agreement } from '@/types/agreement';
import { prepareArabicForPDF, formatArabicDate } from './arabic-text-utils';

// Configure basic fonts for PDF generation
const configureFonts = () => {
  // Use system fonts or basic fallback
  (pdfMake as any).fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };
};

// Format currency in Arabic style
const formatArabicCurrency = (amount: number | null | undefined): string => {
  if (!amount && amount !== 0) return 'غير محدد';
  return `${amount.toLocaleString()} ريال قطري`;
};

// Calculate contract duration in months
const calculateDurationMonths = (startDate: string | Date, endDate: string | Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
};

export async function generateArabicContractPdf(agreement: Agreement): Promise<void> {
  try {
    configureFonts();

    // Prepare contract data with fallbacks
    const contractData = {
      contractNumber: agreement.agreement_number || 'غير محدد',
      startDate: formatArabicDate(agreement.start_date),
      customerName: agreement.customers?.full_name || 'غير محدد',
      driverLicense: agreement.customers?.driver_license || 'غير محدد',
      nationality: agreement.customers?.nationality || 'غير محدد',
      phoneNumber: agreement.customers?.phone_number || 'غير محدد',
      contractDuration: `${calculateDurationMonths(agreement.start_date, agreement.end_date)} شهر`,
      monthlyRent: formatArabicCurrency(agreement.rent_amount),
      lateFee: formatArabicCurrency(agreement.daily_late_fee || 120),
      depositAmount: formatArabicCurrency(agreement.deposit_amount),
      vehicleType: `${agreement.vehicles?.make || 'غير محدد'} - ${agreement.vehicles?.model || 'غير محدد'}`,
      licensePlate: agreement.vehicles?.license_plate || 'غير محدد',
      chassisNumber: agreement.vehicles?.vin || 'غير محدد',
      vehicleModel: agreement.vehicles?.model || 'غير محدد'
    };

    // Full Arabic contract text with dynamic replacements
    const contractText = `
رقم العقد ${contractData.contractNumber}

عقد ايجار مركبة

تم تحرير عقد ايجار مركبة هذا ("العقد") وجرى تنفيذه اعتبارا من تاريخ ${contractData.startDate}

بين كل من:

الطرف الأول: شركة العراف لتاجير السيارات ذ م م، وهي شركة محدودة المسؤولية مسجلة اصولا طبقا لقوانين دولة قطر، سجل تجاري رقم 146832 ومقرها الكائن في منطقة ام صلال علي، الدوحة، قطر، ص ب 36126.

ويمثلها قانونا السيد/ خميس هاشم الجبر بصفته المدير المخول بالتوقيع للشركة، ويشار اليه لاحقا بلفظ المؤجر | الطرف الاول

و

الطرف الثاني: ${contractData.customerName}، ${contractData.driverLicense}، ${contractData.nationality}، ومقيم في دولة قطر، ${contractData.phoneNumber}.

مستأجر | الطرف ثاني

يشار الى كل منهما منفردين بلفظ "الطرف" ومجتمعين بلفظ "الأطراف"

مقدمة

حيث ان الطرف الأول هو شركة تأجير سيارات مرخصة اصولا وتمتلك المركبة المبينة نوعا وماركة وطرازا و رقم شاسيه ادناه
ولما كان الطرف الثاني يرغب في التعامل مع الطرف الأول على هذا الأساس وذلك لاستئجار المركبة المذكورة وفق نظام الايجار طبقاً للوائح الشركة وقانون دولة قطر.
ولما كان الطرف الأول قد وافق على تأجير الطرف الثاني المركبة المذكورة وفق نظام الايجار المبين وطبقا للشروط والاحكام الواردة ادناه،
لذلك، فقد اتفق الطرفان بعد ان قرروا بأهليتهم للتعاقد بصفتهم ومع الاخذ بعين الاعتبار للوعود والعهود المتبادلة بينهما على الاتي:

مادة 1

يعتبر التمهيد السابق جزأ لا يتجزأ من هذا العقد ويفسر ضمن بنوده وشروطه.

مادة 2 - بيانات المركبة

يؤجر الطرف الأول بموجب هذا العقد الطرف الثاني القابل لذلك المركبة التالية:
النوع: ${contractData.vehicleType}
رقم اللوحة: ${contractData.licensePlate}
رقم القاعدة: ${contractData.chassisNumber}
نوع المركبة: ${contractData.vehicleModel}

مادة 3 - مدة الايجار

اتفق الطرفان على ان تكون مدة هذا العقد ${contractData.contractDuration} تبدأ اعتبارا من تاريخ النفاذ المذكور في بداية هذا العقد، غير قابل للتجديد وينتهي العقد بانتهاء مدته كما لا يجوز للطرف الثاني ان ينهي العقد قبل انتهاء مدته الا بموافقة كتابية من الطرف الأول.

مادة 4 - قيمة الايجار

يدفع الطرف الثاني للطرف الأول قيمة ايجارية مبلغ وقدره ${contractData.monthlyRent} شهريا طبقا لجدول الدفعات المرفق بهذا العقد.
يلتزم الطرف الثاني بسداد كامل دفعات الايجار المحددة شهريا وبصورة منتظمة ولا يجوز له خصم أي مبلغ منها مقابل رسوم او ضرائب او غير ذلك.

مادة 5 - غرامات التأخير

يكون الدفع في أول يوم من كل شهر و في حال التأخير عن سداد القيمة الإيجارية او في حال تخلف الطرف الثاني عن سداد أي من الدفعات الشهرية المستحقة لاي سبب كان تطبق على الطرف الثاني دون حاجة الى اعذار او انذار من قبل الطرف الأول غرامة تأخير مبلغ قدره ${contractData.lateFee} عن كل يوم تأخير من تاريخ الاستحقاق حتى تاريخ سداد المتأخرات وتدفع المتأخرات مع الغرامات على حد سواء.

مادة 6 - وديعة الضمان

يلتزم الطرف الثاني عند التوقيع على هذا العقد ان يسلم الطرف الأول قيمة ${contractData.depositAmount} ضمان ("وديعة الضمان") وذلك لضمان تنفيذ الطرف الثاني لالتزاماته بموجب هذا العقد ولتعويض الطرف الأول عن اية خسائر او اضرار قد يتسبب بها الطرف الثاني او وكلائه او ممثليه للمركبة طوال مدة هذا العقد. بالإضافة الى ذلك، يحق للطرف الأول ان يخصم من وديعة الضمان اية مبالغ يدين بها الطرف الثاني للطرف الأول بموجب هذا العقد ولا يمكن استرجاع مبلغ الضمان بعد إنهاء العقد من قبل الطرف الثاني.
`;

    // Create PDF document definition
    const docDefinition = {
      content: [
        {
          text: prepareArabicForPDF(contractText),
          style: 'arabicText',
          alignment: 'right'
        }
      ],
      styles: {
        arabicText: {
          fontSize: 12,
          lineHeight: 1.5,
          alignment: 'right'
        }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 12,
        alignment: 'right'
      }
    };

    // Generate and download PDF
    const fileName = `contract-${contractData.contractNumber}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);

  } catch (error) {
    console.error('Error generating contract PDF:', error);
    throw new Error('Failed to generate contract PDF');
  }
}
