import { Agreement } from '@/types/agreement';
import pdfMake from 'pdfmake/build/pdfmake';
import { toast } from 'sonner';
import { prepareArabicForPDF, formatArabicDate, formatArabicCurrency } from './arabic-text-utils';

// Ultra-simple text processing - no special characters or bidirectional text
function cleanText(text: string | undefined | null): string {
  if (!text) return 'Not specified';
  
  // Convert to string and remove any problematic characters
  return String(text)
    .replace(/[^\u0020-\u007E\u0600-\u06FF]/g, '') // Keep only basic Latin and Arabic
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim() || 'Not specified';
}

// Simple currency formatting
function formatCurrency(amount: number | undefined | null): string {
  if (!amount && amount !== 0) return 'Not specified';
  try {
    return `${amount.toFixed(2)} QAR`;
  } catch {
    return 'Not specified';
  }
}

// Simple date formatting
function formatDate(date: string | Date | undefined): string {
  if (!date) return 'Not specified';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Not specified';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'Not specified';
  }
}

// Create ultra-simple document structure
function createUltraSimpleDocument(agreement: Agreement) {
  // Extract data safely
  const data = {
    agreementNumber: cleanText(agreement.agreement_number),
    customerName: cleanText(agreement.customers?.full_name),
    customerPhone: cleanText(agreement.customers?.phone_number),
    vehicleMake: cleanText(agreement.vehicles?.make),
    vehicleModel: cleanText(agreement.vehicles?.model),
    vehicleYear: cleanText(agreement.vehicles?.year?.toString()),
    licensePlate: cleanText(agreement.vehicles?.license_plate),
    startDate: formatDate(agreement.start_date),
    endDate: formatDate(agreement.end_date),
    monthlyRent: formatCurrency(agreement.rent_amount),
    totalAmount: formatCurrency(agreement.total_amount),
    depositAmount: formatCurrency(agreement.deposit_amount),
    currentDate: formatDate(new Date())
  };

  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    content: [
      // Simple header
      { text: 'Al Aaraf Car Rental Company L.L.C', fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'Doha - Qatar', fontSize: 10, alignment: 'center', margin: [0, 0, 0, 20] },
      
      // Title
      { text: 'Vehicle Rental Agreement', fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      
      // Agreement info
      { text: `Agreement Number: ${data.agreementNumber}`, fontSize: 10, margin: [0, 0, 0, 5] },
      { text: `Date: ${data.currentDate}`, fontSize: 10, margin: [0, 0, 0, 15] },
      
      // Customer section
      { text: 'Customer Information:', fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
      { text: `Name: ${data.customerName}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `Phone: ${data.customerPhone}`, fontSize: 10, margin: [0, 0, 0, 15] },
      
      // Vehicle section
      { text: 'Vehicle Information:', fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
      { text: `Make: ${data.vehicleMake}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `Model: ${data.vehicleModel}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `Year: ${data.vehicleYear}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `License Plate: ${data.licensePlate}`, fontSize: 10, margin: [0, 0, 0, 15] },
      
      // Financial section
      { text: 'Financial Terms:', fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
      { text: `Monthly Rent: ${data.monthlyRent}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `Total Amount: ${data.totalAmount}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `Security Deposit: ${data.depositAmount}`, fontSize: 10, margin: [0, 0, 0, 15] },
      
      // Period section
      { text: 'Rental Period:', fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
      { text: `Start Date: ${data.startDate}`, fontSize: 10, margin: [0, 0, 0, 3] },
      { text: `End Date: ${data.endDate}`, fontSize: 10, margin: [0, 0, 0, 20] },
      
      // Basic terms
      { text: 'Terms and Conditions:', fontSize: 12, bold: true, margin: [0, 0, 0, 10] },
      { text: '1. The tenant agrees to pay rent on the specified date', fontSize: 9, margin: [0, 0, 0, 3] },
      { text: '2. The tenant is responsible for vehicle maintenance', fontSize: 9, margin: [0, 0, 0, 3] },
      { text: '3. All traffic violations are the responsibility of the tenant', fontSize: 9, margin: [0, 0, 0, 3] },
      { text: '4. This agreement is subject to Qatar laws', fontSize: 9, margin: [0, 0, 0, 30] },
      
      // Signatures
      { text: 'Signatures:', fontSize: 12, bold: true, margin: [0, 0, 0, 20] },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: 'Lessor:', alignment: 'center', border: [false, false, false, false] },
              { text: 'Lessee:', alignment: 'center', border: [false, false, false, false] }
            ],
            [
              { text: '\n\n_____________________', alignment: 'center', border: [false, false, false, false] },
              { text: '\n\n_____________________', alignment: 'center', border: [false, false, false, false] }
            ],
            [
              { text: 'Signature', alignment: 'center', fontSize: 8, border: [false, false, false, false] },
              { text: 'Signature', alignment: 'center', fontSize: 8, border: [false, false, false, false] }
            ]
          ]
        }
      }
    ],
    
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10
    }
  };
}

