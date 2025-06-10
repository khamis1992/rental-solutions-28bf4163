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
      console.warn('Font initialization failed, using fallback configuration');
      configurePdfMakeFonts();
    }
  } catch (error) {
    console.warn('Font loading failed, using default fonts:', error);
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
    
    // Calculate duration in months
    const durationMonths = calculateDurationMonths(startDate, endDate);
    
    // Format dates in Arabic format
    const formattedCurrentDate = formatDateArabic(currentDate);
    const formattedStartDate = formatDateArabic(startDate);
    const formattedEndDate = formatDateArabic(endDate);
    
    // Format currency values
    const formattedRentAmount = formatArabicCurrency(agreement.rent_amount);
    const formattedTotalAmount = formatArabicCurrency(agreement.total_amount);
    const formattedDepositAmount = formatArabicCurrency(agreement.deposit_amount);
    const formattedLateFee = formatArabicCurrency(agreement.daily_late_fee);
    const formattedDownPayment = formatArabicCurrency(agreement.down_payment);
    
    // Get customer information with fallbacks
    const customerName = agreement.customers?.full_name || 'غير محدد';
    const customerNationality = agreement.customers?.nationality || 'غير محدد';
    const customerLicense = agreement.customers?.driver_license || 'غير محدد';
    const customerEmail = agreement.customers?.email || 'غير محدد';
    const customerPhone = agreement.customers?.phone_number || 'غير محدد';
    
    // Get vehicle information with fallbacks
    const vehicleLicensePlate = agreement.vehicles?.license_plate || 'غير محدد';
    const vehicleVin = agreement.vehicles?.vin || 'غير محدد';
    const vehicleModel = agreement.vehicles?.model || 'غير محدد';
    const vehicleMake = agreement.vehicles?.make || 'غير محدد';
    
    // Create dynamic content for the agreement body
    const agreementContent = [
      // Contract header
      {
        text: 'عقد ايجار مركبة',
        style: 'contractHeader',
        margin: [0, 20, 0, 20]
      },
      // Introduction section
      {
        text: `تم تحرير عقد ايجار مركبة هذا ("العقد") وجرى تنفيذه اعتبارا من تاريخ ${formattedStartDate} بين كل من:`,
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // First party details
      {
        text: 'الطرف الأول: شركة العراف لتاجير السيارات ذ م م، وهي شركة محدودة المسؤولية مسجلة أصولا طبقا لقوانين دولة قطر، سجل تجاري رقم 146832 ومقرها الكائن في منطقة أم صلال علي، الدوحة، قطر، ص ب 36126.',
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // First party representative
      {
        text: `ويُمثّلها قانونا السيد/ خميس هاشم الجبر بصفته المدير المخول بالتوقيع للشركة، ويشار إليه لاحقا بلفظ \"المؤجر | الطرف الأول\"`,
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Second party details
      {
        text: `الطرف الثاني: ${customerName}، ${customerLicense}، الجنسية ${customerNationality}، ومقيم في دولة قطر، البريد الإلكتروني ${customerEmail}، رقم الجوال ${customerPhone}. "مستأجر | الطرف ثاني"`,
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Parties reference
      {
        text: 'يشار إلى كل منهما منفردين بلفظ "الطرف" ومجتمعين بلفظ "الأطراف"',
        style: 'articleText',
        margin: [0, 0, 0, 20]
      },
      // Introduction section title
      {
        text: 'مقدمة',
        style: 'sectionTitle',
        margin: [0, 0, 0, 15]
      },
      // Introduction content
      {
        text: 'حيث أن الطرف الأول هي شركة تأجير سيارات مرخصة أصولا وتملك المركبة المبينة نوعاً وماركة وطرازاً ورقم شاسيه أدناه، ولما كان الطرف الثاني يرغب في التعامل مع الطرف الأول على هذا الأساس وذلك لاستئجار المركبة المذكورة وفق نظام الإيجار طبقاً للوائح الشركة وقانون دولة قطر. ولما كان الطرف الأول قد وافق على تأجير الطرف الثاني المركبة المذكورة وفق نظام الإيجار المبين وطبقاً للشروط والأحكام الواردة أدناه، لذلك، فقد اتفق الطرفان بعد أن قررا بأهليتهما للتعاقد بصفتهم ومع الأخذ بعين الاعتبار للوعود والعهود المتبادلة بينهما على الآتي:',
        style: 'articleText',
        margin: [0, 0, 0, 20]
      },
      // Article 1
      {
        text: 'مادة 1\nيعتبر التمهيد السابق جزء لا يتجزأ من هذا العقد ويفسر ضمن بنوده وشروطه.',
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 2 - Vehicle Details
      {
        text: `مادة 2 - بيانات المركبة\nيؤجر الطرف الأول بموجب هذا العقد الطرف الثاني القابل لذلك المركبة التالية:\nالنوع: ${vehicleModel} - ${vehicleMake}\nرقم اللوحة: ${vehicleLicensePlate}\nرقم القاعدة: ${vehicleVin}`,
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 3 - Duration
      {
        text: `مادة 3 - مدة الإيجار\nاتفق الطرفان على أن تكون مدة هذا العقد ${durationMonths} شهر تبدأ اعتباراً من تاريخ النفاذ المذكور في بداية هذا العقد، غير قابلة للتجديد وينتهي العقد بانتهاء مدته كما لا يجوز للطرف الثاني أن ينهي العقد قبل انتهاء مدته إلا بموافقة خطية من الطرف الأول.`,
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 4 - Rent Amount
      {
        text: `مادة 4 - قيمة الإيجار\nيدفع الطرف الثاني للطرف الأول قيمة إيجارية مبلغ وقدره ${formattedRentAmount} شهريًا طبقًا لجدول الدفعات المرفق بهذا العقد.\nيلتزم الطرف الثاني بسداد كامل دفعات الإيجار المحددة شهريًا وبصورة منتظمة ولا يجوز له خصم أي مبلغ منها مقابل رسوم أو ضرائب أو غير ذلك.`,
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 5 - Late Fees
      {
        text: `مادة 5 - غرامات التأخير\nيكون الدفع في أول يوم من كل شهر وفي حال التأخير عن سداد القيمة الإيجارية أو في حال تخلف الطرف الثاني عن سداد أي من الدفعات الشهرية المستحقة لأي سبب كان تُطبَّق على الطرف الثاني دون حاجة إلى إنذار أو إعذار من قبل الطرف الأول غرامة تأخير مبلغ قدره ${formattedLateFee} ريال قطري عن كل يوم تأخير من تاريخ الاستحقاق حتى تاريخ سداد المتأخرات، وتدفع المتأخرات مع الغرامات على حد سواء.`,
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 6 - Security Deposit
      {
        text: `مادة 6 - وديعة الضمان\nيلتزم الطرف الثاني عند التوقيع على هذا العقد أن يسلم الطرف الأول قيمة ${formattedDownPayment} كوديعة ضمان ("وديعة الضمان") وذلك لضمان تنفيذ الطرف الثاني لالتزاماته بموجب هذا العقد ولتعويض الطرف الأول عن أي خسائر أو أضرار قد يتسبب بها الطرف الثاني أو وكلائه أو ممثليه للمركبة طوال مدة هذا العقد. بالإضافة إلى ذلك، يحق للطرف الأول أن يخصم من وديعة الضمان أي مبالغ يدين بها الطرف الثاني للطرف الأول بموجب هذا العقد ولا يمكن استرجاع مبلغ الضمان بعد إنهاء العقد من قبل الطرف الثاني.`,
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 7 - Inspection
      {
        text: 'مادة 7 - المعاينة\nيقر الطرف الثاني بأنه بمجرد توقيعه على هذا العقد يكون قد عاين المركبة المؤجرة إليه معاينة تامة نافية للجهالة وقبل بها بحالتها الراهنة وأنه تحقق بأنها بحالة جيدة خالية من أي عيوب، وأنها بكفاءة عالية ولا يحق له الادّعاء بعد ذلك بوجود عيب فيها.\nلا يقدم الطرف الأول أي ضمانات، صريحة أو ضمنية، فيما يتعلق بالمركبة المؤجرة ويتحمل الطرف الثاني وحده المسؤولية عن حالة المركبة المؤجرة.',
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 8 - Vehicle Delivery
      {
        text: 'مادة 8 - استلام المركبة\nمع عدم الإخلال بأحكام المواد 4 و6 أعلاه، يلتزم الطرف الأول عند التوقيع على هذا العقد بتسليم الطرف الثاني المركبة المؤجرة إليه طبقاً لنموذج محضر التسليم المرفق بهذا العقد ويوقع عليه من كلا الطرفين. وفي حال إرجاع السيارة أو إنهاء العقد يكون الطرف الثاني مسؤول عن أي تلف أو مخالفة أو أضرار على السيارة أو تسبب بها للغير.',
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 9 - Lessee's Responsibilities
      {
        text: 'مادة 9 - إقرارات وتعهدات الطرف الثاني\nعند التوقيع على هذا العقد يقر ويضمن الطرف الثاني بعد أن أصبحت المركبة في حيازته أنه المسؤول الوحيد عن:',
        style: 'articleText',
        margin: [0, 0, 0, 10]
      },
      {
        text: '9.1 يتحمل الطرف الثاني كافة المخالفات المرورية التي تقع خلال مدة الإيجار ويجب تسويتها خلال 30 يومًا كحد أقصى من تاريخ وقوع المخالفة، وبالعدم يحق للطرف الأول إنهاء العقد وتحميله قيمة المخالفات.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '9.2 جميع مصاريف تشغيل المركبة من وقود وزيوت وقطع الغيار الاستهلاكية وما إلى ذلك.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '9.3 جميع أعمال الصيانة الدورية وغير الدورية والإصلاح وإجراء الفحص الفني للمركبة المؤجرة في مواعيدها والالتزام بكافة متطلبات الفحص الفني وضمان اجتياز المركبة المؤجرة للفحص الفني طوال مدة هذا العقد.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '9.4 يقر الطرف الثاني بأنه وحده المسؤول عن هلاك المركبة سواء كان هلاكاً كلياً أو جزئياً، والناتج عن إهماله أو تقصيره ولو كان بسبب الغير وبالتالي فإن الطرف الثاني يتعهد بدفع تكلفة هذا الهلاك.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '9.5 يقر الطرف الثاني بأنه سيقود المركبة بنفسه ولمنفعته الشخصية ولن يسمح لأحد غيره بقيادتها والانتفاع بها طوال مدة هذا العقد، وفي حال مخالفة ذلك يحق للطرف الأول إنهاء العقد دون إعذار أو إنذار أو حكم محكمة.',
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 10 - Insurance
      {
        text: 'مادة 10 - متطلبات التأمين\nيلتزم الطرف الثاني بتوفير بوليصة تأمين شاملة ضد جميع الأخطار للمركبة المؤجرة من شركة تأمين معتمدة والحفاظ عليها سارية الصلاحية طوال مدة هذا العقد.',
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 11 - Purchase Option
      {
        text: 'مادة 11 - خيار الشراء\nبموجب هذا العقد إذا رغب الطرف الثاني شراء المركبة بنهاية مدة العقد يجب أن يخطر الطرف الأول كتابياً برغبته بشراء المركبة المبين بيانها أعلاه محل العقد علماً بأن قيمة السيارة مساوية لقيمة الإيجار الشهري، يحق للطرف الثاني الانتفاع بهذا العرض فقط مع نهاية العقد.',
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 12 - Breach by Lessee
      {
        text: 'مادة 12 - الإخلال من قبل الطرف الثاني\nإن أي من الأفعال التالية تشكل حدث إخلال من قبل الطرف الثاني:',
        style: 'articleText',
        margin: [0, 0, 0, 10]
      },
      {
        text: '12.1 الإخفاق في الدفع: إخفاق الطرف الثاني في سداد أي من الدفعات الإيجارية أو أي مبلغ مستحق بموجب هذا العقد في مواعيد استحقاقه.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '12.2 خرق العقد: خرق الطرف الثاني لأي من التزاماته الأخرى غير المالية المفروضة بموجب هذا العقد.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '12.3 إفلاس أو إعسار الطرف الثاني.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '12.4 هجر أو ترك المركبة.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '12.5 مغادرة أو ترحيل الطرف الثاني من البلاد بصورة نهائية.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '12.6 عدم التزام المستأجر بدفع كل مخالفة مرورية مرتكبة أثناء حيازته السيارة في غضون 30 يوم من تاريخ ارتكابها.',
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 13 - Consequences of Breach
      {
        text: 'مادة 13 - عواقب الإخلال\nفي حال وقوع حدث الإخلال من قبل الطرف الثاني يحق للطرف الأول دون حاجة إلى إعذار أو إنذار أو حكم محكمة:',
        style: 'articleText',
        margin: [0, 0, 0, 10]
      },
      {
        text: '13.1 إنهاء العقد وسحب السيارة بواسطة أحد موظفي الشركة فوراً، كما يلتزم الطرف الثاني بدفع القيمة الإيجارية المستحقة وبتعويض الطرف الأول مقابل إنهاء العقد بدفع غرامة 5000 ريال قطري ولا يحق للطرف الثاني المطالبة بأي مبالغ مدفوعة قبل إنهاء العقد.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '13.2 يلتزم الطرف الثاني على الفور بتسليم المركبة المؤجرة إلى الطرف الأول ويدفع الطرف الثاني تعويض إلى الطرف الأول يعادل 200 ريال عن كل يوم تأخير حتى تسليمها إلى الطرف الأول. يستحق الطرف الأول الغرامات المفروضة عن التأخر في السداد والإجارة اليومية للسيارة ويكون مجموعهما تعويضاً لما لحق الطرف الأول من أضرار.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: 'في حال مخالفة الطرف الثاني لأي من بنود هذا العقد يحق للطرف الأول إنهاء العقد دون الحاجة إلى إعذار أو إنذار أو حكم محكمة وسحب السيارة بواسطة موظفي الشركة عن طريق نسخة المفتاح الموجود لدى الشركة ويكون الطرف الثاني ملزم بتسليم نسخته للطرف الأول أو يتحمل قيمتها. كما يقر ويوافق الطرف الثاني بعدم مسؤولية الطرف الثاني عن أي أغراض أو مبالغ داخل السيارة عند سحبها ويتنازل المستأجر عن أي مطالبات قانونية تتعلق بالأغراض الشخصية المتبقية في السيارة في حالة استردادها نتيجة لعدم الدفع أو خرق العقد ولا تعد الشركة مسؤولة مدنياً أو جنائياً.',
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 14 - Early Termination
      {
        text: 'مادة 14 - السداد المبكر\nلا يجوز للطرف الثاني في حال قرر سداد قيمة العقد وإنها العقد قبل تاريخ الانتهاء ويلتزم الطرف الثاني بجدول السداد وعليه إخطار الطرف الأول قبلها بشهر ما إذا أراد خلاها قبل ذلك لأخذ الموافقة.',
        style: 'articleText',
        margin: [0, 0, 0, 15]
      },
      // Article 15 - General Provisions
      {
        text: 'مادة 15 - أحكام عامة\n15.1 القانون الحاكم والاختصاص القضائي: يخضع هذا العقد من جميع النواحي للقوانين المطبقة في دولة قطر. يوافق الطرفان على الاختصاص القضائي أمام محاكم دولة قطر. يتفق الطرفان على أن هذا الاختيار للقانون والمكان والولاية القضائية ليس اختيارياً، ولكنه إلزامي بطبيعته.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '15.2 يجوز أن تكون جميع الاتصالات أو الإشعارات أو المراسلات المقدمة بموجب هذا عبر الواتساب أو البريد الإلكتروني أو الرسائل النصية.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '15.3 التنازل: لا يجوز التنازل عن هذا العقد أو الحقوق الممنوحة بموجبه أو بيعها أو تأجيرها أو نقلها كلياً أو جزئياً بواسطة الطرف الثاني دون موافقة خطية مسبقة من الطرف الأول.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '15.4 القابلية للفصل: إذا تم اعتبار أي حكم أو بند من هذا العقد غير قابل للتنفيذ، فيعتبر هذا العقد معدل بالقدر اللازم لجعل الحكم غير قابل للتنفيذ، وبقية العقد، ساري وقابل للتنفيذ. إذا رفضت المحكمة تعديل هذا العقد على النحو المنصوص عليه في هذا العقد، فإن بطلان أو عدم قابلية تنفيذ أي حكم من أحكام هذا العقد لن يؤثر على صلاحيته أو قابلية تنفيذ البنود والأحكام المتبقية، والتي يجب أن يتم إنفاذها كما لو لم تكن مدرجة في هذا العقد.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '15.5 الاتفاق بمجمله: يشكل هذا العقد الاتفاق الكامل بين الطرفين ويحل محل أي تفاهمات سابقة أو معاصرة، سواء كانت مكتوبة أو شفهية.',
        style: 'articleText',
        margin: [0, 0, 0, 5]
      },
      {
        text: '15.6 نسخ العقد: يجوز توقيع هذا العقد من عدة نسخ، وتشكل جميعها عقد واحد.\n\nوإشهاداً لذلك، تم توقيع هذا العقد من قبل الأطراف من نسختين متطابقتين لكل طرف نسخة للعمل بموجبها.',
        style: 'articleText',
        margin: [0, 0, 0, 20]
      },
      // Signatures Section
      {
        text: 'التوقيعات',
        style: 'sectionTitle',
        alignment: 'center',
        margin: [0, 30, 0, 20]
      },
      // Signature Blocks
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                stack: [
                  { text: 'الطرف الأول', style: 'signatureLabel' },
                  { text: '\n\n\n________________________', alignment: 'center' },
                  { 
                    text: `ويُمثّله السيد/ خميس هاشم الجبر\n\n${formattedCurrentDate}`, 
                    style: 'signatureDetails',
                    alignment: 'center'
                  }
                ],
                border: [false, false, false, false]
              },
              {
                stack: [
                  { text: 'الطرف الثاني', style: 'signatureLabel' },
                  { text: '\n\n\n________________________', alignment: 'center' },
                  { 
                    text: `ويُمثّله السيد/ ${customerName}\n\n${formattedCurrentDate}`, 
                    style: 'signatureDetails',
                    alignment: 'center'
                  }
                ],
                border: [false, false, false, false]
              }
            ]
          ]
        },
        layout: 'noBorders'
      }
    ];
    
    // Add page breaks between major sections if needed
    const contentWithPageBreaks = [];
    let firstSection = true;
    
    for (const item of agreementContent) {
      if (item.style === 'sectionTitle' && !firstSection) {
        contentWithPageBreaks.push({ text: '', pageBreak: 'before' });
      }
      contentWithPageBreaks.push(item);
      firstSection = false;
    }
    
    // Document definition for pdfMake
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
      
      // Footer with legal notice and page numbers
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
      
      // Main document content
      content: contentWithPageBreaks,
      
      // Styles for document elements
      styles: {
        companyName: {
          fontSize: 18,
          bold: true,
          font: 'Amiri',
          color: colors.primary,
          alignment: 'center'
        },
        contractTitle: {
          fontSize: 16,
          bold: true,
          font: 'Amiri',
          color: colors.text,
          alignment: 'center'
        },
        contractInfo: {
          fontSize: 11,
          font: 'Amiri',
          color: colors.text,
          alignment: 'right'
        },
        contractHeader: {
          fontSize: 20,
          bold: true,
          font: 'Amiri',
          color: colors.primary,
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        sectionTitle: {
          fontSize: 16,
          bold: true,
          font: 'Amiri',
          color: colors.primary,
          alignment: 'right'
        },
        articleText: {
          fontSize: 12,
          font: 'Amiri',
          color: colors.text,
          alignment: 'right',
          lineHeight: 1.6
        },
        signatureLabel: {
          fontSize: 13,
          bold: true,
          font: 'Amiri',
          color: colors.text,
          alignment: 'center'
        },
        signatureDetails: {
          fontSize: 11,
          font: 'Amiri',
          color: colors.text,
          alignment: 'center'
        },
        legalNotice: {
          fontSize: 8,
          font: 'Amiri',
          color: colors.textLight,
          alignment: 'center'
        },
        pageNumber: {
          fontSize: 8,
          font: 'Amiri',
          color: colors.textLight,
          alignment: 'center'
        }
      },
      
      // Default document style
      defaultStyle: {
        font: 'Amiri',
        fontSize: 11,
        rtl: true,
        alignment: 'right'
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
