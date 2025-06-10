import { Agreement } from '@/types/agreement';
import { formatCurrency } from '@/lib/utils';
import pdfMake from 'pdfmake/build/pdfmake';
import 'pdfmake/build/vfs_fonts';
import { configurePdfMakeFonts, initializeFonts } from './font-loader';
import { 
  prepareArabicForPDF, 
  createArabicTextBlock, 
  formatArabicCurrency, 
  formatArabicDate 
} from './arabic-text-utils';
import '@/fonts/Amiri-normal.js';
import '@/fonts/Amiri-Bold.js';

// Register fonts globally for pdfMake
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  },
  Amiri: {
    normal: 'Amiri-normal.ttf',
    bold: 'Amiri-bold.ttf',
    italics: 'Amiri-normal.ttf',
    bolditalics: 'Amiri-bold.ttf'
  }
};

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
type ContractLabelsType = {
  contractTitle: { ar: string };
  companyName: { ar: string };
  firstParty: { ar: string };
  secondParty: { ar: string };
  agreementNumber: { ar: string };
  contractDate: { ar: string };
  startDate: { ar: string };
  endDate: { ar: string };
  duration: { ar: string };
  customerName: { ar: string };
  nationality: { ar: string };
  idNumber: { ar: string };
  phoneNumber: { ar: string };
  email: { ar: string };
  vehicleDetails: { ar: string };
  make: { ar: string };
  model: { ar: string };
  year: { ar: string };
  licensePlate: { ar: string };
  color: { ar: string };
  vinNumber: { ar: string };
  financialTerms: { ar: string };
  monthlyRent: { ar: string };
  totalAmount: { ar: string };
  depositAmount: { ar: string };
  paymentDay: { ar: string };
  termsIntroduction: { ar: string };
  preamble: { ar: string };
  termsConditions: { ar: string };
  signatures: { ar: string };
  firstPartySignature: { ar: string };
  secondPartySignature: { ar: string };
  date: { ar: string };
  legalNotice: { ar: string };
  [key: `term${number}`]: { ar: string };
};
const contractLabels: ContractLabelsType = {
  // Header
  contractTitle: { ar: 'عقد إيجار مركبة' },
  companyName: { ar: `الطرف الأول: شركة العراف لتاجير السيارات ذ م م، وهي شركة محدودة المسؤولية مسجلة اصولا طبقا لقوانين دولة قطر، سجل تجاري رقم 146832 ومقرها الكائن في منطقة ام صلال علي، الدوحة، قطر، ص ب 36126.
ويمثلها قانونا السيد/ خميس هاشم الجبر بصفته المدير المخول بالتوقيع للشركة، ويشار اليه لاحقا بلفظ المؤجر | الطرف الاول` },
  
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
  termsIntroduction: { ar: 'المقدمة' },
  preamble: { ar: `حيث ان الطرف الأول هو شركة تأجير سيارات مرخصة اصولا وتمتلك المركبة المبينة نوعا وماركة وطرازا و رقم شاسيه ادناه
ولما كان الطرف الثاني يرغب في التعامل مع الطرف الأول على هذا الأساس وذلك لاستئجار المركبة المذكورة وفق نظام الايجار طبقاً للوائح الشركة وقانون دولة قطر.
ولما كان الطرف الأول قد وافق على تأجير الطرف الثاني المركبة المذكورة وفق نظام الايجار المبين وطبقا للشروط والاحكام الواردة ادناه،
لذلك، فقد اتفق الطرفان بعد ان قرروا بأهليتهم للتعاقد بصفتهم ومع الاخذ بعين الاعتبار للوعود والعهود المتبادلة بينهما على الاتي:` },
  termsConditions: { ar: 'الشروط والأحكام' },

  term1: { ar: '1. يعتبر التمهيد السابق جزأ لا يتجزأ من هذا العقد ويفسر ضمن بنوده وشروطه.' },
  term2: { ar: '2. يكون الدفع في أول يوم من كل شهر و في حال التأخير عن سداد القيمة الإيجارية او في حال تخلف الطرف الثاني عن سداد أي من الدفعات الشهرية المستحقة لاي سبب كان تطبق على الطرف الثاني دون حاجة الى اعذار او انذار من قبل الطرف الأول غرامة تأخير مبلغ قدره 200 ريال قطري عن كل يوم تأخير من تاريخ الاستحقاق حتى تاريخ سدادة المتأخرات وتدفع المتأخرات مع الغرامات على حد سواء.' },
  term3: { ar: '3. اتفق الطرفان على ان تكون مدة هذا العقد تبدأ اعتبارا من تاريخ النفاذ المذكور في بداية هذا العقد، غير قابل للتجديد وينتهي العقد بانتهاء مدته كما لا يجوز للطرف الثاني ان ينهي العقد قبل انتهاء مدته الا بموافقة كتابية من الطرف الأول.' },
  term4: { ar: '4. يدفع الطرف الثاني للطرف الأول قيمة ايجارية مبلغ كما هو موضح في الشروط المالية طبقا لجدول الدفعات المرفق بهذا العقد. يلتزم الطرف الثاني بسداد كامل دفعات الايجار المحددة شهريا وبصورة منتظمة ولا يجوز له خصم أي مبلغ منها مقابل رسوم او ضرائب او غير ذلك.' },
  term5: { ar: '5. يكون الدفع في أول يوم من كل شهر و في حال التأخير عن سداد القيمة الإيجارية او في حال تخلف الطرف الثاني عن سداد أي من الدفعات الشهرية المستحقة لاي سبب كان تطبق على الطرف الثاني دون حاجة الى اعذار او انذار من قبل الطرف الأول غرامة تأخير مبلغ قدره 200 ريال قطري عن كل يوم تأخير من تاريخ الاستحقاق حتى تاريخ سدادة المتأخرات وتدفع المتأخرات مع الغرامات على حد سواء.' },
  term6: { ar: '6. يلتزم الطرف الثاني عند التوقيع على هذا العقد ان يسلم الطرف الأول قيمة كما هو موضح في الشروط المالية كوديعة ضمان ("وديعة الضمان") وذلك لضمان تنفيذ الطرف الثاني لالتزاماته بموجب هذا العقد ولتعويض الطرف الأول عن اية خسائر او اضرار قد يتسبب بها الطرف الثاني او وكلائه او ممثليه للمركبة طوال مدة هذا العقد. بالإضافة الى ذلك، يحق للطرف الأول ان يخصم من وديعة الضمان اية مبالغ يدين بها الطرف الثاني للطرف الأول بموجب هذا العقد ولا يمكن استرجاع مبلغ الضمان بعد إنهاء العقد من قبل الطرف الثاني.' },
  term7: { ar: '7. يقر الطرف الثاني انه بمجرد توقيعه على هذا العقد يكون قد عاين المركبة المؤجرة اليه معاينة تامة نافية للجهالة وقبل بها بحالتها الراهنة وانه تحقق بانها بحالة جيدة خالية من اية عيوب، وانها بكفاءة عالية ولا يحق له الادعاء بعد ذلك بوجود عيب فيها. لا يقدم الطرف الاول أي ضمانات ، صريحة أو ضمنية ، فيما يتعلق بالمركبة المؤجرة و يتحمل الطرف الثاني وحده المسؤولية عن حالة المركبة المؤجرة.' },
  term8: { ar: '8. مع عدم الاخلال بأحكام المادتين 4 و 6 أعلاه ، يلتزم الطرف الأول عند التوقيع على هذا العقد بتسليم الطرف الثاني المركبة المؤجرة اليه طبقا لنموذج محضر التسليم المرفق بهذا العقد ويوقع عليه من كلا الطرفين وفي حال إرجاع السيارة او إنهاء العقد يكون الطرف الثاني مسوول عن أي تلف او مخالفة أو أضرار على السيارة أو تسبب بها للغير.' },
  term9: { ar: `9. عند التوقيع على هذا العقد يقر ويضمن الطرف الثاني بعد ان أصبحت المركبة في حيازته انه المسؤول الوحيد عن:
9.1 يتحمل الطرف الثاني كافة المخالفات المرورية التي تقع خلال مدة الإيجار ويجب تسويتها خلال 30 يومًا كحد أقصى من تاريخ وقوع المخالفة وبالعدم يحق للطرف الأول إنهاء العقد وتحميلة قيمة المخالفات.
9.2 جميع مصاريف تشغيل المركبة من وقود وزيوت وقطع الغيار الاستهلاكية ومغير ذلك.
9.3 جميع اعمال الصيانة الدورية وغير الدورية والإصلاح واجراء الفحص الفني للمركبة المؤجرة في مواعيدها والالتزام بكافة متطلبات الفحص الفني وضمان اجتياز المركبة المؤجرة للفحص الفني طوال مدة هذا العقد.
9.4 يقر الطرف الثاني بانه وحده المسؤول عن هلاك المركبة سواء كان هلاكا كليا او جزئيا، والناتج عن اهماله او تقصيره ولو كان بسبب الغير وبالتالي فان الطرف الثاني يتعهد بدفع تكلفة هذا الهلاك.
9.5 يقر الطرف الثاني انه سيقود المركبة بنفسه ولمنفعته الشخصية ولن يسمح لاحد غيره بقيادتها والانتفاع بها طوال مدة هذا العقد و في حال مخالفة ذلك يحق للطرف الأول انهاء العقد دون اعذار أو انذار او حكم محكمة.` },
  term10: { ar: '10. يلتزم الطرف الثاني بتوفير بوليصة تامين شاملة ضد جميع الاخطار للمركبة المؤجرة من شركة تامين معتمدة والحفاظ عليها سارية الصلاحية طوال مدة هذا العقد.' },
  term11: { ar: '11. بموجب هذا العقد إذا رغب الطرف الثاني شراء المركبة بنهاية مدة العقد يجب ان يخطر الطرف الاول كتابيا برغبته بشراء المركبة المبين بيانها اعلاه محل العقد علما بأن قيمة السيارة مساوية لقيمة الايجار الشهري , يحق للطرف للثاني الانتفاع بهذا العرض فقط مع نهاية العقد.' },
  term12: { ar: `12. ان أي من الأفعال التالية تشكل حدث اخلال من قبل الطرف الثاني:
12.1 الإخفاق في الدفع: اخفاق الطرف الثاني في سداد أي من الدفعات الايجارية او أي مبلغ مستحق بموجب هذا العقد في مواعيد استحقاقها
12.2 خرق العقد: خرق الطرف الثاني لاي من التزاماته الأخرى غير المالية المفروضة بموجب هذا العقد
12.3 افلاس او اعسار الطرف الثاني.
12.4 هجر او ترك المركبة.
12.5 مغادرة او ترحيل الطرف الثاني من البلاد بصورة نهائية.
12.6 عدم التزام المستأجر بدفع كل مخالفة مرورية مرتكبة أثناء حيازته السيارة في غضون 30 يوم من تاريخ ارتكابها.` },
  term13: { ar: `13. في حال وقوع حدث الاخلال من قبل الطرف الثاني يحق للطرف الأول دون حاجة الى اعذار او انذار او حكم محكمة:
انهاء العقد وسحب السيارة بواسطة أحد موظفي الشركة فورا ،كما يلتزم الطرف الثاني بدفع القيمة الايجارية المستحقة وبتعويض الطرف الأول مقابل إنهاء العقد بدفع غرامة 5000 ريال قطري ولايحق للطرف الثاني المطالبة باي مبالغ مدفوعة قبل إنهاء العقد
13.2 يلتزم الطرف الثاني على الفور بتسليم المركبة المؤجرة الى الطرف الأول ويدفع الطرف الثاني تعويض الى الطرف الأول يعادل 200 ريال عن كل يوم تأخير حتى تسليمها الى الطرف الأول. يستحق الطرف الأول الغرامات المفروضة عن التأخر في السداد والاجرة اليومية للسيارة ويكون مجموعهما تعويضا عما لحق الطرف الأول من أضرار.
في حال مخالفة الطرف الثاني لأي من بنود هذا العقد يحق للطرف الأول إنهاء العقد دون الحاجة إلى اعذار او إنذار او حكم محكمة وسحب السيارة بواسطة موظفي الشركة عن طريق نسخة المفتاح الموجود لدى الشركة ويكون الطرف الثاني ملزم بتسليم نسختة للطرف الأول او يتحمل قيمتة. كما يقر ويوافق الطرف الثاني بعدم مسؤولية الطرف الثاني عن أي أغراض أو مبالغ دأخل السيارة عند سحبها ويتنازل المستأجر عن أي مطالبات قانونية تتعلق بالأغراض الشخصية المتبقية في السيارة في حالة استردادها نتيجة لعدم الدفع أو خرق العقد ولا تعد الشركة مسؤولة مدنيا او جنائيا.` },
  term14: { ar: '14. لا يجوز للطرف الثاني في حال قرر سداد قيمة العقد وانهاء العقد قبل تاريخ الانتهاء ويلتزم الطرف الثاني بجدول السداد وعليه اخطار الطرف الأول قبلها بشهر ما اذا اراد خلاصها قبل ذلك لأخد الموافقة.' },
  term15: { ar: `15. 15.1 القانون الحاكم والاختصاص القضائي: يخضع هذا العقد من جميع النواحي للقوانين المطبقة في دولة قطر. يوافق الطرفان على الاختصاص القضائي أمام محاكم دولة قطر. يتفق الطرفان على أن هذا الاختيار للقانون والمكان والولاية القضائية ليس اختياريا ، ولكنه إلزامي بطبيعته.
15.2 يجوز أن تكون جميع الاتصالات أوالإشعارات او المراسلات المقدمة بموجب هذا عبر الواتساب او الايميل او الرسائل النصية
15.3 التنازل: لا يجوز التنازل عن هذا العقد أو الحقوق الممنوحة بموجبه أو بيعها أو تأجيرها أو نقلها كليًا أو جزئيًا بواسطة الطرف الثاني دون موافقة خطية مسبقة من الطرف الاول.
15.4 القابلية للفصل: إذا تم اعتبار أي حكم أو بند من هذا العقد غير قابل للتنفيذ ، فسيتم اعتبار هذا العقد معدل بالقدر اللازم لجعل الحكم غير قابل للتنفيذ ، وبقية العقد ، ساري وقابل للتنفيذ. إذا رفضت المحكمة تعديل هذا العقد على النحو المنصوص عليه في هذا العقد ، فإن بطلان أو عدم قابلية تنفيذ أي حكم من أحكام هذا العقد لن يؤثر على صلاحية أو قابلية تنفيذ البنود والأحكام المتبقية ،والتي يجب أن يتم إنفاذها كما لو لم تكن مدرجة في هذا العقد.
15.5 الاتفاق بمجمله: يشكل هذا العقد الاتفاق الكامل بين الطرفين ويحل محل أي تفاهمات سابقة أو معاصرة ، سواء كانت مكتوبة أو شفهية.
15.6 نسخ العقد: يجوز توقيع هذا العقد من عدة نسخ ، وتشكل جميعها عقد واحد.` },
  
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

    // Ensure Roboto font remains registered (ensureFontsLoaded may overwrite fonts)
    pdfMake.fonts = {
      ...(pdfMake.fonts || {}),
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    
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
                createArabicTextBlock(contractLabels.customerName.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.customers?.full_name || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
              ],
              [
                createArabicTextBlock(contractLabels.nationality.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.customers?.nationality || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
              ],
              [
                createArabicTextBlock(contractLabels.idNumber.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.customers?.driver_license || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
              ],
              [
                createArabicTextBlock(contractLabels.phoneNumber.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.customers?.phone_number || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
              ],
              [
                createArabicTextBlock(contractLabels.email.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.customers?.email || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
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
                createArabicTextBlock(contractLabels.make.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.vehicles?.make || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
              ],
              [
                createArabicTextBlock(contractLabels.model.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.vehicles?.model || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
              ],
              [
                createArabicTextBlock(contractLabels.year.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.vehicles?.year?.toString() || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
              ],
              [
                createArabicTextBlock(contractLabels.licensePlate.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.vehicles?.license_plate || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
              ],
              [
                createArabicTextBlock(contractLabels.color.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.vehicles?.color || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
              ],
              [
                createArabicTextBlock(contractLabels.vinNumber.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(agreement.vehicles?.vin || 'غير محدد', 'valueStyle') || { text: 'غير محدد', style: 'valueStyle' }
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
                createArabicTextBlock(`${contractLabels.startDate.ar}: ${formatDateArabic(agreement.start_date)}`, 'contractTerms') || { text: ' ', style: 'contractTerms' },
                createArabicTextBlock(`${contractLabels.endDate.ar}: ${formatDateArabic(agreement.end_date)}`, 'contractTerms') || { text: ' ', style: 'contractTerms' }
              ],
              [
                createArabicTextBlock(`${contractLabels.duration.ar}: ${duration} شهر`, 'contractTerms') || { text: ' ', style: 'contractTerms' },
                createArabicTextBlock(`${contractLabels.paymentDay.ar}: ${agreement.rent_due_day || 1}`, 'contractTerms') || { text: ' ', style: 'contractTerms' }
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
                createArabicTextBlock(contractLabels.monthlyRent.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(formatArabicCurrency(agreement.rent_amount), 'financialValue') || { text: ' ', style: 'financialValue' }
              ],
              [
                createArabicTextBlock(contractLabels.totalAmount.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(formatArabicCurrency(agreement.total_amount), 'financialValue') || { text: ' ', style: 'financialValue' }
              ],
              [
                createArabicTextBlock(contractLabels.depositAmount.ar, 'labelStyle') || { text: ' ', style: 'labelStyle' },
                createArabicTextBlock(formatArabicCurrency(agreement.deposit_amount), 'financialValue') || { text: ' ', style: 'financialValue' }
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
          stack: Array.from({ length: 15 }, (_, i) => {
            const label = contractLabels[`term${i + 1}`];
            if (!label || !label.ar) {
              console.warn(`Missing contract label for term${i + 1}`);
              return { text: '—', style: 'termText' };
            }
            const block = createArabicTextBlock(label.ar, 'termText');
            return block || { text: '—', style: 'termText' };
          }),
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
                    createArabicTextBlock(contractLabels.firstPartySignature.ar, 'signatureLabel') || { text: ' ', style: 'signatureLabel' },
                    { text: '', margin: [0, 30, 0, 0] }, // Space for signature
                    { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                    createArabicTextBlock(`${contractLabels.date.ar}: _______________`, 'signatureDate') || { text: ' ', style: 'signatureDate' }
                  ]
                },
                {
                  stack: [
                    createArabicTextBlock(contractLabels.secondPartySignature.ar, 'signatureLabel') || { text: ' ', style: 'signatureLabel' },
                    { text: '', margin: [0, 30, 0, 0] }, // Space for signature
                    { text: '________________________', alignment: 'center', margin: [0, 0, 0, 5] },
                    createArabicTextBlock(`${contractLabels.date.ar}: _______________`, 'signatureDate') || { text: ' ', style: 'signatureDate' }
                  ]
                }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        }
      ],
      
      // Enhanced styles for Arabic legal document
      styles: {
        companyName: {
          fontSize: 18,
          bold: true,
          font: 'Roboto',
          color: colors.primary,
          alignment: 'center'
        },
        contractTitle: {
          fontSize: 16,
          bold: true,
          font: 'Roboto',
          color: colors.text,
          alignment: 'center'
        },
        contractInfo: {
          fontSize: 11,
          font: 'Roboto',
          color: colors.text,
          alignment: 'right'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          font: 'Roboto',
          color: colors.primary,
          alignment: 'right'
        },
        partyInfo: {
          fontSize: 12,
          font: 'Roboto',
          color: colors.text,
          alignment: 'right'
        },
        labelStyle: {
          fontSize: 11,
          bold: true,
          font: 'Roboto',
          color: colors.textLight,
          alignment: 'right'
        },
        valueStyle: {
          fontSize: 11,
          font: 'Roboto',
          color: colors.text,
          alignment: 'right'
        },
        contractTerms: {
          fontSize: 11,
          font: 'Roboto',
          color: colors.text,
          alignment: 'right'
        },
        financialValue: {
          fontSize: 12,
          bold: true,
          font: 'Roboto',
          color: colors.primary,
          alignment: 'right'
        },
        termText: {
          fontSize: 10,
          font: 'Roboto',
          color: colors.text,
          alignment: 'right',
          margin: [0, 0, 0, 8]
        },
        signatureLabel: {
          fontSize: 11,
          bold: true,
          font: 'Roboto',
          color: colors.text,
          alignment: 'center'
        },
        signatureDate: {
          fontSize: 10,
          font: 'Roboto',
          color: colors.textLight,
          alignment: 'center'
        },
        legalNotice: {
          fontSize: 8,
          font: 'Roboto',
          color: colors.textLight,
          alignment: 'center'
        },
        pageNumber: {
          fontSize: 8,
          font: 'Roboto',
          color: colors.textLight,
          alignment: 'center'
        }
      },
      
      defaultStyle: {
        font: 'Roboto',
        fontSize: 11,
        rtl: true,
        alignment: 'right'
      }
    };

    // Generate and download the PDF
    function validateTables(docDef: any) {
      function checkTable(table: any) {
        if (table.widths && table.body) {
          table.body.forEach((row: any, idx: any) => {
            if (!Array.isArray(row) || row.length !== table.widths.length) {
              console.error('Table row/width mismatch at row', idx, row, table.widths);
              throw new Error('Table row/width mismatch at row ' + idx + ': ' + JSON.stringify(row) + ' widths: ' + JSON.stringify(table.widths));
            }
          });
        }
      }
      function walk(obj: any) {
        if (obj && typeof obj === 'object') {
          if (obj.table) checkTable(obj.table);
          Object.values(obj).forEach(walk);
        }
      }
      walk(docDef);
    }
    validateTables(docDefinition);
    function validateTextNodes(obj: any, path = '') {
      if (Array.isArray(obj)) {
        obj.forEach((item, idx) => validateTextNodes(item, `${path}[${idx}]`));
      } else if (obj && typeof obj === 'object') {
        if ('text' in obj && typeof obj.text !== 'string') {
          console.error('Invalid text node at', path, obj);
          throw new Error('Invalid text node at ' + path + ': ' + JSON.stringify(obj));
        }
        Object.entries(obj).forEach(([key, value]) => validateTextNodes(value, path + '.' + key));
      }
    }
    validateTextNodes(docDefinition);
    const fileName = prepareArabicForPDF(`عقد-إيجار-مركبة-${agreement.agreement_number || 'غير-محدد'}.pdf`);
    pdfMake.createPdf(docDefinition).download(fileName);
    return true;
  } catch (error) {
    console.error('Error generating Arabic vehicle rental contract PDF:', error);
    return false;
  }
}