// Main contract generation function with maximum error protection
export async function generateArabicContract(agreement: Agreement): Promise<boolean> {
  try {
    console.log('Starting ultra-simple contract generation for agreement:', agreement.id);
    
    // Create the simplest possible document
    const docDefinition = createUltraSimpleDocument(agreement);
    console.log('Document definition created successfully');
    
    // Generate filename
    const fileName = `contract-${agreement.agreement_number || 'unknown'}-${Date.now()}.pdf`;
    
    try {
      // Create PDF with minimal configuration
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.download(fileName);
      
      console.log('PDF generated and downloaded successfully');
      toast.success('Contract generated successfully');
      return true;
      
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      
      // Ultimate fallback - text-only document
      const textOnlyDoc = {
        content: [
          { text: 'VEHICLE RENTAL AGREEMENT', fontSize: 16, bold: true, alignment: 'center' },
          { text: '\n' },
          { text: `Agreement: ${agreement.agreement_number || 'N/A'}`, fontSize: 12 },
          { text: `Customer: ${agreement.customers?.full_name || 'N/A'}`, fontSize: 12 },
          { text: `Vehicle: ${agreement.vehicles?.make || 'N/A'} ${agreement.vehicles?.model || 'N/A'}`, fontSize: 12 },
          { text: `Monthly Rent: ${agreement.rent_amount || 0} QAR`, fontSize: 12 },
          { text: '\n' },
          { text: 'This is a simplified contract document.', fontSize: 10 }
        ],
        defaultStyle: {
          font: 'Roboto'
        }
      };
      
      const fallbackPdf = pdfMake.createPdf(textOnlyDoc);
      fallbackPdf.download(`simple-${fileName}`);
      
      toast.success('Simplified contract generated');
      return true;
    }
    
  } catch (error) {
    console.error('Complete contract generation failure:', error);
    toast.error('Failed to generate contract');
    return false;
  }
}

