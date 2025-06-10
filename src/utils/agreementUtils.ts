
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
    configurePdfMakeFonts();
  }
}

// Arabic labels for vehicle rental contract
const contractLabels = {
  // Header
  contractTitle: { ar: 'عقد إيجار مركبة' },
  companyName: { ar: 'شركة العراف لتأجير السيارات ذ.م.م' },
  
  // Parties
  firstParty: { ar: 'الطرف الأول: شركة العراف لتاجير السيارات ذ م م، وهي شركة محدودة المسؤولية مسجلة اصولا طبقا لقوانين دولة قطر، سجل تجاري رقم 146832 ومقرها الكائن في منطقة ام صلال علي، الدوحة، قطر، ص ب 36126 . ويمثلها قانونا السيد/ خميس هاشم الجبر بصفته المدير المخول بالتوقيع للشركة، ويشار اليه لاحقا بلفظ المؤجر | الطرف الاول' },
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
  
  // Terms and conditions - Comprehensive 15 articles
  termsConditions: { ar: 'الشروط والأحكام' },
  term1: { ar: '1. يعتبر التمهيد السابق جزأ لا يتجزأ من هذا العقد ويفسر ضمن بنوده وشروطه.' },
  term2: { ar: '2. يكون الدفع في أول يوم من كل شهر و في حال التأخير عن سداد القيمة الإيجارية او في حال تخلف الطرف الثاني عن سداد أي من الدفعات الشهرية المستحقة لاي سبب كان تطبق على الطرف الثاني دون حاجة الى اعذار او انذار من قبل الطرف الأول غرامة تأخير مبلغ قدره 200 ريال قطري عن كل يوم تأخير من تاريخ الاستحقاق حتى تاريخ سدادة المتأخرات وتدفع المتأخرات مع الغرامات على حد سواء.' },
  term3: { ar: '3. اتفق الطرفان على ان تكون مدة هذا العقد تبدأ اعتبارا من تاريخ النفاذ المذكور في بداية هذا العقد، غير قابل للتجديد وينتهي العقد بانتهاء مدته كما لا يجوز للطرف الثاني ان ينهي العقد قبل انتهاء مدته الا بموافقة كتابية من الطرف الأول.' },
  term4: { ar: '4. يدفع الطرف الثاني للطرف الأول قيمة ايجارية مبلغ كما هو موضح في الشروط المالية طبقا لجدول الدفعات المرفق بهذا العقد. يلتزم الطرف الثاني بسداد كامل دفعات الايجار المحددة شهريا وبصورة منتظمة ولا يجوز له خصم أي مبلغ منها مقابل رسوم او ضرائب او غير ذلك.' },
  term5: { ar: '5. يكون الدفع في أول يوم من كل شهر و في حال التأخير عن سداد القيمة الإيجارية او في حال تخلف الطرف الثاني عن سداد أي من الدفعات الشهرية المستحقة لاي سبب كان تطبق على الطرف الثاني دون حاجة الى اعذار او انذار من قبل الطرف الأول غرامة تأخير مبلغ قدره 200 ريال قطري عن كل يوم تأخير من تاريخ الاستحقاق حتى تاريخ سدادة المتأخرات وتدفع المتأخرات مع الغرامات على حد سواء.' },
  term6: { ar: '6. يلتزم الطرف الثاني عند التوقيع على هذا العقد ان يسلم الطرف الأول قيمة كما هو موضح في الشروط المالية كوديعة ضمان ("وديعة الضمان") وذلك لضمان تنفيذ الطرف الثاني لالتزاماته بموجب هذا العقد ولتعويض الطرف الأول عن اية خسائر او اضرار قد يتسبب بها الطرف الثاني او وكلائه او ممثليه للمركبة طوال مدة هذا العقد. بالإضافة الى ذلك، يحق للطرف الأول ان يخصم من وديعة الضمان اية مبالغ يدين بها الطرف الثاني للطرف الأول بموجب هذا العقد ولا يمكن استرجاع مبلغ الضمان بعد إنهاء العقد من قبل الطرف الثاني.' },
  term7: { ar: '7. يقر الطرف الثاني انه بمجرد توقيعه على هذا العقد يكون قد عاين المركبة المؤجرة اليه معاينة تامة نافية للجهالة وقبل بها بحالتها الراهنة وانه تحقق بانها بحالة جيدة خالية من اية عيوب، وانها بكفاءة عالية ولا يحق له الادعاء بعد ذلك بوجود عيب فيها. لا يقدم الطرف الاول أي ضمانات، صريحة أو ضمنية، فيما يتعلق بالمركبة المؤجرة و يتحمل الطرف الثاني وحده المسؤولية عن حالة المركبة المؤجرة.' },
  term8: { ar: '8. مع عدم الاخلال بأحكام المادتين 4 و 6 أعلاه، يلتزم الطرف الأول عند التوقيع على هذا العقد بتسليم الطرف الثاني المركبة المؤجرة اليه طبقا لنموذج محضر التسليم المرفق بهذا العقد ويوقع عليه من كلا الطرفين وفي حال إرجاع السيارة او إنهاء العقد يكون الطرف الثاني مسوول عن أي تلف او مخالفة أو أضرار على السيارة أو تسبب بها للغير.' },
  term9: { ar: '9. عند التوقيع على هذا العقد يقر ويضمن الطرف الثاني بعد ان أصبحت المركبة في حيازته انه المسؤول الوحيد عن: 9.1 يتحمل الطرف الثاني كافة المخالفات المرورية التي تقع خلال مدة الإيجار ويجب تسويتها خلال 30 يومًا كحد أقصى من تاريخ وقوع المخالفة وبالعدم يحق للطرف الأول إنهاء العقد وتحميلة قيمة المخالفات. 9.2 جميع مصاريف تشغيل المركبة من وقود وزيوت وقطع الغيار الاستهلاكية ومغير ذلك. 9.3 جميع اعمال الصيانة الدورية وغير الدورية والإصلاح واجراء الفحص الفني للمركبة المؤجرة في مواعيدها والالتزام بكافة متطلبات الفحص الفني وضمان اجتياز المركبة المؤجرة للفحص الفني طوال مدة هذا العقد. 9.4 يقر الطرف الثاني بانه وحده المسؤول عن هلاك المركبة سواء كان هلاكا كليا او جزئيا، والناتج عن اهماله او تقصيره ولو كان بسبب الغير وبالتالي فان الطرف الثاني يتعهد بدفع تكلفة هذا الهلاك. 9.5 يقر الطرف الثاني انه سيقود المركبة بنفسه ولمنفعته الشخصية ولن يسمح لاحد غيره بقيادتها والانتفاع بها طوال مدة هذا العقد و في حال مخالفة ذلك يحق للطرف الأول انهاء العقد دون اعذار أو انذار او حكم محكمة.' },
  term10: { ar: '10. يلتزم الطرف الثاني بتوفير بوليصة تامين شاملة ضد جميع الاخطار للمركبة المؤجرة من شركة تامين معتمدة والحفاظ عليها سارية الصلاحية طوال مدة هذا العقد.' },
  term11: { ar: '11. بموجب هذا العقد إذا رغب الطرف الثاني شراء المركبة بنهاية مدة العقد يجب ان يخطر الطرف الاول كتابيا برغبته بشراء المركبة المبين بيانها اعلاه محل العقد علما بأن قيمة السيارة مساوية لقيمة الايجار الشهري، يحق للطرف للثاني الانتفاع بهذا العرض فقط مع نهاية العقد.' },
  term12: { ar: '12. ان أي من الأفعال التالية تشكل حدث اخلال من قبل الطرف الثاني: 12.1 الإخفاق في الدفع: اخفاق الطرف الثاني في سداد أي من الدفعات الايجارية او أي مبلغ مستحق بموجب هذا العقد في مواعيد استحقاقها 12.2 خرق العقد: خرق الطرف الثاني لاي من التزاماته الأخرى غير المالية المفروضة بموجب هذا العقد 12.3 افلاس او اعسار الطرف الثاني. 12.4 هجر او ترك المركبة. 12.5 مغادرة او ترحيل الطرف الثاني من البلاد بصورة نهائية. 12.6 عدم التزام المستأجر بدفع كل مخالفة مرورية مرتكبة أثناء حيازته السيارة في غضون 30 يوم من تاريخ ارتكابها.' },
  term13: { ar: '13. في حال وقوع حدث الاخلال من قبل الطرف الثاني يحق للطرف الأول دون حاجة الى اعذار او انذار او حكم محكمة: انهاء العقد وسحب السيارة بواسطة أحد موظفي الشركة فورا، كما يلتزم الطرف الثاني بدفع القيمة الايجارية المستحقة وبتعويض الطرف الأول مقابل إنهاء العقد بدفع غرامة 5000 ريال قطري ولايحق للطرف الثاني المطالبة باي مبالغ مدفوعة قبل إنهاء العقد 13.2 يلتزم الطرف الثاني على الفور بتسليم المركبة المؤجرة الى الطرف الأول ويدفع الطرف الثاني تعويض الى الطرف الأول يعادل 200 ريال عن كل يوم تأخير حتى تسليمها الى الطرف الأول. يستحق الطرف الأول الغرامات المفروضة عن التأخر في السداد والاجرة اليومية للسيارة ويكون مجموعهما تعويضا عما لحق الطرف الأول من أضرار. في حال مخالفة الطرف الثاني لأي من بنود هذا العقد يحق للطرف الأول إنهاء العقد دون الحاجة إلى اعذار او إنذار او حكم محكمة وسحب السيارة بواسطة موظفي الشركة عن طريق نسخة المفتاح الموجود لدى الشركة ويكون الطرف الثاني ملزم بتسليم نسختة للطرف الأول او يتحمل قيمتة. كما يقر ويوافق الطرف الثاني بعدم مسؤولية الطرف الثاني عن أي أغراض أو مبالغ دأخل السيارة عند سحبها ويتنازل المستأجر عن أي مطالبات قانونية تتعلق بالأغراض الشخصية المتبقية في السيارة في حالة استردادها نتيجة لعدم الدفع أو خرق العقد ولا تعد الشركة مسؤولة مدنيا او جنائيا.' },
  term14: { ar: '14. لا يجوز للطرف الثاني في حال قرر سداد قيمة العقد وانهاء العقد قبل تاريخ الانتهاء ويلتزم الطرف الثاني بجدول السداد وعليه اخطار الطرف الأول قبلها بشهر ما اذا اراد خلاصها قبل ذلك لأخد الموافقة.' },
  term15: { ar: '15. 15.1 القانون الحاكم والاختصاص القضائي: يخضع هذا العقد من جميع النواحي للقوانين المطبقة في دولة قطر. يوافق الطرفان على الاختصاص القضائي أمام محاكم دولة قطر. يتفق الطرفان على أن هذا الاختيار للقانون والمكان والولاية القضائية ليس اختياريا، ولكنه إلزامي بطبيعته. 15.2 يجوز أن تكون جميع الاتصالات أوالإشعارات أو المراسلات المقدمة بموجب هذا عبر الواتساب او الايميل او الرسائل النصية 15.3 التنازل: لا يجوز التنازل عن هذا العقد أو الحقوق الممنوحة بموجبه أو بيعها أو تأجيرها أو نقلها كليًا أو جزئيًا بواسطة الطرف الثاني دون موافقة خطية مسبقة من الطرف الاول. 15.4 القابلية للفصل: إذا تم اعتبار أي حكم أو بند من هذا العقد غير قابل للتنفيذ، فسيتم اعتبار هذا العقد معدل بالقدر اللازم لجعل الحكم غير قابل للتنفيذ، وبقية العقد، ساري وقابل للتنفيذ. إذا رفضت المحكمة تعديل هذا العقد على النحو المنصوص عليه في هذا العقد، فإن بطلان أو عدم قابلية تنفيذ أي حكم من أحكام هذا العقد لن يؤثر على صلاحية أو قابلية تنفيذ البنود والأحكام المتبقية، والتي يجب أن يتم إنفاذها كما لو لم تكن مدرجة في هذا العقد. 15.5 الاتفاق بمجمله: يشكل هذا العقد الاتفاق الكامل بين الطرفين ويحل محل أي تفاهمات سابقة أو معاصرة، سواء كانت مكتوبة أو شفهية. 15.6 نسخ العقد: يجوز توقيع هذا العقد من عدة نسخ، وتشكل جميعها عقد واحد.' },
  
  // Signatures
  signatures: { ar: 'التوقيعات' },
  firstPartySignature: { ar: 'توقيع الطرف الأول' },
  secondPartySignature: { ar: 'توقيع الطرف الثاني' },
  date: { ar: 'التاريخ' },
  
  // Footer
  legalNotice: { ar: 'هذا العقد محرر باللغة العربية ويخضع للقوانين المعمول بها في دولة قطر' }
};

