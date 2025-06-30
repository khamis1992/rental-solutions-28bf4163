/**
 * تقرير العقد المحدث - نسخة احترافية رسمية غير ملونة
 * للاستخدامات الحكومية والقانونية الرسمية
 */

import { 
  generateUnifiedPDF, 
  createInfoCard, 
  createSummaryCard, 
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
 * إنشاء تقرير عقد احترافي بتصميم رسمي غير ملون
 */
export async function generateModernAgreementPDF(
  agreement: AgreementData,
  payments: PaymentData[] = [],
  trafficFines: TrafficFineData[] = [],
  customerIdCardImage?: string
): Promise<void> {
  
  // Header رسمي للعقد
  const contractHeader = `
    <div style="margin-bottom: 40px; border-bottom: 3px solid #000; padding-bottom: 20px;">
      <!-- Header احترافي بدون شعار -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 22px; font-weight: bold; margin: 0; color: #000; line-height: 1.3;">
          دولة قطر
        </h1>
        <h2 style="font-size: 20px; font-weight: bold; margin: 5px 0; color: #000; line-height: 1.3;">
          شركة العراف لتأجير السيارات ذات المسؤولية المحدودة
        </h2>
        <p style="font-size: 12px; margin: 8px 0; color: #666; line-height: 1.4;">
          منطقة أم صلال علي، الدوحة، دولة قطر<br>
          ص.ب 36126 | سجل تجاري رقم: 146832<br>
          هاتف: <span dir="ltr">+97431151919</span> | البريد الإلكتروني: info@alaraf.qa
        </p>
      </div>
      
      <!-- عنوان العقد -->
      <div style="text-align: center; margin-top: 30px;">
        <h2 style="font-size: 18px; font-weight: bold; margin: 0; 
                   background: #f0f0f0; padding: 15px; border: 2px solid #000; color: #000;">
          عقد إيجار مركبة رقم: ${agreement.agreement_number}
        </h2>
      </div>
    </div>
  `;

  // معلومات أطراف العقد بتصميم رسمي
  const contractParties = `
    <div style="margin: 20px 0; border: 2px solid #000; padding: 15px; page-break-inside: avoid;">
      <h3 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 15px; 
                 border-bottom: 1px solid #000; padding-bottom: 8px; color: #000;">
        أطراف العقد
      </h3>
      
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; 
                   background: #f5f5f5; padding: 6px; border-right: 4px solid #000; color: #000;">
          الطرف الأول (المؤجر):
        </h4>
        <div style="padding: 8px; border: 1px solid #ccc; background: #fafafa;">
          <p style="margin: 3px 0; line-height: 1.4; color: #000; font-size: 12px;">
            <strong>اسم الشركة:</strong> شركة العراف لتأجير السيارات ذات المسؤولية المحدودة
          </p>
          <p style="margin: 3px 0; line-height: 1.4; color: #000; font-size: 12px;">
            <strong>العنوان:</strong> منطقة أم صلال علي، الدوحة، دولة قطر، ص.ب 36126
          </p>
          <p style="margin: 3px 0; line-height: 1.4; color: #000; font-size: 12px;">
            <strong>السجل التجاري:</strong> 146832
          </p>
          <p style="margin: 3px 0; line-height: 1.4; color: #000; font-size: 12px;">
            <strong>الممثل القانوني:</strong> السيد/ خميس هاشم الجبر - المدير المخول بالتوقيع
          </p>
        </div>
      </div>
      
      <div>
        <h4 style="font-size: 14px; font-weight: bold; margin-bottom: 8px;
                   background: #f5f5f5; padding: 6px; border-right: 4px solid #000; color: #000;">
          الطرف الثاني (المستأجر):
        </h4>
        <div style="padding: 8px; border: 1px solid #ccc; background: #fafafa;">
          <p style="margin: 3px 0; line-height: 1.4; color: #000; font-size: 12px;">
            <strong>الاسم الكامل:</strong> ${agreement.customers?.full_name || '___________________'}
          </p>
          <p style="margin: 3px 0; line-height: 1.4; color: #000; font-size: 12px;">
                            <strong>رقم الهوية:</strong> <span dir="ltr">${agreement.customers?.id_number || agreement.customers?.driver_license || '___________________'}</span>
          </p>
          <p style="margin: 3px 0; line-height: 1.3; color: #666; font-size: 10px; font-style: italic;">
            * في قطر: رقم الهوية القطرية = رقم رخصة القيادة القطرية
          </p>
          <p style="margin: 3px 0; line-height: 1.4; color: #000; font-size: 12px;">
            <strong>الجنسية:</strong> ${agreement.customers?.nationality || '___________________'}
          </p>
          <p style="margin: 3px 0; line-height: 1.4; color: #000; font-size: 12px;">
            <strong>رقم الهاتف:</strong> <span dir="ltr">${agreement.customers?.phone_number || '___________________'}</span>
          </p>
          <p style="margin: 3px 0; line-height: 1.4; color: #000; font-size: 12px;">
            <strong>البريد الإلكتروني:</strong> <span dir="ltr">${agreement.customers?.email || '___________________'}</span>
          </p>
          <p style="margin: 3px 0; line-height: 1.4; color: #000; font-size: 12px;">
            <strong>رخصة القيادة:</strong> <span dir="ltr">${agreement.customers?.driver_license || '___________________'}</span>
          </p>
        </div>
        <div style="border-top: 1px solid #ccc; padding-top: 8px; margin-top: 8px;">
          <p style="margin: 0; font-size: 10px; color: #666; text-align: center; font-style: italic;">
            📋 ملاحظة رسمية: في دولة قطر، رقم البطاقة الشخصية القطرية يطابق رقم رخصة القيادة القطرية وفقاً للنظام الرسمي المعتمد
          </p>
        </div>
      </div>
    </div>
  `;

  // معلومات المركبة بتصميم رسمي
  const vehicleDetails = `
    <div style="margin: 20px 0; border: 2px solid #000; padding: 15px; page-break-inside: avoid;">
      <h3 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 15px;
                 border-bottom: 1px solid #000; padding-bottom: 8px; color: #000;">
        تفاصيل المركبة محل العقد
      </h3>
      
      <div style="padding: 10px; border: 1px solid #ccc; background: #fafafa;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; width: 30%; color: #000; font-size: 12px;">
              الماركة والموديل:
            </td>
            <td style="padding: 6px; border: 1px solid #ccc; color: #000; font-size: 12px;">
              ${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; color: #000; font-size: 12px;">
              سنة الصنع:
            </td>
            <td style="padding: 6px; border: 1px solid #ccc; color: #000; font-size: 12px;">
              ${agreement.vehicles?.year || '___________'}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; color: #000; font-size: 12px;">
              رقم اللوحة:
            </td>
            <td style="padding: 6px; border: 1px solid #ccc; color: #000; font-size: 12px;">
              <span dir="ltr">${agreement.vehicles?.license_plate || '___________'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; color: #000; font-size: 12px;">
              رقم الهيكل (VIN):
            </td>
            <td style="padding: 6px; border: 1px solid #ccc; color: #000; font-size: 12px;">
              <span dir="ltr">${agreement.vehicles?.vin || '___________'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; color: #000; font-size: 12px;">
              اللون:
            </td>
            <td style="padding: 6px; border: 1px solid #ccc; color: #000; font-size: 12px;">
              ${agreement.vehicles?.color || '___________'}
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  // تفاصيل العقد المالية
  const contractTerms = `
    <div style="margin: 20px 0; border: 2px solid #000; padding: 15px; page-break-inside: avoid;">
      <h3 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 15px;
                 border-bottom: 1px solid #000; padding-bottom: 8px; color: #000;">
        الشروط المالية والزمنية للعقد
      </h3>
      
      <div style="padding: 10px; border: 1px solid #ccc; background: #fafafa;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; width: 40%; color: #000; font-size: 12px;">
              تاريخ بداية العقد:
            </td>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; color: #000; font-size: 12px;">
              ${formatDate(agreement.start_date)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; color: #000; font-size: 12px;">
              تاريخ انتهاء العقد:
            </td>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; color: #000; font-size: 12px;">
              ${formatDate(agreement.end_date)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; color: #000; font-size: 12px;">
              الأجرة الشهرية:
            </td>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; font-size: 14px; color: #000;">
              ${formatCurrency(agreement.rent_amount)} ريال قطري
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; color: #000; font-size: 12px;">
              إجمالي قيمة العقد:
            </td>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; font-size: 14px; color: #000;">
              ${formatCurrency(agreement.total_amount)} ريال قطري
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; background: #f0f0f0; color: #000; font-size: 12px;">
              حالة العقد:
            </td>
            <td style="padding: 8px; border: 1px solid #ccc; color: #000; font-size: 12px;">
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
    const paymentHeaders = ['رقم الدفعة', 'المبلغ', 'تاريخ الاستحقاق', 'الوصف'];
    const paymentRows = payments.map((payment, index) => [
      (index + 1).toString(),
      formatCurrency(payment.amount) + ' ر.ق',
      formatMonthlyDueDate(agreement.start_date, index),
      formatMonthlyPaymentDescription(agreement.start_date, index)
    ]);

    paymentsSection = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h3 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 12px;
                   border-bottom: 1px solid #000; padding-bottom: 8px; color: #000;">
          جدول الدفعات
        </h3>
        ${createDataTable(paymentHeaders, paymentRows)}
        <p style="margin: 8px 0; font-size: 10px; text-align: center; font-style: italic; color: #666;">
          ملاحظة: جميع الدفعات مستحقة في اليوم الأول من كل شهر
        </p>
      </div>
    `;
  }

  // جدول المخالفات المرورية إذا وجد
  let finesSection = '';
  if (trafficFines.length > 0) {
    const fineHeaders = ['رقم المخالفة', 'تاريخ المخالفة', 'مبلغ الغرامة', 'نوع المخالفة', 'المكان', 'الحالة'];
    const fineRows = trafficFines.map(fine => [
      fine.violation_number,
      formatDate(fine.violation_date),
      formatCurrency(fine.fine_amount) + ' ر.ق',
      fine.violation_type || 'غير محدد',
      fine.location || 'غير محدد',
      getPaymentStatusText(fine.status)
    ]);

    const totalFines = trafficFines.reduce((sum, f) => sum + f.fine_amount, 0);

    finesSection = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h3 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 12px;
                   border-bottom: 1px solid #000; padding-bottom: 8px; color: #000;">
          المخالفات المرورية
        </h3>
        ${createDataTable(fineHeaders, fineRows)}
        <div style="border: 2px solid #000; padding: 10px; margin: 8px 0; background: #f9f9f9;">
          <p style="margin: 0; font-weight: bold; text-align: center; color: #000; font-size: 12px;">
            إجمالي المخالفات المرورية: ${formatCurrency(totalFines)} ر.ق
          </p>
          <p style="margin: 3px 0 0 0; text-align: center; font-size: 10px; color: #666;">
            تنبيه: يجب سداد المخالفات لتجنب المشاكل القانونية
          </p>
        </div>
      </div>
    `;
  }

  // البنود القانونية بتصميم رسمي احترافي محسن للطباعة
  const legalTerms = `
    <div style="page-break-before: always; margin: 15px 0;">
      <h2 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px;
                 border: 2px solid #000; padding: 12px; background: #f9f9f9; color: #000;">
        بنود وشروط العقد
      </h2>
      
      <div style="text-align: justify; line-height: 1.6; font-size: 12px;">
        
        <div style="margin: 15px 0; border: 1px solid #000; padding: 12px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; 
                     background: #f0f0f0; padding: 8px; border-right: 4px solid #000; color: #000;">
            المادة الأولى: موضوع العقد
          </h3>
          <p style="margin: 0; line-height: 1.6; text-indent: 15px; color: #000;">
            يؤجر الطرف الأول للطرف الثاني المركبة المبينة أوصافها في هذا العقد، وهي مركبة 
            <strong>${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}</strong> 
            موديل <strong>${agreement.vehicles?.year || ''}</strong>، 
            رقم اللوحة <strong>${agreement.vehicles?.license_plate || ''}</strong>، 
            رقم الهيكل <strong>${agreement.vehicles?.vin || ''}</strong>، 
            اللون <strong>${agreement.vehicles?.color || ''}</strong>. 
            والمركبة المذكورة هي ملك للطرف الأول وفي حالة جيدة وصالحة للاستعمال.
          </p>
        </div>
        
        <div style="margin: 15px 0; border: 1px solid #000; padding: 12px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;
                     background: #f0f0f0; padding: 8px; border-right: 4px solid #000; color: #000;">
            المادة الثانية: مدة الإيجار
          </h3>
          <p style="margin: 0; line-height: 1.6; text-indent: 15px; color: #000;">
            مدة الإيجار من تاريخ <strong>${formatDate(agreement.start_date)}</strong> 
            وحتى تاريخ <strong>${formatDate(agreement.end_date)}</strong>، 
            وتكون قابلة للتجديد بموافقة الطرفين. وينتهي العقد تلقائياً بانتهاء المدة المحددة دون الحاجة إلى إنذار.
          </p>
        </div>
        
        <div style="margin: 15px 0; border: 1px solid #000; padding: 12px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;
                     background: #f0f0f0; padding: 8px; border-right: 4px solid #000; color: #000;">
            المادة الثالثة: بدل الإيجار والمبالغ المطلوبة
          </h3>
          <p style="margin: 0; line-height: 1.6; text-indent: 15px; color: #000;">
            يلتزم الطرف الثاني بدفع أجرة شهرية قدرها 
            <strong>${formatCurrency(agreement.rent_amount)} ريال قطري</strong> 
            شهرياً، تدفع مقدماً في بداية كل شهر. 
            إجمالي قيمة العقد: <strong>${formatCurrency(agreement.total_amount)} ريال قطري</strong>.
            في حالة التأخير في السداد، تطبق غرامة تأخير قدرها 120 ريال قطري عن كل يوم تأخير.
          </p>
        </div>
        
        <div style="margin: 15px 0; border: 1px solid #000; padding: 12px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;
                     background: #f0f0f0; padding: 8px; border-right: 4px solid #000; color: #000;">
            المادة الرابعة: التزامات المستأجر
          </h3>
          <p style="margin-bottom: 10px; font-weight: bold; color: #000;">يلتزم الطرف الثاني بما يلي:</p>
          <ol style="padding-right: 25px; line-height: 1.6; color: #000;">
            <li style="margin: 8px 0;">الاستخدام المشروع للمركبة وعدم استخدامها في أغراض غير مشروعة أو مخالفة للقانون</li>
            <li style="margin: 8px 0;">الالتزام الكامل بقوانين المرور والسلامة العامة المعمول بها في دولة قطر</li>
            <li style="margin: 8px 0;">عدم تأجير المركبة لطرف ثالث دون موافقة كتابية مسبقة من المؤجر</li>
            <li style="margin: 8px 0;">الحفاظ على المركبة وإجراء الصيانة الدورية اللازمة على نفقته الخاصة</li>
            <li style="margin: 8px 0;">إبلاغ المؤجر فوراً عن أي حادث أو عطل أو مخالفة مرورية</li>
            <li style="margin: 8px 0;">دفع قيمة جميع المخالفات المرورية المترتبة على استخدامه للمركبة</li>
            <li style="margin: 8px 0;">الحفاظ على سريان التأمين الشامل للمركبة طوال مدة العقد</li>
          </ol>
        </div>
        
        <div style="margin: 15px 0; border: 1px solid #000; padding: 12px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;
                     background: #f0f0f0; padding: 8px; border-right: 4px solid #000; color: #000;">
            المادة الخامسة: المخالفات والغرامات
          </h3>
          <p style="margin-bottom: 10px; font-weight: bold; color: #000;">في حالة مخالفة أي من بنود هذا العقد:</p>
          <ul style="padding-right: 25px; line-height: 1.6; color: #000;">
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
        
        <div style="margin: 15px 0; border: 1px solid #000; padding: 12px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;
                     background: #f0f0f0; padding: 8px; border-right: 4px solid #000; color: #000;">
            المادة السادسة: فسخ العقد وإنهاؤه
          </h3>
          <p style="margin-bottom: 10px; font-weight: bold; color: #000;">شروط فسخ العقد:</p>
          <ul style="padding-right: 25px; line-height: 1.6; color: #000;">
            <li style="margin: 8px 0;">يحق لأي من الطرفين فسخ العقد بإشعار كتابي مدته 30 يوماً</li>
            <li style="margin: 8px 0;">يحق للمؤجر فسخ العقد فوراً في حالة عدم دفع الأجرة لمدة شهر</li>
            <li style="margin: 8px 0;">فسخ فوري في حالة مخالفة أي من بنود العقد الجوهرية</li>
            <li style="margin: 8px 0;">يلتزم المستأجر بإرجاع المركبة في الحالة التي تسلمها عليها</li>
          </ul>
        </div>
        
        <div style="margin: 15px 0; border: 1px solid #000; padding: 12px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;
                     background: #f0f0f0; padding: 8px; border-right: 4px solid #000; color: #000;">
            المادة السابعة: القانون المطبق والاختصاص القضائي
          </h3>
          <ul style="padding-right: 25px; line-height: 1.6; list-style: none; color: #000;">
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

        <div style="margin: 15px 0; border: 2px solid #000; padding: 12px; background: #f9f9f9;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; text-align: center;
                     background: #e0e0e0; padding: 8px; border: 1px solid #000; color: #000;">
            المادة الثامنة: أحكام عامة
          </h3>
          <ul style="padding-right: 25px; line-height: 1.6; color: #000;">
            <li style="margin: 10px 0;">لا يجوز تعديل أي بند من بنود هذا العقد إلا بموافقة كتابية من الطرفين</li>
            <li style="margin: 10px 0;">جميع الإشعارات تكون كتابية وترسل للعناوين المذكورة في العقد</li>
            <li style="margin: 10px 0;">لا يتحمل أي من الطرفين مسؤولية التأخير الناتج عن ظروف القوة القاهرة</li>
            <li style="margin: 10px 0;">إذا أصبح أي بند باطلاً، يبقى باقي العقد نافذاً</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // صفحة البطاقة الشخصية قبل التوقيع (إذا كانت متوفرة) أو صفحة المرفقات (إذا لم تكن متوفرة)
  let idCardSection = '';
  if (customerIdCardImage) {
    idCardSection = `
      <div style="page-break-before: always; margin: 20px 0;">
        <h2 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 30px;
                   border: 2px solid #000; padding: 15px; background: #f0f0f0; color: #000;">
          📄 صورة البطاقة الشخصية للطرف الثاني (المستأجر)
        </h2>
        
        <div style="border: 3px solid #000; padding: 20px; margin: 20px 0; background: #fafafa;">
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 14px; font-weight: bold; color: #000; margin: 0;">
              بطاقة هوية: ${agreement.customers?.full_name || 'الطرف الثاني'}
            </p>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">
              رقم الهوية/الإقامة: ${agreement.customers?.id_number || agreement.customers?.driver_license || 'غير محدد'}
            </p>
            <p style="font-size: 10px; color: #999; margin: 2px 0; font-style: italic;">
              * ملاحظة: في قطر رقم الهوية القطرية = رقم رخصة القيادة القطرية
            </p>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">
              الجنسية: ${agreement.customers?.nationality || 'غير محدد'}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="border: 2px solid #000; padding: 10px; display: inline-block; background: #fff; border-radius: 8px;">
              <img 
                src="${customerIdCardImage}" 
                alt="البطاقة الشخصية"
                style="max-width: 400px; max-height: 250px; width: auto; height: auto; 
                       border: 1px solid #ccc; border-radius: 4px;"
              />
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 11px; color: #666; margin: 0; line-height: 1.4;">
              📷 تم إرفاق صورة البطاقة الشخصية كجزء من وثائق العقد الرسمية
            </p>
            <p style="font-size: 11px; color: #666; margin: 5px 0; line-height: 1.4;">
              هذه الصورة تؤكد هوية الطرف الثاني وتُعتبر جزءاً لا يتجزأ من هذا العقد
            </p>
          </div>
        </div>
        
      </div>

      <!-- صفحة تأكيد صحة البيانات منفصلة -->
      <div style="page-break-before: always; margin: 0; padding: 20px; background: #fff; min-height: 100vh;">
        
        <!-- عنوان الصفحة الرسمي -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 20px;">
          <h1 style="font-size: 22px; font-weight: bold; margin: 0; color: #000; line-height: 1.3;">
            دولة قطر
          </h1>
          <h2 style="font-size: 20px; font-weight: bold; margin: 5px 0; color: #000; line-height: 1.3;">
            شركة العراف لتأجير السيارات ذات المسؤولية المحدودة
          </h2>
          <p style="font-size: 12px; margin: 8px 0; color: #666; line-height: 1.4;">
            منطقة أم صلال علي، الدوحة، دولة قطر | ص.ب 36126 | سجل تجاري رقم: 146832
          </p>
        </div>

        <!-- عنوان صفحة التأكيد -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 18px; font-weight: bold; background: #f0f0f0; padding: 15px; 
                     border: 2px solid #000; color: #000; margin: 0;">
            ✅ تأكيد صحة البيانات والهوية الشخصية
          </h2>
        </div>

        <!-- معلومات العقد -->
        <div style="border: 2px solid #000; padding: 15px; margin: 20px 0; background: #f9f9f9;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; 
                     background: #e0e0e0; padding: 8px; border: 1px solid #000; color: #000; text-align: center;">
            بيانات العقد والمستأجر
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; padding: 8px; font-size: 12px; color: #000;">
                <strong>رقم العقد:</strong> ${agreement.agreement_number}
              </td>
              <td style="width: 50%; padding: 8px; font-size: 12px; color: #000;">
                <strong>تاريخ العقد:</strong> ${formatDate(new Date())}
              </td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 8px; font-size: 12px; color: #000;">
                <strong>اسم المستأجر:</strong> ${agreement.customers?.full_name || '_________________'}
              </td>
              <td style="width: 50%; padding: 8px; font-size: 12px; color: #000;">
                <strong>رقم الهوية:</strong> ${agreement.customers?.id_number || agreement.customers?.driver_license || '_________________'}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- الإقرار الرسمي -->
        <div style="border: 3px solid #000; padding: 25px; margin: 30px 0; background: #fff;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 20px; text-align: center; color: #000;
                     background: #f0f0f0; padding: 10px; border: 2px solid #000;">
            📋 إقرار رسمي بصحة البيانات والهوية
          </h3>
          
          <div style="background: #f9f9f9; padding: 20px; border: 2px solid #666; margin: 15px 0;">
            <p style="font-size: 14px; text-align: justify; line-height: 1.8; color: #000; margin: 0 0 15px 0;">
              أقر أنا الطرف الثاني <strong style="font-size: 16px; color: #000; background: #f0f0f0; padding: 3px 6px; border: 1px solid #000;">${agreement.customers?.full_name || '_________________'}</strong> 
              بأن البطاقة الشخصية المرفقة في هذا العقد هي بطاقتي الشخصية الصحيحة والسارية المفعول، 
              وأن جميع البيانات الواردة فيها صحيحة ومطابقة للواقع.
            </p>
            
            <p style="font-size: 14px; text-align: justify; line-height: 1.8; color: #000; margin: 0 0 15px 0;">
              وأتحمل كامل المسؤولية القانونية والجنائية عن صحة هذه البيانات أمام القانون والسلطات المختصة في دولة قطر، 
              وأتعهد بأنني لم أقدم أي بيانات مزورة أو غير صحيحة.
            </p>
            
            <p style="font-size: 14px; text-align: justify; line-height: 1.8; color: #000; margin: 0;">
              وأوافق على استخدام هذه البيانات والصورة الشخصية في جميع المعاملات والإجراءات القانونية 
              المتعلقة بهذا العقد، وأقر بأنني مالك البطاقة الشخصية المرفقة ولا يحق لأي شخص آخر استخدامها.
            </p>
          </div>
        </div>

        <!-- تأكيد إضافي -->
        <div style="border: 2px solid #dc2626; padding: 20px; margin: 25px 0; background: #fef2f2;">
          <h4 style="font-size: 14px; font-weight: bold; color: #dc2626; margin-bottom: 15px; text-align: center;">
            ⚠️ تأكيد نهائي مهم
          </h4>
          <p style="font-size: 13px; color: #991b1b; margin: 0; text-align: justify; line-height: 1.6;">
            أؤكد مرة أخرى أن جميع المعلومات والبيانات المقدمة في هذا العقد صحيحة وكاملة، 
            وأنني قد قرأت وفهمت جميع بنود العقد ووافقت عليها بكامل الأهلية القانونية 
            ودون إكراه أو ضغط من أي جهة كانت.
          </p>
        </div>
        
        <!-- جدول التوقيع والتأكيد -->
        <div style="margin-top: 40px;">
          <table style="width: 100%; border-collapse: collapse; border: 3px solid #000;">
            <tr style="background: #f0f0f0;">
              <td style="width: 50%; text-align: center; padding: 12px; border: 2px solid #000;">
                <strong style="color: #000; font-size: 16px;">بيانات المستأجر والتوقيع</strong>
              </td>
              <td style="width: 50%; text-align: center; padding: 12px; border: 2px solid #000;">
                <strong style="color: #000; font-size: 16px;">التاريخ والختم الرسمي</strong>
              </td>
            </tr>
            <tr>
              <td style="text-align: center; padding: 30px; border: 2px solid #000; background: #fff;">
                <p style="margin: 0 0 15px 0; font-size: 14px; color: #000;">
                  <strong>الاسم الكامل:</strong><br>
                  <span style="font-size: 16px; font-weight: bold; color: #000; 
                               background: #f9f9f9; padding: 5px 10px; border: 1px solid #000; display: inline-block; margin-top: 5px;">
                    ${agreement.customers?.full_name || '_________________'}
                  </span>
                </p>
                <p style="margin: 0 0 15px 0; font-size: 12px; color: #666;">
                  <strong>رقم الهوية/الإقامة:</strong> ${agreement.customers?.id_number || agreement.customers?.driver_license || '_________________'}
                </p>
                <p style="margin: 0 0 20px 0; font-size: 12px; color: #666;">
                  <strong>الجنسية:</strong> ${agreement.customers?.nationality || '_________________'}
                </p>
                
                <div style="border-bottom: 3px solid #000; margin: 15px 20px; height: 50px; 
                           background: #f9f9f9; border: 1px solid #000; position: relative;">
                  <span style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); 
                               font-size: 12px; font-weight: bold; color: #000;">
                    توقيع المستأجر
                  </span>
                </div>
              </td>
              <td style="text-align: center; padding: 30px; border: 2px solid #000; background: #fff;">
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #000;">
                  <strong>تاريخ التأكيد:</strong><br>
                  <span style="font-size: 16px; font-weight: bold; color: #000; 
                               background: #f9f9f9; padding: 8px 12px; border: 2px solid #000; display: inline-block; margin-top: 8px;">
                    ${formatDate(new Date())}
                  </span>
                </p>
                
                <p style="margin: 0 0 20px 0; font-size: 12px; color: #666;">
                  <strong>وقت التأكيد:</strong> ${new Date().toLocaleTimeString('ar-QA')}
                </p>
                
                <div style="border: 2px solid #000; margin: 15px 10px; height: 60px; 
                           background: #f0f0f0; position: relative;">
                  <span style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); 
                               font-size: 12px; font-weight: bold; color: #000;">
                    الختم الشخصي أو بصمة الإبهام
                  </span>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- معلومات قانونية نهائية -->
        <div style="text-align: center; margin-top: 30px; border-top: 2px solid #000; padding-top: 15px;">
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #000; line-height: 1.4; font-weight: bold;">
            هذا الإقرار جزء لا يتجزأ من عقد الإيجار رقم ${agreement.agreement_number}
          </p>
          <p style="margin: 0; font-size: 10px; color: #666; line-height: 1.4;">
            تاريخ الإنشاء: ${formatDate(new Date())} | شركة العراف لتأجير السيارات ذ.م.م | دولة قطر
          </p>
        </div>
      </div>
    `;
  } else {
    // صفحة المرفقات المطلوبة - صفحة منفصلة مع بطاقات أكبر وأوضح
    idCardSection = `
      <!-- صفحة المرفقات المطلوبة -->
      <div style="page-break-before: always; margin: 0; padding: 20px; background: #fff;">
        
        <!-- عنوان الصفحة الرسمي -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 20px;">
          <h1 style="font-size: 22px; font-weight: bold; margin: 0; color: #000; line-height: 1.3;">
            دولة قطر
          </h1>
          <h2 style="font-size: 20px; font-weight: bold; margin: 5px 0; color: #000; line-height: 1.3;">
            شركة العراف لتأجير السيارات ذات المسؤولية المحدودة
          </h2>
          <p style="font-size: 12px; margin: 8px 0; color: #666; line-height: 1.4;">
            منطقة أم صلال علي، الدوحة، دولة قطر | ص.ب 36126 | سجل تجاري رقم: 146832
          </p>
        </div>

        <!-- عنوان صفحة المرفقات -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="font-size: 18px; font-weight: bold; background: #f0f0f0; padding: 15px; 
                     border: 2px solid #000; color: #000; margin: 0;">
            📎 قائمة المستندات المطلوبة
          </h2>
        </div>
        
        <!-- تنبيه رسمي -->
        <div style="border: 3px solid #dc2626; padding: 15px; margin: 20px 0; background: #fef2f2;">
          <div style="text-align: center; margin-bottom: 10px;">
            <h3 style="font-size: 16px; font-weight: bold; color: #dc2626; margin: 0;">
              ⚠️ تنبيه مهم جداً
            </h3>
          </div>
          <p style="font-size: 13px; color: #991b1b; margin: 0; text-align: justify; line-height: 1.6;">
            لم يتم العثور على صورة البطاقة الشخصية في ملف العميل. 
            يُرجى استكمال المستندات المطلوبة أدناه لإتمام إجراءات العقد بشكل قانوني صحيح.
          </p>
        </div>

        <!-- معلومات العميل -->
        <div style="border: 2px solid #000; padding: 15px; margin: 20px 0; background: #f9f9f9;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; 
                     background: #e0e0e0; padding: 8px; border: 1px solid #000; color: #000; text-align: center;">
            بيانات المستأجر (الطرف الثاني)
          </h3>
          <div style="display: table; width: 100%;">
            <div style="display: table-row;">
              <div style="display: table-cell; width: 50%; padding: 8px;">
                <p style="margin: 0; font-size: 12px; color: #000;">
                  <strong>الاسم الكامل:</strong> ${agreement.customers?.full_name || '_________________'}
                </p>
              </div>
              <div style="display: table-cell; width: 50%; padding: 8px;">
                <p style="margin: 0; font-size: 12px; color: #000;">
                  <strong>رقم الهوية/الإقامة:</strong> ${agreement.customers?.id_number || agreement.customers?.driver_license || '_________________'}
                </p>
              </div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; width: 50%; padding: 8px;">
                <p style="margin: 0; font-size: 12px; color: #000;">
                  <strong>الجنسية:</strong> ${agreement.customers?.nationality || '_________________'}
                </p>
              </div>
              <div style="display: table-cell; width: 50%; padding: 8px;">
                <p style="margin: 0; font-size: 12px; color: #000;">
                  <strong>رقم العقد:</strong> ${agreement.agreement_number}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- المستندات المطلوبة - بطاقات كبيرة -->
        <div style="margin: 20px 0;">
          
          <!-- المستند الأول: البطاقة الشخصية -->
          <div style="border: 3px solid #dc2626; padding: 20px; margin: 20px 0; background: #fef2f2; border-radius: 10px;">
            <div style="margin-bottom: 20px;">
              <div style="display: table; width: 100%;">
                <div style="display: table-cell; width: 60px; vertical-align: top;">
                  <span style="width: 50px; height: 50px; border: 3px solid #dc2626; display: inline-block; 
                               text-align: center; line-height: 44px; font-weight: bold; color: #dc2626; 
                               background: #fff; border-radius: 50%; font-size: 18px;">1</span>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-right: 20px;">
                  <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #dc2626;">
                    صورة البطاقة الشخصية (الهوية/الإقامة) - مطلوبة
                  </h4>
                  <p style="margin: 0; font-size: 13px; color: #7f1d1d; line-height: 1.6;">
                    صورة واضحة وملونة للوجه الأمامي والخلفي للبطاقة الشخصية أو بطاقة الإقامة سارية المفعول. 
                    يجب أن تكون الصورة بجودة عالية وواضحة جميع النصوص والأرقام والصورة الشخصية.
                  </p>
                </div>
              </div>
            </div>
            <div style="border: 3px dashed #dc2626; padding: 60px; text-align: center; background: #fff; margin: 15px 0; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; color: #dc2626; font-size: 16px; font-weight: bold;">
                📷 مساحة مخصصة لإرفاق صورة البطاقة الشخصية
              </p>
              <p style="margin: 0; color: #991b1b; font-size: 12px;">
                (الوجه الأمامي والخلفي - صورة واضحة وملونة)
              </p>
            </div>
          </div>
          
          <!-- المستند الثاني: رخصة القيادة -->
          <div style="border: 3px solid #1976d2; padding: 20px; margin: 20px 0; background: #f3f4f6; border-radius: 10px;">
            <div style="margin-bottom: 20px;">
              <div style="display: table; width: 100%;">
                <div style="display: table-cell; width: 60px; vertical-align: top;">
                  <span style="width: 50px; height: 50px; border: 3px solid #1976d2; display: inline-block; 
                               text-align: center; line-height: 44px; font-weight: bold; color: #1976d2; 
                               background: #fff; border-radius: 50%; font-size: 18px;">2</span>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-right: 20px;">
                  <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #1976d2;">
                    صورة رخصة القيادة
                  </h4>
                  <p style="margin: 0; font-size: 13px; color: #1565c0; line-height: 1.6;">
                    صورة واضحة لرخصة القيادة القطرية أو الدولية سارية المفعول. 
                    يجب أن تظهر جميع البيانات بوضوح تام وتكون غير منتهية الصلاحية.
                  </p>
                </div>
              </div>
            </div>
            <div style="border: 3px dashed #1976d2; padding: 50px; text-align: center; background: #fff; margin: 15px 0; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; color: #1976d2; font-size: 16px; font-weight: bold;">
                🚗 مساحة مخصصة لإرفاق صورة رخصة القيادة
              </p>
              <p style="margin: 0; color: #1565c0; font-size: 12px;">
                (رخصة قيادة قطرية أو دولية سارية المفعول)
              </p>
            </div>
          </div>
          
          <!-- المستند الثالث: مستندات إضافية -->
          <div style="border: 3px solid #666; padding: 20px; margin: 20px 0; background: #f9f9f9; border-radius: 10px;">
            <div style="margin-bottom: 20px;">
              <div style="display: table; width: 100%;">
                <div style="display: table-cell; width: 60px; vertical-align: top;">
                  <span style="width: 50px; height: 50px; border: 3px solid #666; display: inline-block; 
                               text-align: center; line-height: 44px; font-weight: bold; color: #666; 
                               background: #fff; border-radius: 50%; font-size: 18px;">3</span>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-right: 20px;">
                  <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #666;">
                    مستندات إضافية (حسب الحاجة)
                  </h4>
                  <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.6;">
                    أي مستندات أخرى قد تكون مطلوبة لاستكمال إجراءات العقد حسب نوع الخدمة، 
                    مثل كشف راتب، شهادة عمل، أو أي إثباتات أخرى.
                  </p>
                </div>
              </div>
            </div>
            <div style="border: 3px dashed #666; padding: 50px; text-align: center; background: #fff; margin: 15px 0; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 16px; font-weight: bold;">
                📄 مساحة للمستندات الإضافية
              </p>
              <p style="margin: 0; color: #555; font-size: 12px;">
                (حسب متطلبات نوع العقد والخدمة)
              </p>
            </div>
          </div>
        </div>
        
        <!-- إرشادات مهمة -->
        <div style="border: 2px solid #f59e0b; padding: 20px; margin: 25px 0; background: #fffbeb; border-radius: 8px;">
          <h3 style="font-size: 16px; font-weight: bold; color: #f59e0b; margin-bottom: 15px; text-align: center;">
            📝 إرشادات مهمة لتقديم المستندات
          </h3>
          <div style="display: table; width: 100%;">
            <div style="display: table-row;">
              <div style="display: table-cell; width: 50%; padding: 0 10px;">
                <p style="margin: 8px 0; font-size: 12px; color: #92400e; line-height: 1.6;">
                  • جميع الصور يجب أن تكون واضحة وملونة وبدقة عالية
                </p>
                <p style="margin: 8px 0; font-size: 12px; color: #92400e; line-height: 1.6;">
                  • المستندات يجب أن تكون سارية المفعول وغير منتهية الصلاحية
                </p>
              </div>
              <div style="display: table-cell; width: 50%; padding: 0 10px;">
                <p style="margin: 8px 0; font-size: 12px; color: #92400e; line-height: 1.6;">
                  • يُرجى التأكد من وضوح جميع النصوص والأرقام والبيانات الشخصية
                </p>
                <p style="margin: 8px 0; font-size: 12px; color: #92400e; line-height: 1.6;">
                  • في حالة عدم وضوح أي مستند، سيتم طلب إعادة تقديمه
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- معلومات قانونية -->
        <div style="text-align: center; margin-top: 30px; border-top: 2px solid #ccc; padding-top: 15px;">
          <p style="margin: 0; font-size: 10px; color: #666; line-height: 1.4;">
            هذه الصفحة جزء لا يتجزأ من عقد الإيجار رقم ${agreement.agreement_number} | 
            تاريخ الإنشاء: ${formatDate(new Date())} | 
            شركة العراف لتأجير السيارات ذ.م.م
          </p>
        </div>
      </div>

      <!-- صفحة التعهد والتوقيع منفصلة - مضغوطة لتناسب الصفحة -->
      <div style="page-break-before: always; margin: 0; padding: 15px; background: #fff;">
        
        <!-- عنوان صفحة التعهد مضغوط -->
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
          <h1 style="font-size: 18px; font-weight: bold; margin: 0; color: #000; line-height: 1.2;">
            دولة قطر - شركة العراف لتأجير السيارات ذ.م.م
          </h1>
          <p style="font-size: 10px; margin: 5px 0; color: #666; line-height: 1.3;">
            منطقة أم صلال علي، الدوحة | ص.ب 36126 | سجل تجاري: 146832
          </p>
        </div>

        <!-- عنوان التعهد مضغوط -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="font-size: 16px; font-weight: bold; background: #f0f0f0; padding: 10px; 
                     border: 2px solid #000; color: #000; margin: 0;">
            ✍️ إقرار وتعهد المستأجر بتقديم المستندات
          </h2>
        </div>

        <!-- بيانات العقد والعميل مضغوطة -->
        <div style="border: 2px solid #000; padding: 12px; margin: 15px 0; background: #f9f9f9;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; text-align: center; 
                     background: #e0e0e0; padding: 6px; border: 1px solid #000; color: #000;">
            بيانات العقد والمستأجر
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; padding: 5px; font-size: 12px; color: #000;">
                <strong>رقم العقد:</strong> ${agreement.agreement_number}
              </td>
              <td style="width: 50%; padding: 5px; font-size: 12px; color: #000;">
                <strong>تاريخ العقد:</strong> ${formatDate(new Date())}
              </td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 5px; font-size: 12px; color: #000;">
                <strong>اسم المستأجر:</strong> ${agreement.customers?.full_name || '_________________'}
              </td>
              <td style="width: 50%; padding: 5px; font-size: 12px; color: #000;">
                <strong>رقم الهوية:</strong> ${agreement.customers?.id_number || agreement.customers?.driver_license || '_________________'}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- نص التعهد مضغوط -->
        <div style="border: 2px solid #000; padding: 15px; margin: 15px 0; background: #fff;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; text-align: center; color: #000;
                     background: #f0f0f0; padding: 8px; border: 1px solid #000;">
            نص الإقرار والتعهد
          </h3>
          
          <div style="background: #f9f9f9; padding: 12px; border: 1px solid #666; margin: 10px 0;">
            <p style="font-size: 12px; text-align: justify; line-height: 1.6; color: #000; margin: 0 0 12px 0;">
              أقر وأتعهد أنا الطرف الثاني <strong>${agreement.customers?.full_name || '_________________'}</strong> 
              بتقديم جميع المستندات المطلوبة والمذكورة في الصفحة السابقة خلال فترة أقصاها 
              <strong style="color: #dc2626; background: #fef2f2; padding: 2px 4px; border: 1px solid #dc2626;">
                7 أيام من تاريخ توقيع هذا العقد
              </strong>، وأن جميع المستندات صحيحة وسارية المفعول وتخصني شخصياً.
            </p>
            
            <p style="font-size: 12px; text-align: justify; line-height: 1.6; color: #000; margin: 0 0 12px 0;">
              وأتحمل كامل المسؤولية القانونية والمالية عن صحة هذه البيانات والمستندات أمام القانون، 
              وأوافق على أن عدم تقديم هذه المستندات في الموعد المحدد قد يؤدي إلى إلغاء العقد 
              أو اتخاذ الإجراءات القانونية المناسبة ضدي وفقاً لقوانين دولة قطر النافذة.
            </p>
            
            <p style="font-size: 12px; text-align: justify; line-height: 1.6; color: #000; margin: 0;">
              وأقر بأنني قرأت وفهمت جميع بنود هذا التعهد وأوافق عليها بكامل الأهلية القانونية 
              ودون إكراه أو ضغط من أي جهة كانت.
            </p>
          </div>
        </div>
        
        <!-- منطقة التوقيع مضغوطة -->
        <div style="margin-top: 20px;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
            <tr style="background: #f0f0f0;">
              <td style="width: 40%; text-align: center; padding: 8px; border: 1px solid #000;">
                <strong style="color: #000; font-size: 14px;">بيانات المستأجر</strong>
              </td>
              <td style="width: 30%; text-align: center; padding: 8px; border: 1px solid #000;">
                <strong style="color: #000; font-size: 14px;">التوقيع</strong>
              </td>
              <td style="width: 30%; text-align: center; padding: 8px; border: 1px solid #000;">
                <strong style="color: #000; font-size: 14px;">التاريخ والختم</strong>
              </td>
            </tr>
            <tr>
              <td style="text-align: center; padding: 25px; border: 1px solid #000; background: #fff;">
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #000;">
                  <strong>الاسم:</strong><br>
                  <span style="font-size: 14px; font-weight: bold; color: #000;">
                    ${agreement.customers?.full_name || '_________________'}
                  </span>
                </p>
                <p style="margin: 0 0 10px 0; font-size: 10px; color: #666;">
                  <strong>رقم الهوية:</strong> ${agreement.customers?.id_number || agreement.customers?.driver_license || '_________________'}
                </p>
                <p style="margin: 0; font-size: 10px; color: #666;">
                  <strong>الجنسية:</strong> ${agreement.customers?.nationality || '_________________'}
                </p>
              </td>
              <td style="text-align: center; padding: 25px; border: 1px solid #000; background: #fff;">
                <div style="border-bottom: 2px solid #000; margin: 20px 10px; height: 40px;"></div>
                <strong style="color: #000; font-size: 12px;">توقيع المستأجر</strong>
              </td>
              <td style="text-align: center; padding: 25px; border: 1px solid #000; background: #fff;">
                <p style="margin: 0 0 15px 0; font-size: 12px; color: #000;">
                  <strong>التاريخ:</strong><br>
                  <span style="font-size: 14px; font-weight: bold; color: #000;">
                    ${formatDate(new Date())}
                  </span>
                </p>
                <div style="border: 1px solid #000; margin: 10px 5px; height: 35px; background: #f9f9f9;"></div>
                <strong style="color: #000; font-size: 10px;">الختم الشخصي</strong>
              </td>
            </tr>
          </table>
        </div>


        <!-- معلومات قانونية نهائية مضغوطة -->
        <div style="text-align: center; margin-top: 15px; border-top: 1px solid #000; padding-top: 10px;">
          <p style="margin: 0; font-size: 10px; color: #000; line-height: 1.4; font-weight: bold;">
            هذا التعهد جزء لا يتجزأ من عقد الإيجار رقم ${agreement.agreement_number} | 
            تاريخ الإنشاء: ${formatDate(new Date())} | شركة العراف ذ.م.م
          </p>
        </div>
      </div>
    `;
  }

  // قسم التوقيعات الرسمي
  const signatureSection = `
    <div style="page-break-before: always; margin: 20px 0;">
      <h2 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px;
                 border: 2px solid #000; padding: 12px; background: #f0f0f0; color: #000;">
        إقرار الطرفين والتوقيع
      </h2>
      
      <div style="border: 2px solid #000; padding: 15px; margin: 15px 0;">
        <p style="text-align: justify; line-height: 1.6; font-size: 12px; margin-bottom: 20px; color: #000;">
          لقد اطلع الطرفان على جميع بنود هذا العقد وفهماها تماماً، ووافقا عليها دون إكراه أو إجبار، 
          وتم توقيع هذا العقد في تاريخ <strong>${formatDate(new Date())}</strong> من نسختين أصليتين، 
          لكل طرف نسخة للعمل بموجبها.
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-weight: bold; font-size: 14px; margin: 15px 0; color: #000;">
            والله على ما نقول وكيل
          </p>
        </div>
        
        <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding: 15px; text-align: center; border: 1px solid #000;">
              <div style="margin-bottom: 45px;">
                <strong style="color: #000; font-size: 12px;">الطرف الأول (المؤجر)</strong><br>
                <span style="color: #000; font-size: 11px;">شركة العراف لتأجير السيارات ذ.م.م</span><br>
                <span style="color: #000; font-size: 11px;">ممثلة بالسيد/ خميس هاشم الجبر</span>
              </div>
              <div style="border-top: 2px solid #000; padding-top: 8px;">
                <strong style="color: #000; font-size: 11px;">التوقيع: _________________</strong><br><br>
                <strong style="color: #000; font-size: 11px;">التاريخ: _________________</strong><br><br>
                <strong style="color: #000; font-size: 11px;">الختم الرسمي</strong>
              </div>
            </td>
            <td style="width: 50%; padding: 15px; text-align: center; border: 1px solid #000;">
              <div style="margin-bottom: 45px;">
                <strong style="color: #000; font-size: 12px;">الطرف الثاني (المستأجر)</strong><br>
                <span style="color: #000; font-size: 11px;">${agreement.customers?.full_name || '_________________'}</span><br>
                <span style="color: #000; font-size: 11px;">رقم الهوية: ${agreement.customers?.id_number || agreement.customers?.driver_license || '_________________'}</span>
              </div>
              <div style="border-top: 2px solid #000; padding-top: 8px;">
                <strong style="color: #000; font-size: 11px;">التوقيع: _________________</strong><br><br>
                <strong style="color: #000; font-size: 11px;">التاريخ: _________________</strong><br><br>
                <strong style="color: #000; font-size: 11px;">بصمة الإبهام</strong>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  // Footer رسمي محسن للطباعة
  const documentFooter = `
    <div style="margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; text-align: center; font-size: 9px;">
      <p style="margin: 3px 0; color: #000;">
        هذا العقد محرر باللغة العربية ويخضع للقوانين المعمول بها في دولة قطر
      </p>
      <p style="margin: 3px 0; color: #666;">
        تاريخ الإنشاء: ${formatDate(new Date())} | وقت الإنشاء: ${new Date().toLocaleTimeString('ar-QA')}
      </p>
      <p style="margin: 3px 0; font-weight: bold; color: #000;">
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
    ${finesSection}
    ${legalTerms}
    ${idCardSection}
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

/**
 * تنسيق التاريخ بصيغة مبسطة DD/MM/YYYY
 */
function formatSimpleDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString;
  }
}

/**
 * تنسيق وصف الدفعة مع اسم الشهر بالعربية
 */
function formatPaymentDescription(dateString: string): string {
  if (!dateString) return 'دفعة إيجار شهرية';
  
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  try {
    const date = new Date(dateString);
    const monthName = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    
    return `إيجار شهر ${monthName} ${year}`;
  } catch (error) {
    return 'دفعة إيجار شهرية';
  }
}

/**
 * حساب تاريخ الاستحقاق الشهري الثابت (اليوم الأول من كل شهر)
 */
function formatMonthlyDueDate(startDateString: string, paymentIndex: number): string {
  try {
    const startDate = new Date(startDateString);
    const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + paymentIndex, 1);
    
    const day = targetDate.getDate();
    const month = targetDate.getMonth() + 1;
    const year = targetDate.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '1/1/2025';
  }
}

/**
 * تنسيق وصف الدفعة الشهرية مع اسم الشهر بالعربية
 */
function formatMonthlyPaymentDescription(startDateString: string, paymentIndex: number): string {
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  try {
    const startDate = new Date(startDateString);
    const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + paymentIndex, 1);
    
    const monthName = arabicMonths[targetDate.getMonth()];
    const year = targetDate.getFullYear();
    
    return `إيجار شهر ${monthName} ${year}`;
  } catch (error) {
    return 'دفعة إيجار شهرية';
  }
} 