// Export function for database integration
export async function generateAndStoreContract(agreement: Agreement) {
  try {
    const success = await generateArabicContract(agreement);
    return {
      success,
      error: success ? null : 'Failed to generate contract'
    };
  } catch (error) {
    console.error('Error in generateAndStoreContract:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Configure Amiri fonts for Arabic support
const configureFonts = () => {
  try {
    (pdfMake as any).fonts = {
      Amiri: {
        normal: '/Amiri-Regular.ttf',
        bold: '/Amiri-Bold.ttf',
        italics: '/Amiri-Regular.ttf',
        bolditalics: '/Amiri-Bold.ttf'
      }
    };
  } catch (error) {
    console.warn('Failed to configure Amiri fonts, using default font');
  }
};

// Calculate contract duration in months
const calculateDurationMonths = (startDate: string | Date, endDate: string | Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
};

/**
 * Generates a PDF containing the FULL Arabic rental contract text (all clauses) and downloads it as "contract.pdf".
 * The text is dynamically populated with agreement data, replacing placeholders such as
 * (رقم العقد)،(تاريخ بدا العقد)،(اسم العميل)،(رقم رخصة القيادة)،(الجنسية)،(رقم الجوال)،(مدة العقد)،(قيمة الايجار الشهري)،(غرامة التاخير)،(مبلغ الضمان).
 */
export async function generateFullArabicContractPdf(agreement: Agreement): Promise<void> {
  try {
    configureFonts();

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
      depositAmount: formatArabicCurrency(agreement.deposit_amount)
    };

    // Full Arabic contract template with dynamic data injected
    const fullContractText = `
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
النوع : ................................
رقم اللوحة : ................................
رقم القاعدة : ................................
نوع المركبة : ................................

مادة 3 - مدة الايجار

اتفق الطرفان على ان تكون مدة هذا العقد ${contractData.contractDuration} تبدأ اعتبارا من تاريخ النفاذ المذكور في بداية هذا العقد ,غير قابل للتجديد وينتهي العقد بانتهاء مدته كما لا يجوز للطرف الثاني ان ينهي العقد قبل انتهاء مدته الا بموافقة كتابية من الطرف الأول.

مادة 4 - قيمة الايجار

يدفع الطرف الثاني للطرف الأول قيمة ايجارية مبلغ وقدره ${contractData.monthlyRent} شهريا طبقا لجدول الدفعات المرفق بهذا العقد.
يلتزم الطرف الثاني بسداد كامل دفعات الايجار المحددة شهريا وبصورة منتظمة ولا يجوز له خصم أي مبلغ منها مقابل رسوم او ضرائب او غير ذلك.

مادة 5 - غرامات التأخير

يكون الدفع في أول يوم من كل شهر و في حال التأخير عن سداد القيمة الإيجارية او في حال تخلف الطرف الثاني عن سداد أي من الدفعات الشهرية المستحقة  لاي سبب كان تطبق على الطرف الثاني دون حاجة الى اعذار او انذار من قبل الطرف الأول غرامة تأخير مبلغ قدره ${contractData.lateFee} عن كل يوم تأخير من تاريخ الاستحقاق حتى تاريخ سدادة المتأخرات  وتدفع المتأخرات مع الغرامات على حد سواء.

مادة 6 - وديعة الضمان

يلتزم الطرف الثاني عند التوقيع على هذا العقد ان يسلم الطرف  الأول قيمة ${contractData.depositAmount} ضمان ("وديعة الضمان") وذلك لضمان تنفيذ الطرف الثاني لالتزاماته بموجب هذا العقد ولتعويض الطرف الأول عن اية خسائر او اضرار قد يتسبب بها الطرف الثاني او وكلائه او ممثليه للمركبة  طوال مدة هذا العقد. بالإضافة الى ذلك، يحق للطرف الأول ان يخصم من وديعة الضمان اية مبالغ يدين بها الطرف الثاني للطرف الأول بموجب هذا العقد  ولا يمكن استرجاع  مبلغ الضمان بعد إنهاء العقد من قبل الطرف الثاني.

مادة 7 - المعاينة

يقر الطرف الثاني انه بمجرد توقيعه على هذا العقد يكون قد عاين المركبة المؤجرة اليه معاينة تامة نافية للجهالة وقبل بها بحالتها الراهنة وانه تحقق بانها بحالة جيدة خالية من اية عيوب، وانها بكفاءة عالية ولا يحق له الادعاء بعد ذلك بوجود عيب فيها.
لا يقدم الطرف الاول أي ضمانات ، صريحة أو ضمنية ، فيما يتعلق بالمركبة المؤجرة و يتحمل الطرف الثاني وحده المسؤولية عن حالة المركبة المؤجرة.

مادة 8 - استلام المركبة

مع عدم الاخلال بأحكام المادتين 4 و 6 أعلاه ، يلتزم الطرف الأول عند التوقيع على هذا العقد بتسليم الطرف الثاني المركبة المؤجرة اليه طبقا لنموذج محضر التسليم المرفق بهذا العقد ويوقع عليه من كلا الطرفين وفي حال إرجاع السيارة او إنهاء العقد يكون الطرف الثاني مسوول عن أي تلف او مخالفة أو أضرار على السيارة أو تسبب بها للغير

مادة 9 - اقرارات وتعهدات الطرف الثاني

عند التوقيع على هذا العقد يقر ويضمن الطرف الثاني بعد ان أصبحت المركبة في حيازته انه المسؤول الوحيد عن:

9.1 يتحمل الطرف الثاني كافة المخالفات المرورية التي تقع خلال مدة الإيجار ويجب تسويتها خلال 30 يومًا كحد أقصى من تاريخ وقوع المخالفة وبالعدم يحق للطرف الأول إنهاء العقد وتحميلة قيمة المخالفات.

9.2 جميع مصاريف تشغيل المركبة من وقود وزيوت وقطع الغيار الاستهلاكية ومغير ذلك.

9.3 جميع اعمال الصيانة الدورية وغير الدورية والإصلاح واجراء الفحص الفني للمركبة المؤجرة في مواعيدها والالتزام بكافة متطلبات الفحص الفني وضمان اجتياز المركبة المؤجرة للفحص الفني طوال مدة هذا العقد.

9.4 يقر الطرف الثاني بانه وحده المسؤول عن هلاك المركبة سواء كان هلاكا كليا او جزئيا، والناتج عن اهماله او تقصيره ولو كان بسبب الغير وبالتالي فان الطرف الثاني يتعهد بدفع تكلفة هذا الهلاك.

9.5 يقر الطرف الثاني انه سيقود المركبة بنفسه ولمنفعته الشخصية ولن يسمح لاحد غيره بقيادتها والانتفاع بها طوال مدة هذا العقد و في حال مخالفة ذلك يحق للطرف الأول انهاء العقد دون اعذار أو انذار او حكم محكمة.

مادة 10 - متطلبات التامين

يلتزم الطرف الثاني بتوفير بوليصة تامين شاملة ضد جميع الاخطار للمركبة المؤجرة من شركة تامين معتمدة والحفاظ عليها سارية الصلاحية طوال مدة هذا العقد.

مادة 11 - خيار الشراء

بموجب هذا العقد إذا رغب الطرف الثاني شراء المركبة بنهاية مدة العقد يجب ان يخطر الطرف الاول كتابيا برغبته بشراء المركبة المبين بيانها اعلاه محل العقد علما بأن قيمة السيارة مساوية لقيمة الايجار الشهري , يحق للطرف للثاني الانتفاع بهذا العرض فقط مع نهاية العقد.

مادة 12 - الاخلال من قبل الطرف الثاني

ان أي من الأفعال التالية تشكل حدث اخلال من قبل الطرف الثاني:

12.1 الإخفاق في الدفع: اخفاق الطرف الثاني في سداد أي من الدفعات الايجارية او أي مبلغ مستحق بموجب هذا العقد في مواعيد استحقاقها

12.2 خرق العقد: خرق الطرف الثاني لاي من التزاماته الأخرى غير المالية المفروضة بموجب هذا العقد

12.3 افلاس او اعسار الطرف الثاني.
12.4 هجر او ترك المركبة.
12.5 مغادرة او ترحيل الطرف الثاني من البلاد بصورة نهائية.
12.6 عدم التزام المستأجر بدفع كل مخالفة مرورية مرتكبة أثناء حيازته السيارة في غضون 30 يوم من تاريخ ارتكابها.

مادة 13 - عواقب الاخلال

في حال وقوع حدث الاخلال من قبل الطرف الثاني يحق للطرف الأول دون حاجة الى اعذار او انذار او حكم محكمة:

13.1 انهاء العقد وسحب السيارة بواسطة أحد موظفي الشركة فورا ،كما يلتزم الطرف الثاني بدفع القيمة الايجارية المستحقة وبتعويض الطرف الأول مقابل إنهاء العقد بدفع غرامة 5000 ريال قطري ولايحق للطرف الثاني المطالبة باي مبالغ مدفوعة قبل إنهاء العقد.

13.2 يلتزم الطرف الثاني على الفور بتسليم المركبة المؤجرة الى الطرف الأول ويدفع الطرف الثاني تعويض الى الطرف الأول يعادل 200 ريال عن كل يوم تأخير حتى تسليمها الى الطرف الأول. يستحق الطرف الأول الغرامات المفروضة عن التأخر في السداد والاجرة اليومية للسيارة ويكون مجموعهما تعويضا عما لحق الطرف الأول من أضرار.

في حال مخالفة الطرف الثاني لأي من بنود هذا العقد يحق للطرف الأول إنهاء العقد دون الحاجة إلى اعذار او إنذار او حكم محكمة وسحب السيارة بواسطة موظفي الشركة عن طريق نسخة المفتاح الموجود لدى الشركة ويكون الطرف الثاني ملزم بتسليم نسختة للطرف الأول او يتحمل قيمتة . كما يقر ويوافق الطرف الثاني بعدم مسؤولية الطرف الأول عن أي أغراض أو مبالغ داخل السيارة عند سحبها ويتنازل المستأجر عن أي مطالبات قانونية تتعلق بالأغراض الشخصية المتبقية في السيارة في حالة استردادها نتيجة لعدم الدفع أو خرق العقد ولا تعد الشركة مسؤولة مدنيا او جنائيا.

مادة 14 - السداد المبكر

لا يجوز للطرف الثاني في حال قرر سداد قيمة العقد وانهاء العقد قبل تاريخ الانتهاء ويلتزم الطرف الثاني بجدول السداد وعليه اخطار الطرف الأول قبلها بشهر  ما اذا اراد خلاصها قبل ذلك لأخد الموافقة.

مادة 15 - احكام عامة

15.1 القانون الحاكم والاختصاص القضائي: يخضع هذا العقد من جميع النواحي للقوانين المطبقة في دولة قطر. يوافق الطرفان على الاختصاص القضائي أمام محاكم دولة قطر. يتفق الطرفان على أن هذا الاختيار للقانون والمكان والولاية القضائية ليس اختياريا ، ولكنه إلزامي بطبيعته.

15.2 يجوز أن تكون جميع الاتصالات أوالإشعارات او المراسلات المقدمة بموجب هذا عبر الواتساب او الايميل او الرسائل النصية.

15.3 التنازل: لا يجوز التنازل عن هذا العقد أو الحقوق الممنوحة بموجبه أو بيعها أو تأجيرها أو نقلها كليًا أو جزئيًا بواسطة الطرف الثاني دون موافقة خطية مسبقة من الطرف الاول.

15.4 القابلية للفصل: إذا تم اعتبار أي حكم أو بند من هذا العقد غير قابل للتنفيذ ، فسيتم اعتبار هذا العقد معدل بالقدر اللازم لجعل الحكم غير قابل للتنفيذ ، وبقية العقد ، ساري وقابل للتنفيذ. إذا رفضت المحكمة تعديل هذا العقد على النحو المنصوص عليه في هذا العقد ، فإن بطلان أو عدم قابلية تنفيذ أي حكم من أحكام هذا العقد لن يؤثر على صلاحية أو قابلية تنفيذ البنود والأحكام المتبقية ،والتي يجب أن يتم إنفاذها كما لو لم تكن مدرجة في هذا العقد.

15.5 الاتفاق بمجمله: يشكل هذا العقد الاتفاق الكامل بين الطرفين ويحل محل أي تفاهمات سابقة أو معاصرة ، سواء كانت مكتوبة أو شفهية.

15.6 نسخ العقد: يجوز توقيع هذا العقد من عدة نسخ ، وتشكل جميعها عقد واحد.

واشهادا لذلك، تم توقيع هذا العقد من قبل الأطراف من نسختين متطابقتين لكل طرف نسخة للعمل بموجبها.


التواقيع
`;

    try {
      // Create PDF definition with Arabic support
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        content: [
          {
            text: prepareArabicForPDF(fullContractText),
            style: 'arabicText',
            alignment: 'right'
          }
        ],
        styles: {
          arabicText: {
            fontSize: 12,
            lineHeight: 1.5,
            alignment: 'right',
            font: 'Amiri'
          }
        },
        defaultStyle: {
          font: 'Roboto',
          fontSize: 10
        }
      };

      // Generate and download PDF
      pdfMake.createPdf(docDefinition).download('contract.pdf');
      
    } catch (pdfError) {
      console.warn('PDF generation with Amiri font failed, trying fallback');
      
      // Fallback to simple document without custom fonts
      const simplifiedDoc = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        content: [
          {
            text: fullContractText,
            fontSize: 12,
            lineHeight: 1.5,
            alignment: 'right'
          }
        ],
        defaultStyle: {
          fontSize: 12,
          alignment: 'right'
        }
      };
      
      pdfMake.createPdf(simplifiedDoc).download('contract.pdf');
    }

  } catch (error) {
    console.error('Error generating full contract PDF:', error);
    throw new Error('Failed to generate full contract PDF');
  }
}
