
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
  terms: {
    ar: [
      '1. يعتبر التمهيد السابق جزء لا يتجزأ من هذا العقد ويفسر ضمن بنوده وشروطه.',
      '2. يكون الدفع في أول يوم من كل شهر، وفي حال التأخير عن سداد القيمة الإيجارية أو في حال تخلف الطرف الثاني عن سداد أي من الدفعات الشهرية المستحقة لأي سبب كان، تُطبق على الطرف الثاني دون حاجة إلى إنذار أو إعذار من قبل الطرف الأول غرامة تأخير مبلغ قدره 200 ريال قطري عن كل يوم تأخير من تاريخ الاستحقاق حتى تاريخ سداد المتأخرات، وتدفع المتأخرات مع الغرامات على حد سواء.',
      `3. اتفق الطرفان على أن تكون مدة هذا العقد حتى تاريخ {endDate} تبدأ اعتباراً من تاريخ النفاذ المذكور في بداية هذا العقد، وغير قابلة للتجديد، وينتهي العقد بانتهاء مدته، كما لا يجوز للطرف الثاني أن ينهي العقد قبل انتهاء مدته إلا بموافقة خطية من الطرف الأول.`,
      '4. يدفع الطرف الثاني للطرف الأول قيمة إيجارية مبلغ كما هو موضح في الشروط المالية طبقاً لجدول الدفعات المرفق بهذا العقد. يلتزم الطرف الثاني بسداد كامل دفعات الإيجار المحددة شهرياً وبصورة منتظمة، ولا يجوز له خصم أي مبلغ منها مقابل رسوم أو ضرائب أو غير ذلك.',
      '5. يلتزم الطرف الثاني عند التوقيع على هذا العقد أن يسلم الطرف الأول قيمة كما هو موضح في الشروط المالية كوديعة ضمان ("وديعة الضمان") وذلك لضمان تنفيذ الطرف الثاني لالتزاماته بموجب هذا العقد ولتعويض الطرف الأول عن أي خسائر أو أضرار قد يتسبب بها الطرف الثاني أو وكلائه أو ممثليه للمركبة طوال مدة هذا العقد. بالإضافة إلى ذلك، يحق للطرف الأول أن يخصم من وديعة الضمان أي مبالغ يدين بها الطرف الثاني للطرف الأول بموجب هذا العقد، ولا يمكن استرجاع مبلغ الضمان بعد إنهاء العقد من قبل الطرف الثاني.',
      '6. يقر الطرف الثاني بأنه بمجرد توقيعه على هذا العقد يكون قد عاين المركبة المؤجرة إليه معاينة تامة نافية للجهالة وقبل بها بحالتها الراهنة وأنه تحقق بأنها بحالة جيدة خالية من أي عيوب، وأنها بكفاءة عالية ولا يحق له الادعاء بعد ذلك بوجود عيب فيها. لا يقدم الطرف الأول أي ضمانات، صريحة أو ضمنية، فيما يتعلق بالمركبة المؤجرة ويتحمل الطرف الثاني وحده المسؤولية عن حالة المركبة المؤجرة.',
      '7. مع عدم الإخلال بأحكام المواد 4 و6 أعلاه، يلتزم الطرف الأول عند التوقيع على هذا العقد بتسليم الطرف الثاني المركبة المؤجرة إليه طبقاً لنموذج محضر التسليم المرفق بهذا العقد ويوقع عليه من كلا الطرفين، وفي حال إرجاع السيارة أو إنهاء العقد يكون الطرف الثاني مسؤول عن أي تلف أو مخالفة أو أضرار على السيارة أو تسبب بها للغير.',
      '8. عند التوقيع على هذا العقد يقر ويضمن الطرف الثاني بعد أن أصبحت المركبة في حيازته أنه المسؤول الوحيد عن:',
      '8.1 يتحمل الطرف الثاني كافة المخالفات المرورية التي تقع خلال مدة الإيجار ويجب تسويتها خلال 30 يومًا كحد أقصى من تاريخ وقوع المخالفة، وبالعدم يحق للطرف الأول إنهاء العقد وتحميله قيمة المخالفات.',
      '8.2 جميع مصاريف تشغيل المركبة من وقود وزيوت وقطع الغيار الاستهلاكية ومغيّر ذلك.',
      '8.3 جميع أعمال الصيانة الدورية وغير الدورية والإصلاح وإجراء الفحص الفني للمركبة المؤجرة في مواعيدها والالتزام بكافة متطلبات الفحص الفني وضمان اجتياز المركبة المؤجرة للفحص الفني طوال مدة هذا العقد.',
      '8.4 يقر الطرف الثاني بأنه وحده المسؤول عن هلاك المركبة سواء كان هلاكاً كلياً أو جزئياً، والناتج عن إهماله أو تقصيره ولو كان بسبب الغير، وبالتالي فإن الطرف الثاني يتعهد بدفع تكلفة هذا الهلاك.',
      '8.5 يقر الطرف الثاني بأنه سيقود المركبة بنفسه ولمنفعته الشخصية ولن يسمح لأحد غيره بقيادتها والانتفاع بها طوال مدة هذا العقد، وفي حال مخالفته لذلك يحق للطرف الأول إنهاء العقد دون إنذار أو إعذار أو حكم من المحكمة.',
      '9. يلتزم الطرف الثاني بتوفير بوليصة تأمين شاملة ضد جميع الأخطار للمركبة المؤجرة من شركة تأمين معتمدة والحفاظ عليها سارية الصلاحية طوال مدة هذا العقد.',
      '10. بموجب هذا العقد إذا رغب الطرف الثاني شراء المركبة بنهاية مدة العقد يجب أن يخطر الطرف الأول كتابياً برغبته بشراء المركبة المبين بيانها أعلاه محل العقد، علماً بأن قيمة السيارة مساوية لقيمة الإيجار الشهري، ويحق للطرف الثاني الانتفاع بهذا العرض فقط مع نهاية العقد.',
      '11. إن أي من الأفعال التالية تشكل حدث إخلال من قبل الطرف الثاني:',
      '11.1 إخفاق الطرف الثاني في سداد أي من الدفعات الإيجارية أو أي مبلغ مستحق بموجب هذا العقد في مواعيد استحقاقه.',
      '11.2 خرق الطرف الثاني لأي من التزاماته الأخرى غير المالية المفروضة بموجب هذا العقد.',
      '11.3 إفلاس أو إعسار الطرف الثاني.',
      '11.4 هجر أو ترك المركبة.',
      '11.5 مغادرة أو ترحيل الطرف الثاني من البلاد بصورة نهائية.',
      '11.6 عدم التزام المستأجر بدفع كل مخالفة مرورية مرتكبة أثناء حيازته السيارة في غضون 30 يوم من تاريخ ارتكابها.',
      '12. في حال وقوع حدث الإخلال من قبل الطرف الثاني يحق للطرف الأول دون حاجة إلى إنذار أو إعذار أو حكم من المحكمة:',
      '12.1 إنهاء العقد وسحب السيارة بواسطة أحد موظفي الشركة فوراً، كما يلتزم الطرف الثاني بدفع القيمة الإيجارية المستحقة وبتعويض الطرف الأول مقابل إنهاء العقد بدفع غرامة 5000 ريال قطري، ولا يحق للطرف الثاني المطالبة بأي مبالغ مدفوعة قبل إنهاء العقد.',
      '12.2 يلتزم الطرف الثاني على الفور بتسليم المركبة المؤجرة إلى الطرف الأول، ويدفع الطرف الثاني تعويضاً للطرف الأول يعادل 200 ريال عن كل يوم تأخير حتى تسليمها إلى الطرف الأول. يستحق الطرف الأول الغرامات المفروضة عن التأخر في السداد والأجرة اليومية للسيارة ويكون مجموعهما تعويضاً عما لحق الطرف الأول من أضرار.',
      '13. في حال مخالفة الطرف الثاني لأي من بنود هذا العقد يحق للطرف الأول إنهاء العقد دون الحاجة إلى إنذار أو إعذار أو حكم من المحكمة وسحب السيارة بواسطة موظفي الشركة عن طريق نسخة المفتاح الموجود لدى الشركة، ويكون الطرف الثاني ملزماً بتسليم نسخته للطرف الأول أو يتحمل قيمتها. كما يقر ويوافق الطرف الثاني بعدم مسؤولية الطرف الأول عن أي أغراض أو مبالغ داخل السيارة عند سحبها، ويتنازل المستأجر عن أي مطالبات قانونية تتعلق بالأغراض الشخصية المتبقية في السيارة في حالة استردادها نتيجة لعدم الدفع أو خرق العقد، ولا تعد الشركة مسؤولة مدنياً أو جنائياً.',
      '14. لا يجوز للطرف الثاني في حال قرر سداد قيمة العقد وإنهاء العقد قبل تاريخ الانتهاء، ويلتزم الطرف الثاني بجدول السداد، وعليه إخطار الطرف الأول قبلها بشهر ما إذا أراد خلاصها قبل ذلك لأخذ الموافقة.',
      '14.1 القانون الحاكم والاختصاص القضائي: يخضع هذا العقد من جميع النواحي للقوانين المطبقة في دولة قطر. يوافق الطرفان على الاختصاص القضائي أمام محاكم دولة قطر. يتفق الطرفان على أن هذا الاختيار للقانون والمكان والولاية القضائية ليس اختيارياً، ولكنه إلزامي بطبيعته.',
      '14.2 يجوز أن تكون جميع الاتصالات أو الإشعارات أو المراسلات المقدمة بموجب هذا عبر الواتساب أو البريد الإلكتروني أو الرسائل النصية.',
      '14.3 التنازل: لا يجوز التنازل عن هذا العقد أو الحقوق الممنوحة بموجبه أو بيعها أو تأجيرها أو نقلها كلياً أو جزئياً بواسطة الطرف الثاني دون موافقة خطية مسبقة من الطرف الأول.',
      '14.4 القابلية للفصل: إذا تم اعتبار أي حكم أو بند من هذا العقد غير قابل للتنفيذ، فيعتبر هذا العقد معدل بالقدر اللازم لجعل الحكم غير قابل للتنفيذ، وبقية العقد ساري وقابل للتنفيذ. إذا رفضت المحكمة تعديل هذا العقد على النحو المنصوص عليه في هذا البند، فإن بطلان أو عدم قابلية تنفيذ أي حكم من أحكام هذا العقد لن يؤثر على صلاحية أو قابلية تنفيذ البنود والأحكام المتبقية، والتي يجب أن يتم إنفاذها كما لو لم تكن مدرجة في هذا العقد.',
      '14.5 الاتفاق بمجمله: يشكل هذا العقد الاتفاق الكامل بين الطرفين ويحل محل أي تفاهمات سابقة أو معاصرة، سواء كانت مكتوبة أو شفهية.',
      '14.6 نسخ العقد: يجوز توقيع هذا العقد من عدة نسخ، وتشكل جميعها عقد واحد.'
    ]
  },
  
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
          stack: contractLabels.terms.ar.map((t) =>
            createArabicTextBlock(
              t.replace('{endDate}', formatDateArabic(agreement.end_date)),
              'termText'
            )
          ),
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
      
      // Enhanced styles for Arabic legal document
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
        sectionHeader: {
          fontSize: 14,
          bold: true,
          font: 'Amiri',
          color: colors.primary,
          alignment: 'right'
        },
        partyInfo: {
          fontSize: 12,
          font: 'Amiri',
          color: colors.text,
          alignment: 'right'
        },
        labelStyle: {
          fontSize: 11,
          bold: true,
          font: 'Amiri',
          color: colors.textLight,
          alignment: 'right'
        },
        valueStyle: {
          fontSize: 11,
          font: 'Amiri',
          color: colors.text,
          alignment: 'right'
        },
        contractTerms: {
          fontSize: 11,
          font: 'Amiri',
          color: colors.text,
          alignment: 'right'
        },
        financialValue: {
          fontSize: 12,
          bold: true,
          font: 'Amiri',
          color: colors.primary,
          alignment: 'right'
        },
        termText: {
          fontSize: 10,
          font: 'Amiri',
          color: colors.text,
          alignment: 'right',
          margin: [0, 0, 0, 8]
        },
        signatureLabel: {
          fontSize: 11,
          bold: true,
          font: 'Amiri',
          color: colors.text,
          alignment: 'center'
        },
        signatureDate: {
          fontSize: 10,
          font: 'Amiri',
          color: colors.textLight,
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