// Simplified color scheme
const colors = {
  primary: '#1e40af',
  secondary: '#64748b',
  text: '#334155',
  textLight: '#64748b',
  border: '#e2e8f0',
  light: '#f8fafc',
  lighter: '#f1f5f9'
};

// Helper function to format date as dd/mm/yyyy
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
    
    // Simplified document definition with NO custom fonts
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [50, 80, 50, 100],
      
      // Simple header
      header: {
        margin: [50, 30, 50, 0],
        table: {
          widths: ['*'],
          body: [[
            {
              text: contractLabels.companyName.ar,
              style: 'companyName',
              alignment: 'center'
            }
          ]]
        },
        layout: 'noBorders'
      },
      
      // Simple footer
      footer: (currentPage: number, pageCount: number) => {
        return {
          margin: [50, 20, 50, 30],
          text: `صفحة ${currentPage} من ${pageCount}`,
          style: 'pageNumber',
          alignment: 'center'
        };
      },
      
      // Simplified content without complex layouts
      content: [
        // Contract title
        {
          text: contractLabels.contractTitle.ar,
          style: 'contractTitle',
          alignment: 'center',
          margin: [0, 20, 0, 20]
        },
        
        // Contract information
        {
          text: `${contractLabels.agreementNumber.ar}: ${agreement.agreement_number || 'غير محدد'}`,
          style: 'contractInfo',
          margin: [0, 10, 0, 5]
        },
        
        {
          text: `${contractLabels.contractDate.ar}: ${formatDateArabic(currentDate)}`,
          style: 'contractInfo',
          margin: [0, 0, 0, 20]
        },
        
        // First Party
        {
          text: contractLabels.firstParty.ar,
          style: 'partyText',
          margin: [0, 10, 0, 10]
        },
        
        // Customer information
        {
          text: contractLabels.secondParty.ar,
          style: 'sectionHeader',
          margin: [0, 20, 0, 10]
        },
        
        {
          text: `${contractLabels.customerName.ar}: ${agreement.customers?.full_name || 'غير محدد'}`,
          style: 'infoText',
          margin: [0, 5, 0, 5]
        },
        
        {
          text: `${contractLabels.nationality.ar}: ${agreement.customers?.nationality || 'غير محدد'}`,
          style: 'infoText',
          margin: [0, 0, 0, 5]
        },
        
        {
          text: `${contractLabels.idNumber.ar}: ${agreement.customers?.driver_license || 'غير محدد'}`,
          style: 'infoText',
          margin: [0, 0, 0, 5]
        },
        
        {
          text: `${contractLabels.phoneNumber.ar}: ${agreement.customers?.phone_number || 'غير محدد'}`,
          style: 'infoText',
          margin: [0, 0, 0, 5]
        },
        
        {
          text: `${contractLabels.email.ar}: ${agreement.customers?.email || 'غير محدد'}`,
          style: 'infoText',
          margin: [0, 0, 0, 20]
        },
        
        // Vehicle information
        {
          text: contractLabels.vehicleDetails.ar,
          style: 'sectionHeader',
          margin: [0, 20, 0, 10]
        },
        
        {
          text: `${contractLabels.make.ar}: ${agreement.vehicles?.make || 'غير محدد'}`,
          style: 'infoText',
          margin: [0, 5, 0, 5]
        },
        
        {
          text: `${contractLabels.model.ar}: ${agreement.vehicles?.model || 'غير محدد'}`,
          style: 'infoText',
          margin: [0, 0, 0, 5]
        },
        
        {
          text: `${contractLabels.year.ar}: ${agreement.vehicles?.year?.toString() || 'غير محدد'}`,
          style: 'infoText',
          margin: [0, 0, 0, 5]
        },
        
        {
          text: `${contractLabels.licensePlate.ar}: ${agreement.vehicles?.license_plate || 'غير محدد'}`,
          style: 'infoText',
          margin: [0, 0, 0, 5]
        },
        
        {
          text: `${contractLabels.color.ar}: ${agreement.vehicles?.color || 'غير محدد'}`,
          style: 'infoText',
          margin: [0, 0, 0, 20]
        },
        
        // Contract terms
        {
          text: `${contractLabels.startDate.ar}: ${formatDateArabic(agreement.start_date)}`,
          style: 'infoText',
          margin: [0, 10, 0, 5]
        },
        
        {
          text: `${contractLabels.endDate.ar}: ${formatDateArabic(agreement.end_date)}`,
          style: 'infoText',
          margin: [0, 0, 0, 5]
        },
        
        {
          text: `${contractLabels.duration.ar}: ${duration} شهر`,
          style: 'infoText',
          margin: [0, 0, 0, 20]
        },
        
        // Financial terms
        {
          text: contractLabels.financialTerms.ar,
          style: 'sectionHeader',
          margin: [0, 20, 0, 10]
        },
        
        {
          text: `${contractLabels.monthlyRent.ar}: ${formatArabicCurrency(agreement.rent_amount)}`,
          style: 'financialText',
          margin: [0, 5, 0, 5]
        },
        
        {
          text: `${contractLabels.totalAmount.ar}: ${formatArabicCurrency(agreement.total_amount)}`,
          style: 'financialText',
          margin: [0, 0, 0, 5]
        },
        
        {
          text: `${contractLabels.depositAmount.ar}: ${formatArabicCurrency(agreement.deposit_amount)}`,
          style: 'financialText',
          margin: [0, 0, 0, 30]
        },
        
        // Terms and conditions
        {
          text: contractLabels.termsConditions.ar,
          style: 'sectionHeader',
          margin: [0, 20, 0, 15]
        },
        
        // All 15 terms with simple text rendering
        ...Object.keys(contractLabels)
          .filter(key => key.startsWith('term'))
          .map(termKey => ({
            text: contractLabels[termKey as keyof typeof contractLabels].ar,
            style: 'termText',
            margin: [0, 0, 0, 8]
          })),
        
        // Signatures
        {
          text: contractLabels.signatures.ar,
          style: 'sectionHeader',
          margin: [0, 30, 0, 20]
        },
        
        {
          text: contractLabels.firstPartySignature.ar,
          style: 'signatureText',
          margin: [0, 10, 0, 30]
        },
        
        {
          text: contractLabels.secondPartySignature.ar,
          style: 'signatureText',
          margin: [0, 0, 0, 20]
        }
      ],
      
      // Simplified styles using ONLY default fonts
      styles: {
        companyName: {
          fontSize: 16,
          bold: true,
          color: colors.primary
        },
        contractTitle: {
          fontSize: 18,
          bold: true,
          color: colors.text
        },
        contractInfo: {
          fontSize: 12,
          color: colors.text
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: colors.primary
        },
        partyText: {
          fontSize: 11,
          color: colors.text,
          lineHeight: 1.4
        },
        infoText: {
          fontSize: 11,
          color: colors.text
        },
        financialText: {
          fontSize: 12,
          bold: true,
          color: colors.primary
        },
        termText: {
          fontSize: 10,
          color: colors.text,
          lineHeight: 1.3
        },
        signatureText: {
          fontSize: 11,
          color: colors.text
        },
        pageNumber: {
          fontSize: 8,
          color: colors.textLight
        }
      },
      
      defaultStyle: {
        font: 'Amiri',
        fontSize: 11,
        lineHeight: 1.3
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
