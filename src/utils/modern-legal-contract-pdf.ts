/**
 * عقد إيجار قانوني محدث - يستخدم النظام الموحد الجديد
 * بدلاً من pdfMake القديم الذي يعاني من مشاكل الخطوط
 */

import { 
  generateUnifiedPDF, 
  createInfoCard, 
  createDataTable, 
  createHighlightBox,
  createSignatureSection,
  formatCurrency,
  formatDate,
  PDFConfig,
  PDFStyles 
} from './unified-pdf-generator';

interface AgreementData {
  id: string;
  agreement_number: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  total_amount: number;
  deposit_amount?: number;
  insurance_amount?: number;
  status: string;
}

interface CustomerData {
  full_name: string;
  id_number: string;
  phone_number: string;
  email?: string;
  nationality: string;
  driver_license: string;
  address?: string;
}

interface VehicleData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
  vin: string;
  engine_number?: string;
  mileage?: number;
}

interface PaymentData {
  amount: number;
  due_date: string;
  description: string;
}

/**
 * إنشاء عقد إيجار قانوني محدث
 */
export async function generateModernLegalContractPDF(
  agreement: AgreementData,
  customer: CustomerData,
  vehicle: VehicleData,
  payments: PaymentData[] = []
): Promise<void> {
  
  // معلومات أطراف العقد
  const firstPartyInfo = createInfoCard('الطرف الأول (المؤجر) - شركة العراف لتأجير السيارات', [
    { label: 'اسم الشركة', value: 'شركة العراف لتأجير السيارات ذ.م.م' },
    { label: 'السجل التجاري', value: 'رقم 123456' },
    { label: 'العنوان', value: 'أم صلال، منطقة 71، مبنى 79، الشارع التجاري - دولة قطر' },
    { label: 'صندوق البريد', value: 'ص.ب 12345 الدوحة' },
    { label: 'الهاتف', value: '+974 4444 5555' },
    { label: 'البريد الإلكتروني', value: 'info@alaraf-rentals.qa' }
  ]);

  const secondPartyInfo = createInfoCard('الطرف الثاني (المستأجر)', [
    { label: 'الاسم الكامل', value: customer.full_name },
    { label: 'رقم الهوية', value: customer.id_number },
    { label: 'رقم الهاتف', value: customer.phone_number },
    { label: 'البريد الإلكتروني', value: customer.email || 'غير محدد' },
    { label: 'الجنسية', value: customer.nationality },
    { label: 'رخصة القيادة', value: customer.driver_license },
    { label: 'العنوان', value: customer.address || 'غير محدد' }
  ]);

  // تفاصيل المركبة
  const vehicleDetails = createInfoCard('تفاصيل المركبة محل الإيجار', [
    { label: 'الماركة والموديل', value: `${vehicle.make} ${vehicle.model}` },
    { label: 'سنة الصنع', value: vehicle.year.toString() },
    { label: 'رقم اللوحة', value: vehicle.license_plate },
    { label: 'اللون', value: vehicle.color },
    { label: 'رقم الهيكل (VIN)', value: vehicle.vin },
    { label: 'رقم المحرك', value: vehicle.engine_number || 'غير محدد' },
    { label: 'عداد المسافة', value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} كم` : 'غير محدد' }
  ]);

  // تفاصيل العقد
  const contractDetails = createInfoCard('تفاصيل العقد المالية', [
    { label: 'رقم العقد', value: agreement.agreement_number },
    { label: 'تاريخ بداية الإيجار', value: formatDate(agreement.start_date) },
    { label: 'تاريخ انتهاء الإيجار', value: formatDate(agreement.end_date) },
    { label: 'الأجرة الشهرية', value: formatCurrency(agreement.rent_amount) + ' ر.ق' },
    { label: 'مبلغ التأمين', value: formatCurrency(agreement.insurance_amount || 0) + ' ر.ق' },
    { label: 'مبلغ الضمان', value: formatCurrency(agreement.deposit_amount || 0) + ' ر.ق' },
    { label: 'إجمالي قيمة العقد', value: formatCurrency(agreement.total_amount) + ' ر.ق' }
  ]);

  // جدول الدفعات المستحقة
  let paymentsTable = '';
  if (payments.length > 0) {
    const paymentHeaders = ['رقم الدفعة', 'تاريخ الاستحقاق', 'المبلغ المستحق', 'الوصف'];
    const paymentRows = payments.map((payment, index) => [
      (index + 1).toString(),
      formatDate(payment.due_date),
      formatCurrency(payment.amount) + ' ر.ق',
      payment.description
    ]);

    // إضافة صف الإجمالي
    paymentRows.push([
      'الإجمالي',
      '',
      formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0)) + ' ر.ق',
      'إجمالي المبالغ المستحقة'
    ]);

    paymentsTable = `
      <h2 class="section-header">جدول الدفعات المستحقة</h2>
      ${createDataTable(paymentHeaders, paymentRows)}
    `;
  }

  // نص العقد القانوني
  const contractText = `
    <h2 class="section-header">نص عقد الإيجار</h2>
    
    <div style="text-align: justify; line-height: 2.2; font-size: 15px; margin: 30px 0;">
      <p><strong>بسم الله الرحمن الرحيم</strong></p>
      
      <p style="text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0;">
        عقد إيجار مركبة
      </p>
      
      <p>
        إنه في يوم <strong>${formatDate(new Date())}</strong> الموافق <strong>${new Date().toLocaleDateString('ar-QA')}</strong> 
        تم الاتفاق بين كل من:
      </p>
      
      <p>
        <strong>الطرف الأول (المؤجر):</strong> شركة العراف لتأجير السيارات ذ.م.م، المسجلة في دولة قطر 
        بموجب السجل التجاري رقم 123456، والكائن مقرها الرئيسي بأم صلال، منطقة 71، مبنى 79، الشارع التجاري.
      </p>
      
      <p>
        <strong>الطرف الثاني (المستأجر):</strong> السيد/ة <strong>${customer.full_name}</strong>، 
        حامل/ة هوية رقم <strong>${customer.id_number}</strong>، 
        جنسية <strong>${customer.nationality}</strong>، 
        رخصة قيادة رقم <strong>${customer.driver_license}</strong>.
      </p>
      
      <p style="font-weight: bold; color: #dc2626; background: #fef2f2; padding: 15px; border-right: 4px solid #dc2626;">
        وقد اتفق الطرفان على ما يلي:
      </p>
    </div>
  `;

  // بنود العقد - محسنة ومُعاد تنظيمها
  const contractTerms = `
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 25px; text-align: center; margin: 30px 0; border-radius: 15px; box-shadow: 0 8px 25px rgba(30, 58, 138, 0.3);">
      <h1 style="margin: 0; font-size: 32px; font-weight: bold;">📋 بنود وشروط العقد</h1>
      <p style="margin: 15px 0 0 0; font-size: 18px;">جميع البنود التالية ملزمة قانونياً ويجب الالتزام بها</p>
    </div>
    
    <div style="background: #f0f9ff; border: 3px solid #1e3a8a; padding: 20px; margin: 20px 0; border-radius: 12px;">
      <h3 style="color: #1e3a8a; text-align: center; margin: 0 0 15px 0; font-size: 20px;">📑 فهرس البنود</h3>
      <ul style="padding-right: 30px; line-height: 2; font-size: 16px; font-weight: bold;">
        <li style="margin: 8px 0; color: #1e3a8a;">المادة الأولى: موضوع العقد</li>
        <li style="margin: 8px 0; color: #1e3a8a;">المادة الثانية: مدة الإيجار</li>
        <li style="margin: 8px 0; color: #16a34a;">المادة الثالثة: بدل الإيجار والدفع</li>
        <li style="margin: 8px 0; color: #eab308;">المادة الرابعة: التزامات المستأجر</li>
        <li style="margin: 8px 0; color: #dc2626;">المادة الخامسة: المخالفات والغرامات</li>
        <li style="margin: 8px 0; color: #64748b;">المادة السادسة: فسخ العقد وإنهاؤه</li>
        <li style="margin: 8px 0; color: #f59e0b;">المادة السابعة: القانون المطبق والاختصاص القضائي</li>
        <li style="margin: 8px 0; color: #16a34a;">المادة الثامنة: أحكام عامة</li>
      </ul>
    </div>
    
    <div style="text-align: justify; line-height: 2.2; font-size: 15px; margin: 20px 0;">
      
      <div style="margin: 25px 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; border-right: 6px solid #1e3a8a; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="color: #1e3a8a; margin-bottom: 15px; font-size: 18px; font-weight: bold;">📋 المادة الأولى: موضوع العقد</h3>
        <p style="background: white; padding: 15px; border-radius: 8px; margin: 0;">
          يؤجر الطرف الأول للطرف الثاني المركبة المبينة أوصافها في هذا العقد، وهي مركبة 
          <strong style="color: #dc2626;">${vehicle.make} ${vehicle.model}</strong> موديل <strong>${vehicle.year}</strong>، 
          رقم اللوحة <strong style="color: #dc2626;">${vehicle.license_plate}</strong>، 
          رقم الهيكل <strong>${vehicle.vin}</strong>، 
          اللون <strong>${vehicle.color}</strong>. والمركبة المذكورة هي ملك للطرف الأول وفي حالة جيدة وصالحة للاستعمال.
        </p>
      </div>
      
      <div style="margin: 25px 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; border-right: 6px solid #1e3a8a; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="color: #1e3a8a; margin-bottom: 15px; font-size: 18px; font-weight: bold;">⏰ المادة الثانية: مدة الإيجار</h3>
        <p style="background: white; padding: 15px; border-radius: 8px; margin: 0;">
          مدة الإيجار من تاريخ <strong style="color: #dc2626;">${formatDate(agreement.start_date)}</strong> 
          وحتى تاريخ <strong style="color: #dc2626;">${formatDate(agreement.end_date)}</strong>، 
          وتكون قابلة للتجديد بموافقة الطرفين. وينتهي العقد تلقائياً بانتهاء المدة المحددة دون الحاجة إلى إنذار.
        </p>
      </div>
      
      <div style="margin: 25px 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; border-right: 6px solid #1e3a8a; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="color: #1e3a8a; margin-bottom: 15px; font-size: 18px; font-weight: bold;">💰 المادة الثالثة: بدل الإيجار والدفع</h3>
        <p style="background: white; padding: 15px; border-radius: 8px; margin: 0;">
          يلتزم الطرف الثاني بدفع أجرة شهرية قدرها <strong style="color: #dc2626; font-size: 16px;">${formatCurrency(agreement.rent_amount)} ريال قطري</strong> 
          شهرياً، تدفع مقدماً في بداية كل شهر. كما يلتزم بدفع مبلغ التأمين قدره 
          <strong style="color: #dc2626;">${formatCurrency(agreement.insurance_amount || 0)} ريال قطري</strong> 
          ومبلغ الضمان قدره <strong style="color: #dc2626;">${formatCurrency(agreement.deposit_amount || 0)} ريال قطري</strong>.
        </p>
      </div>
      
      <div style="margin: 25px 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; border-right: 6px solid #1e3a8a; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="color: #1e3a8a; margin-bottom: 15px; font-size: 18px; font-weight: bold;">📜 المادة الرابعة: التزامات المستأجر</h3>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 0;">
          <p style="margin-bottom: 10px; font-weight: bold; color: #1e3a8a;">يلتزم الطرف الثاني بما يلي:</p>
          <ul style="padding-right: 25px; line-height: 1.8;">
            <li style="margin: 8px 0;"><strong>الاستخدام المشروع:</strong> عدم استخدام المركبة في أغراض غير مشروعة أو مخالفة للقانون</li>
            <li style="margin: 8px 0;"><strong>قوانين المرور:</strong> الالتزام الكامل بقوانين المرور والسلامة العامة</li>
            <li style="margin: 8px 0;"><strong>عدم التأجير من الباطن:</strong> عدم تأجير المركبة لطرف ثالث دون موافقة كتابية من المؤجر</li>
            <li style="margin: 8px 0;"><strong>الصيانة:</strong> الحفاظ على المركبة وإجراء الصيانة الدورية على نفقته الخاصة</li>
            <li style="margin: 8px 0;"><strong>الإبلاغ الفوري:</strong> إبلاغ المؤجر فوراً عن أي حادث أو عطل أو مخالفة</li>
            <li style="margin: 8px 0;"><strong>المخالفات المرورية:</strong> دفع قيمة جميع المخالفات المرورية المترتبة على استخدامه للمركبة</li>
            <li style="margin: 8px 0;"><strong>التأمين:</strong> الحفاظ على سريان التأمين الشامل للمركبة طوال مدة العقد</li>
          </ul>
        </div>
      </div>
      
      <div style="margin: 25px 0; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 25px; border-radius: 12px; border-right: 6px solid #dc2626; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="color: #dc2626; margin-bottom: 15px; font-size: 18px; font-weight: bold;">⚠️ المادة الخامسة: المخالفات والغرامات</h3>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 0;">
          <p style="margin-bottom: 15px; font-weight: bold; color: #dc2626;">في حالة مخالفة أي من بنود هذا العقد:</p>
          <ul style="padding-right: 25px; line-height: 1.8;">
            <li style="margin: 8px 0;"><strong>التأخير في الدفع:</strong> غرامة قدرها <strong style="color: #dc2626;">120 ريال قطري يومياً</strong> عن كل يوم تأخير بعد 7 أيام من تاريخ الاستحقاق</li>
            <li style="margin: 8px 0;"><strong>التأخير لأكثر من شهر:</strong> يحق للمؤجر استرداد المركبة فوراً مع احتفاظه بجميع المبالغ المدفوعة</li>
            <li style="margin: 8px 0;"><strong>استخدام غير مشروع:</strong> فسخ العقد فوراً مع تحميل المستأجر جميع الأضرار والمسؤوليات القانونية</li>
            <li style="margin: 8px 0;"><strong>عدم إرجاع المركبة:</strong> غرامة يومية قدرها <strong style="color: #dc2626;">200 ريال قطري</strong> عن كل يوم تأخير في الإرجاع</li>
          </ul>
        </div>
      </div>
      
      <div style="margin: 25px 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; border-right: 6px solid #1e3a8a; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="color: #1e3a8a; margin-bottom: 15px; font-size: 18px; font-weight: bold;">🚫 المادة السادسة: فسخ العقد وإنهاؤه</h3>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 0;">
          <p style="margin-bottom: 15px; font-weight: bold; color: #1e3a8a;">شروط فسخ العقد:</p>
          <ul style="padding-right: 25px; line-height: 1.8;">
            <li style="margin: 8px 0;"><strong>الفسخ بالاتفاق:</strong> يحق لأي من الطرفين فسخ العقد بإشعار كتابي مدته 30 يوماً</li>
            <li style="margin: 8px 0;"><strong>الفسخ الفوري:</strong> يحق للمؤجر فسخ العقد فوراً في حالة عدم دفع الأجرة لمدة شهر</li>
            <li style="margin: 8px 0;"><strong>مخالفة البنود:</strong> فسخ فوري في حالة مخالفة أي من بنود العقد الجوهرية</li>
            <li style="margin: 8px 0;"><strong>الوفاة أو العجز:</strong> ينتهي العقد تلقائياً في حالة وفاة المستأجر أو عجزه الكامل</li>
            <li style="margin: 8px 0;"><strong>إرجاع المركبة:</strong> يلتزم المستأجر بإرجاع المركبة في الحالة التي تسلمها عليها</li>
          </ul>
        </div>
      </div>
      
      <div style="margin: 25px 0; background: linear-gradient(135deg, #fef7e6 0%, #fed7aa 100%); padding: 25px; border-radius: 12px; border-right: 6px solid #ea580c; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="color: #ea580c; margin-bottom: 15px; font-size: 18px; font-weight: bold;">⚖️ المادة السابعة: القانون المطبق والاختصاص القضائي</h3>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 0;">
          <ul style="padding-right: 25px; line-height: 1.8; list-style: none;">
            <li style="margin: 12px 0; padding: 10px; background: #fef7e6; border-radius: 6px;"><strong>🏛️ القانون المطبق:</strong> يخضع هذا العقد لقوانين دولة قطر النافذة</li>
            <li style="margin: 12px 0; padding: 10px; background: #fef7e6; border-radius: 6px;"><strong>⚖️ الاختصاص القضائي:</strong> تختص المحاكم القطرية المختصة بنظر أي نزاع ينشأ عن هذا العقد</li>
            <li style="margin: 12px 0; padding: 10px; background: #fef7e6; border-radius: 6px;"><strong>🌐 اللغة:</strong> النص العربي لهذا العقد هو المعتمد في التفسير والتطبيق</li>
            <li style="margin: 12px 0; padding: 10px; background: #fef7e6; border-radius: 6px;"><strong>📋 الأولوية:</strong> في حالة التعارض، تكون الأولوية للنصوص المكتوبة في هذا العقد</li>
          </ul>
        </div>
      </div>

      <div style="margin: 30px 0; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 12px; border: 3px solid #16a34a; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <h3 style="color: #16a34a; margin-bottom: 15px; font-size: 18px; font-weight: bold; text-align: center;">✅ المادة الثامنة: أحكام عامة</h3>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 0;">
          <ul style="padding-right: 25px; line-height: 1.8;">
            <li style="margin: 10px 0;"><strong>سرية المعلومات:</strong> يلتزم الطرفان بالحفاظ على سرية جميع المعلومات المتبادلة</li>
            <li style="margin: 10px 0;"><strong>القوة القاهرة:</strong> لا يتحمل أي من الطرفين مسؤولية التأخير الناتج عن ظروف القوة القاهرة</li>
            <li style="margin: 10px 0;"><strong>التعديل:</strong> لا يجوز تعديل أي بند من بنود هذا العقد إلا بموافقة كتابية من الطرفين</li>
            <li style="margin: 10px 0;"><strong>الإشعارات:</strong> جميع الإشعارات تكون كتابية وترسل للعناوين المذكورة في العقد</li>
            <li style="margin: 10px 0;"><strong>صحة العقد:</strong> إذا أصبح أي بند باطلاً، يبقى باقي العقد نافذاً</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // إقرار وتوقيع
  const acknowledgment = createHighlightBox(
    `
      <h4 style="text-align: center; margin-bottom: 20px;">إقرار الطرفين</h4>
      <p style="text-align: justify; line-height: 2;">
        لقد اطلع الطرفان على جميع بنود هذا العقد وفهماها تماماً، ووافقا عليها دون إكراه أو إجبار، 
        وتم توقيع هذا العقد في تاريخ <strong>${formatDate(new Date())}</strong> من نسختين أصليتين، 
        لكل طرف نسخة للعمل بموجبها.
      </p>
      <br>
      <p style="text-align: center; font-weight: bold; color: #dc2626;">
        والله على ما نقول وكيل
      </p>
    `,
    'success'
  );

  // محتوى العقد - البنود في المقدمة والأهمية القصوى
  const content = `
    ${contractText}
    
    <div style="page-break-before: always; margin: 30px 0;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 25px; text-align: center; margin: 30px 0; border-radius: 15px; box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔴 تنبيه مهم جداً</h1>
        <p style="margin: 15px 0 0 0; font-size: 18px; font-weight: bold;">
          يُرجى قراءة جميع البنود والشروط التالية بعناية فائقة قبل التوقيع<br>
          هذه البنود ملزمة قانونياً وتحكم العلاقة التعاقدية بين الطرفين
        </p>
      </div>
    </div>
    
    ${contractTerms}
    
    <div style="page-break-before: always; margin: 30px 0;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; text-align: center; margin: 30px 0; border-radius: 12px;">
        <h2 style="margin: 0; font-size: 24px;">📋 معلومات أطراف العقد والتفاصيل</h2>
      </div>
      
      <h3 class="section-header" style="background: #1e3a8a; color: white; padding: 12px; border-radius: 8px;">معلومات أطراف العقد</h3>
      <div class="info-grid">
        ${firstPartyInfo}
        ${secondPartyInfo}
      </div>
      
      <h3 class="section-header" style="background: #16a34a; color: white; padding: 12px; border-radius: 8px; margin-top: 30px;">تفاصيل المركبة والعقد</h3>
      <div class="info-grid">
        ${vehicleDetails}
        ${contractDetails}
      </div>
    </div>
    
    ${paymentsTable}
    
    <div style="page-break-before: always; margin: 30px 0;">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 20px; text-align: center; margin: 30px 0; border-radius: 12px;">
        <h2 style="margin: 0; font-size: 24px;">✅ إقرار الطرفين والتوقيع</h2>
      </div>
      
      ${acknowledgment}
      
      ${createSignatureSection()}
    </div>
  `;

  // تكوين PDF
  const config: PDFConfig = {
    title: `عقد إيجار مركبة رقم ${agreement.agreement_number}`,
    filename: `عقد-إيجار-${agreement.agreement_number}-${customer.full_name}-${new Date().toISOString().split('T')[0]}`,
    rtl: true,
    companyInfo: true,
    includeFooter: true
  };

  // أنماط مخصصة للعقد القانوني
  const styles: PDFStyles = {
    primaryColor: '#1e3a8a',
    secondaryColor: '#64748b',
    backgroundColor: '#f1f5f9'
  };

  // إنشاء PDF
  await generateUnifiedPDF({
    config,
    content,
    styles
  });
} 