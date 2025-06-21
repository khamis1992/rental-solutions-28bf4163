/**
 * تقرير العقد المحدث - يستخدم النظام الموحد الجديد
 * بدلاً من pdfMake القديم الذي يعاني من مشاكل الخطوط
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
 * إنشاء تقرير عقد محدث باستخدام النظام الموحد
 */
export async function generateModernAgreementPDF(
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
  const progress = agreement.total_amount > 0 ? (totalPaid / agreement.total_amount * 100) : 0;
  
  // معلومات العميل
  const customerInfo = createInfoCard('معلومات العميل', [
    { label: 'الاسم الكامل', value: agreement.customers?.full_name || 'غير محدد' },
    { label: 'رقم الهوية', value: agreement.customers?.id_number || 'غير محدد' },
    { label: 'رقم الهاتف', value: agreement.customers?.phone_number || 'غير محدد' },
    { label: 'البريد الإلكتروني', value: agreement.customers?.email || 'غير محدد' },
    { label: 'الجنسية', value: agreement.customers?.nationality || 'غير محدد' },
    { label: 'رخصة القيادة', value: agreement.customers?.driver_license || 'غير محدد' }
  ]);

  // معلومات المركبة
  const vehicleInfo = createInfoCard('معلومات المركبة', [
    { label: 'الماركة والموديل', value: `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}`.trim() || 'غير محدد' },
    { label: 'سنة الصنع', value: agreement.vehicles?.year?.toString() || 'غير محدد' },
    { label: 'رقم اللوحة', value: agreement.vehicles?.license_plate || 'غير محدد' },
    { label: 'اللون', value: agreement.vehicles?.color || 'غير محدد' },
    { label: 'رقم الهيكل', value: agreement.vehicles?.vin || 'غير محدد' }
  ]);

  // معلومات العقد
  const contractInfo = createInfoCard('تفاصيل العقد', [
    { label: 'رقم العقد', value: agreement.agreement_number },
    { label: 'تاريخ البداية', value: formatDate(agreement.start_date) },
    { label: 'تاريخ النهاية', value: formatDate(agreement.end_date) },
    { label: 'الأجرة الشهرية', value: formatCurrency(agreement.rent_amount) + ' ر.ق' },
    { label: 'إجمالي العقد', value: formatCurrency(agreement.total_amount) + ' ر.ق' },
    { label: 'حالة العقد', value: getStatusText(agreement.status) }
  ]);

  // الملخص المالي
  const financialSummary = `
    <div class="summary-cards">
      ${createSummaryCard('إجمالي العقد', agreement.total_amount, 'neutral')}
      ${createSummaryCard('المبلغ المدفوع', totalPaid, 'positive')}
      ${createSummaryCard('المبلغ المعلق', totalPending, 'warning')}
      ${createSummaryCard('المتأخرات', totalOverdue, 'negative')}
      ${createSummaryCard('المخالفات المرورية', totalFines, totalFines > 0 ? 'negative' : 'neutral')}
      ${createSummaryCard('نسبة الإنجاز', progress, 'neutral')}
    </div>
  `;

  // جدول الدفعات
  let paymentsSection = '';
  if (payments.length > 0) {
    const paymentHeaders = ['تاريخ الاستحقاق', 'تاريخ الدفع', 'المبلغ', 'طريقة الدفع', 'الحالة', 'الوصف'];
    const paymentRows = payments.map(payment => [
      formatDate(payment.due_date),
      payment.payment_date ? formatDate(payment.payment_date) : 'لم يدفع بعد',
      formatCurrency(payment.amount) + ' ر.ق',
      payment.payment_method || 'غير محدد',
      getPaymentStatusText(payment.status),
      payment.description || 'دفعة عقد إيجار'
    ]);

    paymentsSection = `
      <h2 class="section-header">سجل الدفعات</h2>
      ${createDataTable(paymentHeaders, paymentRows)}
    `;
  }

  // جدول المخالفات المرورية
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

    finesSection = `
      <h2 class="section-header">المخالفات المرورية</h2>
      ${createDataTable(fineHeaders, fineRows)}
      ${createHighlightBox(
        `<strong>تنبيه:</strong> إجمالي المخالفات المرورية: <strong>${formatCurrency(totalFines)} ر.ق</strong>. يجب سداد المخالفات لتجنب المشاكل القانونية.`,
        'alert'
      )}
    `;
  }

  // تحليل الوضع المالي
  const financialAnalysis = createHighlightBox(
    `
      <h4>📊 تحليل الوضع المالي:</h4>
      <ul style="margin: 10px 0; padding-right: 20px;">
        <li><strong>نسبة الإنجاز:</strong> ${progress.toFixed(1)}% من إجمالي العقد</li>
        <li><strong>المبلغ المتبقي:</strong> ${formatCurrency(agreement.total_amount - totalPaid)} ر.ق</li>
        <li><strong>الالتزام بالدفع:</strong> ${totalOverdue === 0 ? '✅ ممتاز - لا توجد متأخرات' : '⚠️ يوجد متأخرات تحتاج متابعة'}</li>
        <li><strong>المخالفات:</strong> ${totalFines === 0 ? '✅ لا توجد مخالفات مرورية' : `⚠️ يوجد مخالفات بقيمة ${formatCurrency(totalFines)} ر.ق`}</li>
      </ul>
    `,
    totalOverdue > 0 || totalFines > 0 ? 'warning' : 'success'
  );

  // البنود القانونية الشاملة للعقد
  const legalTerms = `
    <div style="page-break-before: always; margin: 30px 0;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 25px; text-align: center; margin: 30px 0; border-radius: 15px; box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔴 تنبيه مهم جداً</h1>
        <p style="margin: 15px 0 0 0; font-size: 18px; font-weight: bold;">
          يُرجى قراءة جميع البنود والشروط التالية بعناية فائقة قبل التوقيع<br>
          هذه البنود ملزمة قانونياً وتحكم العلاقة التعاقدية بين الطرفين
        </p>
      </div>
    </div>
    
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
      
      <div style="margin: 30px 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 15px; border-right: 8px solid #1e3a8a; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #1e3a8a; margin-bottom: 20px; font-size: 20px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
          <span style="background: #1e3a8a; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">1</span>
          المادة الأولى: موضوع العقد
        </h2>
        <div style="background: white; padding: 20px; border-radius: 10px; border-right: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 16px; line-height: 1.8;">
            يؤجر الطرف الأول للطرف الثاني المركبة المبينة أوصافها في هذا العقد، وهي مركبة 
            <strong style="color: #dc2626; background: #fef2f2; padding: 3px 8px; border-radius: 4px;">${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''}</strong> 
            موديل <strong style="background: #f3f4f6; padding: 3px 8px; border-radius: 4px;">${agreement.vehicles?.year || ''}</strong>، 
            رقم اللوحة <strong style="color: #dc2626; background: #fef2f2; padding: 3px 8px; border-radius: 4px;">${agreement.vehicles?.license_plate || ''}</strong>، 
            رقم الهيكل <strong>${agreement.vehicles?.vin || ''}</strong>، 
            اللون <strong>${agreement.vehicles?.color || ''}</strong>. 
            والمركبة المذكورة هي ملك للطرف الأول وفي حالة جيدة وصالحة للاستعمال.
          </p>
        </div>
      </div>
      
      <div style="margin: 30px 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 15px; border-right: 8px solid #1e3a8a; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #1e3a8a; margin-bottom: 20px; font-size: 20px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
          <span style="background: #1e3a8a; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">2</span>
          المادة الثانية: مدة الإيجار
        </h2>
        <div style="background: white; padding: 20px; border-radius: 10px; border-right: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 16px; line-height: 1.8;">
            مدة الإيجار من تاريخ <strong style="color: #dc2626; background: #fef2f2; padding: 3px 8px; border-radius: 4px;">${formatDate(agreement.start_date)}</strong> 
            وحتى تاريخ <strong style="color: #dc2626; background: #fef2f2; padding: 3px 8px; border-radius: 4px;">${formatDate(agreement.end_date)}</strong>، 
            وتكون قابلة للتجديد بموافقة الطرفين. وينتهي العقد تلقائياً بانتهاء المدة المحددة دون الحاجة إلى إنذار.
          </p>
        </div>
      </div>
      
      <div style="margin: 30px 0; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 15px; border-right: 8px solid #16a34a; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #16a34a; margin-bottom: 20px; font-size: 20px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
          <span style="background: #16a34a; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">3</span>
          المادة الثالثة: بدل الإيجار والمبالغ المطلوبة
        </h2>
        <div style="background: white; padding: 20px; border-radius: 10px; border-right: 4px solid #22c55e;">
          <p style="margin: 0; font-size: 16px; line-height: 1.8;">
            يلتزم الطرف الثاني بدفع أجرة شهرية قدرها 
            <strong style="color: #dc2626; background: #fef2f2; padding: 5px 10px; border-radius: 6px; font-size: 18px;">${formatCurrency(agreement.rent_amount)} ريال قطري</strong> 
            شهرياً، تدفع مقدماً في بداية كل شهر. 
            <strong>إجمالي قيمة العقد: ${formatCurrency(agreement.total_amount)} ريال قطري</strong>
          </p>
        </div>
      </div>
      
      <div style="margin: 30px 0; background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 25px; border-radius: 15px; border-right: 8px solid #eab308; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #eab308; margin-bottom: 20px; font-size: 20px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
          <span style="background: #eab308; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">4</span>
          المادة الرابعة: التزامات المستأجر
        </h2>
        <div style="background: white; padding: 20px; border-radius: 10px; border-right: 4px solid #facc15;">
          <p style="margin-bottom: 15px; font-weight: bold; color: #eab308; font-size: 16px;">يلتزم الطرف الثاني بما يلي:</p>
          <ul style="padding-right: 25px; line-height: 1.8; font-size: 15px;">
            <li style="margin: 12px 0; padding: 8px; background: #fefce8; border-radius: 6px;"><strong>الاستخدام المشروع:</strong> عدم استخدام المركبة في أغراض غير مشروعة أو مخالفة للقانون</li>
            <li style="margin: 12px 0; padding: 8px; background: #fefce8; border-radius: 6px;"><strong>قوانين المرور:</strong> الالتزام الكامل بقوانين المرور والسلامة العامة</li>
            <li style="margin: 12px 0; padding: 8px; background: #fefce8; border-radius: 6px;"><strong>عدم التأجير من الباطن:</strong> عدم تأجير المركبة لطرف ثالث دون موافقة كتابية من المؤجر</li>
            <li style="margin: 12px 0; padding: 8px; background: #fefce8; border-radius: 6px;"><strong>الصيانة:</strong> الحفاظ على المركبة وإجراء الصيانة الدورية على نفقته الخاصة</li>
            <li style="margin: 12px 0; padding: 8px; background: #fefce8; border-radius: 6px;"><strong>الإبلاغ الفوري:</strong> إبلاغ المؤجر فوراً عن أي حادث أو عطل أو مخالفة</li>
            <li style="margin: 12px 0; padding: 8px; background: #fefce8; border-radius: 6px;"><strong>المخالفات المرورية:</strong> دفع قيمة جميع المخالفات المرورية المترتبة على استخدامه للمركبة</li>
            <li style="margin: 12px 0; padding: 8px; background: #fefce8; border-radius: 6px;"><strong>التأمين:</strong> الحفاظ على سريان التأمين الشامل للمركبة طوال مدة العقد</li>
          </ul>
        </div>
      </div>
      
      <div style="margin: 30px 0; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 25px; border-radius: 15px; border-right: 8px solid #dc2626; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #dc2626; margin-bottom: 20px; font-size: 20px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
          <span style="background: #dc2626; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">5</span>
          المادة الخامسة: المخالفات والغرامات
        </h2>
        <div style="background: white; padding: 20px; border-radius: 10px; border-right: 4px solid #ef4444;">
          <p style="margin-bottom: 15px; font-weight: bold; color: #dc2626; font-size: 16px;">في حالة مخالفة أي من بنود هذا العقد:</p>
          <ul style="padding-right: 25px; line-height: 1.8; font-size: 15px;">
            <li style="margin: 12px 0; padding: 10px; background: #fef2f2; border-radius: 6px; border-right: 3px solid #dc2626;">
              <strong>التأخير في الدفع:</strong> غرامة قدرها <strong style="color: #dc2626; font-size: 16px;">120 ريال قطري يومياً</strong> عن كل يوم تأخير بعد 7 أيام من تاريخ الاستحقاق
            </li>
            <li style="margin: 12px 0; padding: 10px; background: #fef2f2; border-radius: 6px; border-right: 3px solid #dc2626;">
              <strong>التأخير لأكثر من شهر:</strong> يحق للمؤجر استرداد المركبة فوراً مع احتفاظه بجميع المبالغ المدفوعة
            </li>
            <li style="margin: 12px 0; padding: 10px; background: #fef2f2; border-radius: 6px; border-right: 3px solid #dc2626;">
              <strong>عدم إرجاع المركبة:</strong> غرامة يومية قدرها <strong style="color: #dc2626; font-size: 16px;">200 ريال قطري</strong> عن كل يوم تأخير في الإرجاع
            </li>
          </ul>
        </div>
      </div>
      
      <div style="margin: 30px 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 15px; border-right: 8px solid #64748b; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #64748b; margin-bottom: 20px; font-size: 20px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
          <span style="background: #64748b; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">6</span>
          المادة السادسة: فسخ العقد وإنهاؤه
        </h2>
        <div style="background: white; padding: 20px; border-radius: 10px; border-right: 4px solid #94a3b8;">
          <p style="margin-bottom: 15px; font-weight: bold; color: #64748b; font-size: 16px;">شروط فسخ العقد:</p>
          <ul style="padding-right: 25px; line-height: 1.8; font-size: 15px;">
            <li style="margin: 12px 0; padding: 8px; background: #f8fafc; border-radius: 6px;"><strong>الفسخ بالاتفاق:</strong> يحق لأي من الطرفين فسخ العقد بإشعار كتابي مدته 30 يوماً</li>
            <li style="margin: 12px 0; padding: 8px; background: #f8fafc; border-radius: 6px;"><strong>الفسخ الفوري:</strong> يحق للمؤجر فسخ العقد فوراً في حالة عدم دفع الأجرة لمدة شهر</li>
            <li style="margin: 12px 0; padding: 8px; background: #f8fafc; border-radius: 6px;"><strong>مخالفة البنود:</strong> فسخ فوري في حالة مخالفة أي من بنود العقد الجوهرية</li>
            <li style="margin: 12px 0; padding: 8px; background: #f8fafc; border-radius: 6px;"><strong>إرجاع المركبة:</strong> يلتزم المستأجر بإرجاع المركبة في الحالة التي تسلمها عليها</li>
          </ul>
        </div>
      </div>
      
      <div style="margin: 30px 0; background: linear-gradient(135deg, #fefbf3 0%, #fef3c7 100%); padding: 25px; border-radius: 15px; border-right: 8px solid #f59e0b; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #f59e0b; margin-bottom: 20px; font-size: 20px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
          <span style="background: #f59e0b; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">7</span>
          المادة السابعة: القانون المطبق والاختصاص القضائي
        </h2>
        <div style="background: white; padding: 20px; border-radius: 10px; border-right: 4px solid #fbbf24;">
          <ul style="padding-right: 25px; line-height: 1.8; list-style: none; font-size: 15px;">
            <li style="margin: 12px 0; padding: 12px; background: #fefbf3; border-radius: 8px; border-right: 3px solid #f59e0b;">
              <strong>🏛️ القانون المطبق:</strong> يخضع هذا العقد لقوانين دولة قطر النافذة
            </li>
            <li style="margin: 12px 0; padding: 12px; background: #fefbf3; border-radius: 8px; border-right: 3px solid #f59e0b;">
              <strong>⚖️ الاختصاص القضائي:</strong> تختص المحاكم القطرية المختصة بنظر أي نزاع ينشأ عن هذا العقد
            </li>
            <li style="margin: 12px 0; padding: 12px; background: #fefbf3; border-radius: 8px; border-right: 3px solid #f59e0b;">
              <strong>🌐 اللغة المعتمدة:</strong> النص العربي لهذا العقد هو المعتمد في التفسير والتطبيق
            </li>
          </ul>
        </div>
      </div>

      <div style="margin: 30px 0; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 15px; border: 3px solid #16a34a; box-shadow: 0 6px 20px rgba(22, 163, 74, 0.2);">
        <h2 style="color: #16a34a; margin-bottom: 20px; font-size: 20px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px;">
          <span style="background: #16a34a; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">8</span>
          المادة الثامنة: أحكام عامة
        </h2>
        <div style="background: white; padding: 20px; border-radius: 10px; border-right: 4px solid #22c55e;">
          <ul style="padding-right: 25px; line-height: 1.8; font-size: 15px;">
            <li style="margin: 10px 0; padding: 8px; background: #f0fdf4; border-radius: 6px;"><strong>التعديل:</strong> لا يجوز تعديل أي بند من بنود هذا العقد إلا بموافقة كتابية من الطرفين</li>
            <li style="margin: 10px 0; padding: 8px; background: #f0fdf4; border-radius: 6px;"><strong>الإشعارات:</strong> جميع الإشعارات تكون كتابية وترسل للعناوين المذكورة في العقد</li>
            <li style="margin: 10px 0; padding: 8px; background: #f0fdf4; border-radius: 6px;"><strong>القوة القاهرة:</strong> لا يتحمل أي من الطرفين مسؤولية التأخير الناتج عن ظروف القوة القاهرة</li>
            <li style="margin: 10px 0; padding: 8px; background: #f0fdf4; border-radius: 6px;"><strong>صحة العقد:</strong> إذا أصبح أي بند باطلاً، يبقى باقي العقد نافذاً</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // محتوى التقرير
  const content = `
    ${financialSummary}
    
    ${financialAnalysis}
    
    <h2 class="section-header">معلومات أطراف العقد</h2>
    <div class="info-grid">
      ${customerInfo}
      ${vehicleInfo}
    </div>
    
    <div class="info-grid">
      ${contractInfo}
    </div>
    
    ${paymentsSection}
    
    ${finesSection}
    
    ${legalTerms}
    
    ${createSignatureSection()}
  `;

  // تكوين PDF
  const config: PDFConfig = {
    title: `تقرير عقد الإيجار رقم ${agreement.agreement_number}`,
    filename: `تقرير-عقد-${agreement.agreement_number}-${new Date().toISOString().split('T')[0]}`,
    rtl: true,
    companyInfo: true,
    includeFooter: true
  };

  // أنماط مخصصة
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
    'paid': '✅ مدفوع',
    'pending': '⏳ معلق',
    'overdue': '❌ متأخر',
    'cancelled': '🚫 ملغي',
    'refunded': '↩️ مسترد'
  };
  return statusMap[status] || status;
} 