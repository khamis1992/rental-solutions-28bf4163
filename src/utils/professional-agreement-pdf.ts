/**
 * مولد PDF العقود الاحترافي - تصميم رسمي للاستخدامات الحكومية والقانونية
 * بدون ألوان - تصميم أبيض وأسود احترافي
 */

import { 
  generateUnifiedPDF, 
  createInfoCard, 
  createDataTable, 
  createHighlightBox,
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
  status: string;
  total_amount: number;
  customers?: {
    full_name?: string;
    phone_number?: string;
    nationality?: string;
    driver_license?: string;
    email?: string;
    id_number?: string;
  };
  vehicles?: {
    make?: string;
    model?: string;
    year?: number;
    license_plate?: string;
    color?: string;
    vin?: string;
  };
}

interface PaymentData {
  amount: number;
  payment_date?: string;
  due_date: string;
  status: string;
  payment_method?: string;
  description?: string;
}

interface TrafficFineData {
  violation_number: string;
  fine_amount: number;
  violation_date: string;
  status: string;
  location?: string;
  violation_type?: string;
}

/**
 * إنشاء عقد احترافي بتصميم رسمي غير ملون
 */
export async function generateProfessionalAgreementPDF(
  agreement: AgreementData,
  payments: PaymentData[] = [],
  trafficFines: TrafficFineData[] = []
): Promise<void> {
  
  // حساب الإحصائيات المالية
  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalOverdue = payments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalFines = trafficFines.reduce((sum, f) => sum + f.fine_amount, 0);

  // Header رسمي للعقد
  const contractHeader = `
    <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #000; padding-bottom: 20px;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 1px;">
        دولة قطر - شركة العراف لتأجير السيارات ذ.م.م
      </h1>
      <p style="font-size: 14px; margin: 8px 0; color: #333;">
        منطقة أم صلال علي، الدوحة، قطر - ص.ب 36126 - سجل تجاري رقم: 146832
      </p>
      <h2 style="font-size: 20px; font-weight: bold; margin: 20px 0 0 0; text-decoration: underline;">
        عقد إيجار مركبة رقم: ${agreement.agreement_number}
      </h2>
    </div>
  `;

  // معلومات أطراف العقد بتصميم رسمي
  const contractParties = `
    <div style="margin: 30px 0; border: 2px solid #000; padding: 20px;">
      <h3 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; 
                 border-bottom: 1px solid #000; padding-bottom: 10px;">
        أطراف العقد
      </h3>
      
      <div style="margin-bottom: 25px;">
        <h4 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; 
                   background: #f5f5f5; padding: 8px; border-right: 4px solid #000;">
          الطرف الأول (المؤجر):
        </h4>
        <div style="padding: 10px; border: 1px solid #ccc; background: #fafafa;">
          <p style="margin: 5px 0; line-height: 1.6;">
            <strong>اسم الشركة:</strong> شركة العراف لتأجير السيارات ذات المسؤولية المحدودة
          </p>
          <p style="margin: 5px 0; line-height: 1.6;">
            <strong>العنوان:</strong> منطقة أم صلال علي، الدوحة، دولة قطر، ص.ب 36126
          </p>
          <p style="margin: 5px 0; line-height: 1.6;">
            <strong>السجل التجاري:</strong> 146832
          </p>
          <p style="margin: 5px 0; line-height: 1.6;">
            <strong>الممثل القانوني:</strong> السيد/ خميس هاشم الجبر - المدير المخول بالتوقيع
          </p>
        </div>
      </div>
      
      <div>
        <h4 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;
                   background: #f5f5f5; padding: 8px; border-right: 4px solid #000;">
          الطرف الثاني (المستأجر):
        </h4>
        <div style="padding: 10px; border: 1px solid #ccc; background: #fafafa;">
          <p style="margin: 5px 0; line-height: 1.6;">
            <strong>الاسم الكامل:</strong> ${agreement.customers?.full_name || '___________________'}
          </p>
          <p style="margin: 5px 0; line-height: 1.6;">
            <strong>رقم الهوية:</strong> <span dir="ltr">${agreement.customers?.id_number || '___________________'}</span>
          </p>
          <p style="margin: 5px 0; line-height: 1.6;">
            <strong>الجنسية:</strong> ${agreement.customers?.nationality || '___________________'}
          </p>
          <p style="margin: 5px 0; line-height: 1.6;">
            <strong>رقم الهاتف:</strong> <span dir="ltr">${agreement.customers?.phone_number || '___________________'}</span>
          </p>
          <p style="margin: 5px 0; line-height: 1.6;">
            <strong>البريد الإلكتروني:</strong> <span dir="ltr">${agreement.customers?.email || '___________________'}</span>
          </p>
          <p style="margin: 5px 0; line-height: 1.6;">
            <strong>رخصة القيادة:</strong> <span dir="ltr">${agreement.customers?.driver_license || '___________________'}</span>
          </p>
        </div>
      </div>
    </div>
  `;

  // معلومات المركبة بتصميم رسمي
  const vehicleDetails = `
    <div style="margin: 30px 0; border: 2px solid #000; padding: 20px;">
      <h3 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px;
                 border-bottom: 1px solid #000; padding-bottom: 10px;">
        تفاصيل المركبة محل العقد
      </h3>
      
      <div style="padding: 15px; border: 1px solid #ccc; background: #fafafa;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; width: 30%;">
              الماركة والموديل:
            </td>
            <td style="padding: 8px; border: 1px solid #ccc;">
              ${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0;">
              سنة الصنع:
            </td>
            <td style="padding: 8px; border: 1px solid #ccc;">
              ${agreement.vehicles?.year || '___________'}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0;">
              رقم اللوحة:
            </td>
            <td style="padding: 8px; border: 1px solid #ccc;">
              <span dir="ltr">${agreement.vehicles?.license_plate || '___________'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0;">
              رقم الهيكل (VIN):
            </td>
            <td style="padding: 8px; border: 1px solid #ccc;">
              <span dir="ltr">${agreement.vehicles?.vin || '___________'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0;">
              اللون:
            </td>
            <td style="padding: 8px; border: 1px solid #ccc;">
              ${agreement.vehicles?.color || '___________'}
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  // تفاصيل العقد المالية
  const contractTerms = `
    <div style="margin: 30px 0; border: 2px solid #000; padding: 20px;">
      <h3 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px;
                 border-bottom: 1px solid #000; padding-bottom: 10px;">
        الشروط المالية والزمنية للعقد
      </h3>
      
      <div style="padding: 15px; border: 1px solid #ccc; background: #fafafa;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; width: 40%;">
              تاريخ بداية العقد:
            </td>
            <td style="padding: 10px; border: 1px solid #ccc; font-weight: bold;">
              ${formatDate(agreement.start_date)}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0;">
              تاريخ انتهاء العقد:
            </td>
            <td style="padding: 10px; border: 1px solid #ccc; font-weight: bold;">
              ${formatDate(agreement.end_date)}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0;">
              الأجرة الشهرية:
            </td>
            <td style="padding: 10px; border: 1px solid #ccc; font-weight: bold; font-size: 16px;">
              ${formatCurrency(agreement.rent_amount)} ريال قطري
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0;">
              إجمالي قيمة العقد:
            </td>
            <td style="padding: 10px; border: 1px solid #ccc; font-weight: bold; font-size: 16px;">
              ${formatCurrency(agreement.total_amount)} ريال قطري
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0;">
              حالة العقد:
            </td>
            <td style="padding: 10px; border: 1px solid #ccc;">
              ${getStatusText(agreement.status)}
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  // جدول الدفعات إذا وجد
  let paymentsSection = '';
  if (payments.length > 0) {
    const paymentHeaders = ['رقم الدفعة', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'الوصف'];
    const paymentRows = payments.map((payment, index) => [
      (index + 1).toString(),
      formatCurrency(payment.amount) + ' ر.ق',
      formatDate(payment.due_date),
      getPaymentStatusText(payment.status),
      payment.description || 'دفعة إيجار شهرية'
    ]);

    paymentsSection = `
      <div style="margin: 30px 0; page-break-inside: avoid;">
        <h3 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 15px;
                   border-bottom: 1px solid #000; padding-bottom: 10px;">
          جدول الدفعات
        </h3>
        ${createDataTable(paymentHeaders, paymentRows)}
        <p style="margin: 10px 0; font-size: 12px; text-align: center; font-style: italic;">
          ملاحظة: جميع الدفعات مستحقة في اليوم الأول من كل شهر
        </p>
      </div>
    `;
  }

  // البنود القانونية بتصميم رسمي احترافي
  const legalTerms = `
    <div style="page-break-before: always; margin: 20px 0;">
      <h2 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 30px;
                 border: 2px solid #000; padding: 15px; background: #f9f9f9;">
        بنود وشروط العقد
      </h2>
      
      <div style="text-align: justify; line-height: 1.8; font-size: 14px;">
        
        <div style="margin: 25px 0; border: 1px solid #000; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; 
                     background: #f0f0f0; padding: 10px; border-right: 4px solid #000;">
            المادة الأولى: موضوع العقد
          </h3>
          <p style="margin: 0; line-height: 1.8; text-indent: 20px;">
            يؤجر الطرف الأول للطرف الثاني المركبة المبينة أوصافها في هذا العقد، وهي مركبة 
            <strong>${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}</strong> 
            موديل <strong>${agreement.vehicles?.year || ''}</strong>، 
            رقم اللوحة <strong>${agreement.vehicles?.license_plate || ''}</strong>، 
            رقم الهيكل <strong>${agreement.vehicles?.vin || ''}</strong>، 
            اللون <strong>${agreement.vehicles?.color || ''}</strong>. 
            والمركبة المذكورة هي ملك للطرف الأول وفي حالة جيدة وصالحة للاستعمال.
          </p>
        </div>
        
        <div style="margin: 25px 0; border: 1px solid #000; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px;
                     background: #f0f0f0; padding: 10px; border-right: 4px solid #000;">
            المادة الثانية: مدة الإيجار
          </h3>
          <p style="margin: 0; line-height: 1.8; text-indent: 20px;">
            مدة الإيجار من تاريخ <strong>${formatDate(agreement.start_date)}</strong> 
            وحتى تاريخ <strong>${formatDate(agreement.end_date)}</strong>، 
            وتكون قابلة للتجديد بموافقة الطرفين. وينتهي العقد تلقائياً بانتهاء المدة المحددة دون الحاجة إلى إنذار.
          </p>
        </div>
        
        <div style="margin: 25px 0; border: 1px solid #000; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px;
                     background: #f0f0f0; padding: 10px; border-right: 4px solid #000;">
            المادة الثالثة: بدل الإيجار والمبالغ المطلوبة
          </h3>
          <p style="margin: 0; line-height: 1.8; text-indent: 20px;">
            يلتزم الطرف الثاني بدفع أجرة شهرية قدرها 
            <strong>${formatCurrency(agreement.rent_amount)} ريال قطري</strong> 
            شهرياً، تدفع مقدماً في بداية كل شهر. 
            إجمالي قيمة العقد: <strong>${formatCurrency(agreement.total_amount)} ريال قطري</strong>.
            في حالة التأخير في السداد، تطبق غرامة تأخير قدرها 120 ريال قطري عن كل يوم تأخير.
          </p>
        </div>
        
        <div style="margin: 25px 0; border: 1px solid #000; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px;
                     background: #f0f0f0; padding: 10px; border-right: 4px solid #000;">
            المادة الرابعة: التزامات المستأجر
          </h3>
          <p style="margin-bottom: 10px; font-weight: bold;">يلتزم الطرف الثاني بما يلي:</p>
          <ol style="padding-right: 25px; line-height: 1.8;">
            <li style="margin: 8px 0;">الاستخدام المشروع للمركبة وعدم استخدامها في أغراض غير مشروعة أو مخالفة للقانون</li>
            <li style="margin: 8px 0;">الالتزام الكامل بقوانين المرور والسلامة العامة المعمول بها في دولة قطر</li>
            <li style="margin: 8px 0;">عدم تأجير المركبة لطرف ثالث دون موافقة كتابية مسبقة من المؤجر</li>
            <li style="margin: 8px 0;">الحفاظ على المركبة وإجراء الصيانة الدورية اللازمة على نفقته الخاصة</li>
            <li style="margin: 8px 0;">إبلاغ المؤجر فوراً عن أي حادث أو عطل أو مخالفة مرورية</li>
            <li style="margin: 8px 0;">دفع قيمة جميع المخالفات المرورية المترتبة على استخدامه للمركبة</li>
            <li style="margin: 8px 0;">الحفاظ على سريان التأمين الشامل للمركبة طوال مدة العقد</li>
          </ol>
        </div>
        
        <div style="margin: 25px 0; border: 1px solid #000; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px;
                     background: #f0f0f0; padding: 10px; border-right: 4px solid #000;">
            المادة الخامسة: المخالفات والغرامات
          </h3>
          <p style="margin-bottom: 10px; font-weight: bold;">في حالة مخالفة أي من بنود هذا العقد:</p>
          <ul style="padding-right: 25px; line-height: 1.8;">
            <li style="margin: 8px 0;">
              <strong>التأخير في الدفع:</strong> غرامة قدرها 120 ريال قطري يومياً عن كل يوم تأخير بعد 7 أيام من تاريخ الاستحقاق
            </li>
            <li style="margin: 8px 0;">
              <strong>التأخير لأكثر من شهر:</strong> يحق للمؤجر استرداد المركبة فوراً مع احتفاظه بجميع المبالغ المدفوعة
            </li>
            <li style="margin: 8px 0;">
              <strong>عدم إرجاع المركبة:</strong> غرامة يومية قدرها 200 ريال قطري عن كل يوم تأخير في الإرجاع
            </li>
          </ul>
        </div>
        
        <div style="margin: 25px 0; border: 1px solid #000; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px;
                     background: #f0f0f0; padding: 10px; border-right: 4px solid #000;">
            المادة السادسة: فسخ العقد وإنهاؤه
          </h3>
          <p style="margin-bottom: 10px; font-weight: bold;">شروط فسخ العقد:</p>
          <ul style="padding-right: 25px; line-height: 1.8;">
            <li style="margin: 8px 0;">يحق لأي من الطرفين فسخ العقد بإشعار كتابي مدته 30 يوماً</li>
            <li style="margin: 8px 0;">يحق للمؤجر فسخ العقد فوراً في حالة عدم دفع الأجرة لمدة شهر</li>
            <li style="margin: 8px 0;">فسخ فوري في حالة مخالفة أي من بنود العقد الجوهرية</li>
            <li style="margin: 8px 0;">يلتزم المستأجر بإرجاع المركبة في الحالة التي تسلمها عليها</li>
          </ul>
        </div>
        
        <div style="margin: 25px 0; border: 1px solid #000; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px;
                     background: #f0f0f0; padding: 10px; border-right: 4px solid #000;">
            المادة السابعة: القانون المطبق والاختصاص القضائي
          </h3>
          <ul style="padding-right: 25px; line-height: 1.8; list-style: none;">
            <li style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-right: 3px solid #000;">
              <strong>القانون المطبق:</strong> يخضع هذا العقد لقوانين دولة قطر النافذة
            </li>
            <li style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-right: 3px solid #000;">
              <strong>الاختصاص القضائي:</strong> تختص المحاكم القطرية المختصة بنظر أي نزاع ينشأ عن هذا العقد
            </li>
            <li style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-right: 3px solid #000;">
              <strong>اللغة المعتمدة:</strong> النص العربي لهذا العقد هو المعتمد في التفسير والتطبيق
            </li>
          </ul>
        </div>

        <div style="margin: 25px 0; border: 2px solid #000; padding: 20px; background: #f9f9f9;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; text-align: center;
                     background: #e0e0e0; padding: 10px; border: 1px solid #000;">
            المادة الثامنة: أحكام عامة
          </h3>
          <ul style="padding-right: 25px; line-height: 1.8;">
            <li style="margin: 10px 0;">لا يجوز تعديل أي بند من بنود هذا العقد إلا بموافقة كتابية من الطرفين</li>
            <li style="margin: 10px 0;">جميع الإشعارات تكون كتابية وترسل للعناوين المذكورة في العقد</li>
            <li style="margin: 10px 0;">لا يتحمل أي من الطرفين مسؤولية التأخير الناتج عن ظروف القوة القاهرة</li>
            <li style="margin: 10px 0;">إذا أصبح أي بند باطلاً، يبقى باقي العقد نافذاً</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // قسم التوقيعات الرسمي
  const signatureSection = `
    <div style="page-break-before: always; margin: 30px 0;">
      <h2 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 30px;
                 border: 2px solid #000; padding: 15px; background: #f0f0f0;">
        إقرار الطرفين والتوقيع
      </h2>
      
      <div style="border: 2px solid #000; padding: 25px; margin: 20px 0;">
        <p style="text-align: justify; line-height: 2; font-size: 14px; margin-bottom: 30px;">
          لقد اطلع الطرفان على جميع بنود هذا العقد وفهماها تماماً، ووافقا عليها دون إكراه أو إجبار، 
          وتم توقيع هذا العقد في تاريخ <strong>${formatDate(new Date())}</strong> من نسختين أصليتين، 
          لكل طرف نسخة للعمل بموجبها.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-weight: bold; font-size: 16px; margin: 20px 0;">
            والله على ما نقول وكيل
          </p>
        </div>
        
        <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding: 20px; text-align: center; border: 1px solid #000;">
              <div style="margin-bottom: 60px;">
                <strong>الطرف الأول (المؤجر)</strong><br>
                شركة العراف لتأجير السيارات ذ.م.م<br>
                ممثلة بالسيد/ خميس هاشم الجبر
              </div>
              <div style="border-top: 2px solid #000; padding-top: 10px;">
                <strong>التوقيع: _________________</strong><br><br>
                <strong>التاريخ: _________________</strong><br><br>
                <strong>الختم الرسمي</strong>
              </div>
            </td>
            <td style="width: 50%; padding: 20px; text-align: center; border: 1px solid #000;">
              <div style="margin-bottom: 60px;">
                <strong>الطرف الثاني (المستأجر)</strong><br>
                ${agreement.customers?.full_name || '_________________'}<br>
                رقم الهوية: ${agreement.customers?.id_number || '_________________'}
              </div>
              <div style="border-top: 2px solid #000; padding-top: 10px;">
                <strong>التوقيع: _________________</strong><br><br>
                <strong>التاريخ: _________________</strong><br><br>
                <strong>بصمة الإبهام</strong>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  // Footer رسمي
  const documentFooter = `
    <div style="margin-top: 30px; border-top: 2px solid #000; padding-top: 15px; text-align: center; font-size: 10px;">
      <p style="margin: 5px 0;">
        هذا العقد محرر باللغة العربية ويخضع للقوانين المعمول بها في دولة قطر
      </p>
      <p style="margin: 5px 0;">
        تاريخ الإنشاء: ${formatDate(new Date())} | وقت الإنشاء: ${new Date().toLocaleTimeString('ar-QA')}
      </p>
      <p style="margin: 5px 0; font-weight: bold;">
        وثيقة سرية - للاستخدام الرسمي فقط
      </p>
    </div>
  `;

  // محتوى العقد الكامل
  const content = `
    ${contractHeader}
    ${contractParties}
    ${vehicleDetails}
    ${contractTerms}
    ${paymentsSection}
    ${legalTerms}
    ${signatureSection}
    ${documentFooter}
  `;

  // تكوين PDF احترافي
  const config: PDFConfig = {
    title: `عقد إيجار مركبة رقم ${agreement.agreement_number}`,
    filename: `عقد-رسمي-${agreement.agreement_number}-${agreement.customers?.full_name || 'عميل'}-${new Date().toISOString().split('T')[0]}`,
    rtl: true,
    companyInfo: false, // نستخدم header مخصص
    includeFooter: false // نستخدم footer مخصص
  };

  // أنماط احترافية غير ملونة
  const styles: PDFStyles = {
    primaryColor: '#000000',    // أسود
    secondaryColor: '#333333',  // رمادي غامق  
    backgroundColor: '#ffffff' // أبيض
  };

  // إنشاء PDF احترافي
  await generateUnifiedPDF({
    config,
    content,
    styles
  });
}

/**
 * دوال مساعدة
 */
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'active': 'نشط',
    'completed': 'مكتمل',
    'cancelled': 'ملغي',
    'suspended': 'معلق',
    'expired': 'منتهي الصلاحية'
  };
  return statusMap[status] || status;
}

function getPaymentStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'paid': 'مدفوع',
    'pending': 'معلق',
    'overdue': 'متأخر',
    'cancelled': 'ملغي',
    'refunded': 'مسترد'
  };
  return statusMap[status] || status;
} 