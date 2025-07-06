import { supabase } from '../integrations/supabase/client';
import { InvoiceData, PaymentProcessingData, InvoiceValidationResult, InvoiceError } from '../types/invoice-types';

/**
 * أدوات معالجة وحساب الفواتير
 */

/**
 * التحقق من صحة بيانات الفاتورة
 */
export function validateInvoiceData(invoiceData: InvoiceData): InvoiceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // التحقق من وجود المبلغ
  const hasAmount = !!(invoiceData.amount && invoiceData.amount > 0);
  if (!hasAmount) {
    errors.push('مبلغ الفاتورة مطلوب ويجب أن يكون أكبر من صفر');
  } else if (invoiceData.amount > 50000) {
    warnings.push('مبلغ الفاتورة كبير جداً - يرجى التحقق من صحة المبلغ');
  } else if (invoiceData.amount < 100) {
    warnings.push('مبلغ الفاتورة صغير جداً - يرجى التحقق من صحة المبلغ');
  }

  // التحقق من التاريخ
  const hasDate = !!(invoiceData.date && isValidDate(invoiceData.date));
  if (!hasDate) {
    errors.push('تاريخ الفاتورة مطلوب ويجب أن يكون تاريخاً صحيحاً');
  } else {
    const invoiceDate = new Date(invoiceData.date);
    const today = new Date();
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - 6);
    
    if (invoiceDate > today) {
      warnings.push('تاريخ الفاتورة في المستقبل - يرجى التحقق');
    } else if (invoiceDate < monthsAgo) {
      warnings.push('تاريخ الفاتورة قديم جداً (أكثر من 6 أشهر)');
    }
  }

  // التحقق من وجود معلومات العميل أو السيارة
  const hasValidCustomerOrVehicle = !!(
    (invoiceData.customerName && invoiceData.customerName.trim().length > 2) ||
    (invoiceData.vehiclePlate && invoiceData.vehiclePlate.trim().length > 2)
  );
  
  if (!hasValidCustomerOrVehicle) {
    errors.push('يجب توفر اسم العميل أو رقم السيارة لربط الفاتورة بالعقد المناسب');
  }

  // التحقق من منطقية المبلغ
  const isAmountReasonable = hasAmount && invoiceData.amount >= 100 && invoiceData.amount <= 50000;
  
  // التحقق من صحة التاريخ
  const isDateValid = hasDate && isValidDate(invoiceData.date);
  
  // التحقق من المدى المتوقع
  const isWithinExpectedRange = hasAmount && invoiceData.amount >= 500 && invoiceData.amount <= 10000;
  if (!isWithinExpectedRange && hasAmount) {
    suggestions.push('المبلغ خارج المدى المعتاد لإيجار السيارات (500-10000 ريال)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    hasAmount,
    hasDate,
    hasValidCustomerOrVehicle,
    isAmountReasonable,
    isDateValid,
    isWithinExpectedRange
  };
}

/**
 * تحضير بيانات الدفعة للمعالجة
 */
export async function preparePaymentData(
  invoiceData: InvoiceData,
  agreementId: string
): Promise<PaymentProcessingData | { error: InvoiceError; message: string }> {
  try {
    // جلب بيانات العقد
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select(`
        id,
        agreement_number,
        rent_amount,
        start_date,
        status,
        customer_id,
        profiles!customer_id (
          full_name,
          phone
        )
      `)
      .eq('id', agreementId)
      .single();

    if (agreementError || !agreement) {
      return {
        error: 'NO_MATCHING_AGREEMENT',
        message: 'لم يتم العثور على العقد المحدد'
      };
    }

    if (agreement.status !== 'active') {
      return {
        error: 'AGREEMENT_INACTIVE',
        message: 'العقد غير نشط حالياً'
      };
    }

    // التحقق من وجود دفعة مماثلة
    const paymentDate = new Date(invoiceData.date);
    const { data: existingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, payment_date')
      .eq('lease_id', agreementId)
      .eq('amount', invoiceData.amount)
      .gte('payment_date', getDateRangeStart(paymentDate))
      .lte('payment_date', getDateRangeEnd(paymentDate));

    if (paymentsError) {
      console.error('خطأ في فحص الدفعات الموجودة:', paymentsError);
    }

    if (existingPayments && existingPayments.length > 0) {
      return {
        error: 'PAYMENT_ALREADY_EXISTS',
        message: 'توجد دفعة مماثلة بنفس المبلغ والتاريخ لهذا العقد'
      };
    }

    // حساب غرامات التأخير
    const { isLate, daysLate, lateFeeAmount } = calculatePaymentLateFee(
      paymentDate,
      agreement.start_date
    );

    // حساب المجموع النهائي
    const totalAmount = invoiceData.amount + lateFeeAmount;

    // تحديد طريقة الدفع
    const paymentMethod = invoiceData.paymentMethod || 'نقداً';

    // إنشاء الوصف
    const description = generatePaymentDescription(invoiceData, agreement);

    return {
      agreementId,
      amount: invoiceData.amount,
      paymentDate,
      paymentMethod,
      referenceNumber: invoiceData.invoiceNumber,
      description,
      isLate,
      daysLate,
      lateFeeAmount,
      totalAmount,
      processingStatus: 'pending',
      notes: invoiceData.description
    };

  } catch (error) {
    console.error('خطأ في تحضير بيانات الدفعة:', error);
    return {
      error: 'PROCESSING_ERROR',
      message: 'خطأ في معالجة بيانات الفاتورة'
    };
  }
}

/**
 * معالجة وحفظ الدفعة في النظام
 */
export async function processPayment(paymentData: PaymentProcessingData): Promise<{
  success: boolean;
  paymentId?: string;
  error?: InvoiceError;
  message?: string;
}> {
  try {
    // تحديث حالة المعالجة
    paymentData.processingStatus = 'processing';

    // إدراج الدفعة الأساسية
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        lease_id: paymentData.agreementId,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate.toISOString().split('T')[0],
        payment_method: paymentData.paymentMethod,
        status: 'completed',
        reference_number: paymentData.referenceNumber,
        notes: paymentData.description,
        late_fee: paymentData.lateFeeAmount,
        total_amount: paymentData.totalAmount
      })
      .select('id')
      .single();

    if (paymentError) {
      console.error('خطأ في إدراج الدفعة:', paymentError);
      return {
        success: false,
        error: 'PROCESSING_ERROR',
        message: 'فشل في حفظ الدفعة في قاعدة البيانات'
      };
    }

    // إدراج غرامة التأخير إذا كانت موجودة
    if (paymentData.lateFeeAmount > 0) {
      const { error: lateFeeError } = await supabase
        .from('payments')
        .insert({
          lease_id: paymentData.agreementId,
          amount: paymentData.lateFeeAmount,
          payment_date: paymentData.paymentDate.toISOString().split('T')[0],
          payment_method: paymentData.paymentMethod,
          status: 'completed',
          payment_type: 'late_fee',
          reference_number: `LATE-${paymentData.referenceNumber || payment.id}`,
          notes: `غرامة تأخير ${paymentData.daysLate} يوم - مرتبطة بالدفعة ${payment.id}`,
          parent_payment_id: payment.id
        });

      if (lateFeeError) {
        console.warn('تحذير: فشل في إدراج غرامة التأخير:', lateFeeError);
        // لا نوقف العملية، فقط نسجل تحذير
      }
    }

    // تحديث حالة الدفعات المستحقة في العقد
    await updateLeasePaymentStatus(paymentData.agreementId);

    paymentData.processingStatus = 'completed';

    return {
      success: true,
      paymentId: payment.id,
      message: 'تم تسجيل الدفعة بنجاح'
    };

  } catch (error) {
    console.error('خطأ في معالجة الدفعة:', error);
    return {
      success: false,
      error: 'PROCESSING_ERROR',
      message: 'خطأ غير متوقع في معالجة الدفعة'
    };
  }
}

/**
 * حساب غرامة التأخير للدفعة
 */
export function calculatePaymentLateFee(
  paymentDate: Date,
  agreementStartDate: string
): {
  isLate: boolean;
  daysLate: number;
  lateFeeAmount: number;
} {
  // تحديد تاريخ استحقاق الدفعة (اليوم الأول من الشهر)
  const paymentMonth = paymentDate.getMonth();
  const paymentYear = paymentDate.getFullYear();
  const dueDate = new Date(paymentYear, paymentMonth, 1);

  // إذا كان تاريخ الدفع في اليوم الأول، فلا توجد غرامة
  if (paymentDate.getDate() === 1) {
    return {
      isLate: false,
      daysLate: 0,
      lateFeeAmount: 0
    };
  }

  // حساب عدد الأيام المتأخرة
  const timeDiff = paymentDate.getTime() - dueDate.getTime();
  const daysLate = Math.floor(timeDiff / (1000 * 3600 * 24));

  if (daysLate <= 0) {
    return {
      isLate: false,
      daysLate: 0,
      lateFeeAmount: 0
    };
  }

  // استخدام نظام غرامات التأخير الموجود
  const lateFeeAmount = calculateLateFee(daysLate);

  return {
    isLate: true,
    daysLate,
    lateFeeAmount
  };
}

/**
 * تحديث حالة الدفعات في العقد
 */
async function updateLeasePaymentStatus(agreementId: string): Promise<void> {
  try {
    // جلب جميع الدفعات المتعلقة بالعقد
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('lease_id', agreementId)
      .eq('status', 'completed');

    if (error) {
      console.error('خطأ في جلب الدفعات:', error);
      return;
    }

    // حساب إجمالي المدفوعات
    const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

    // تحديث معلومات العقد (إذا كان هناك حقول ذات صلة)
    // يمكن إضافة المزيد من المنطق هنا حسب الحاجة

  } catch (error) {
    console.error('خطأ في تحديث حالة الدفعات:', error);
  }
}

/**
 * إنشاء وصف للدفعة
 */
function generatePaymentDescription(invoiceData: InvoiceData, agreement: any): string {
  let description = 'دفعة من فاتورة ممسوحة';

  if (invoiceData.category) {
    const categoryNames = {
      'rent': 'إيجار شهري',
      'fuel': 'وقود',
      'maintenance': 'صيانة',
      'fine': 'مخالفة مرورية',
      'other': 'دفعة أخرى'
    };
    description = categoryNames[invoiceData.category] || description;
  }

  if (invoiceData.invoiceNumber) {
    description += ` - فاتورة ${invoiceData.invoiceNumber}`;
  }

  if (agreement.agreement_number) {
    description += ` - عقد ${agreement.agreement_number}`;
  }

  return description;
}

/**
 * التحقق من صحة التاريخ
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('-');
}

/**
 * الحصول على بداية المدى الزمني للبحث عن الدفعات المكررة
 */
function getDateRangeStart(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - 3); // 3 أيام قبل
  return start.toISOString().split('T')[0];
}

/**
 * الحصول على نهاية المدى الزمني للبحث عن الدفعات المكررة
 */
function getDateRangeEnd(date: Date): string {
  const end = new Date(date);
  end.setDate(end.getDate() + 3); // 3 أيام بعد
  return end.toISOString().split('T')[0];
}

/**
 * تنسيق المبلغ بالريال القطري
 */
export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ر.ق';
  }
  
  return new Intl.NumberFormat('ar-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatArabicDate(dateString: string | null | undefined): string {
  if (!dateString || dateString.trim() === '') {
    return 'غير محدد';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'تاريخ غير صالح';
    }
    
    return new Intl.DateTimeFormat('ar-QA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return 'تاريخ غير صالح';
  }
}

/**
 * إنشاء ملخص للفاتورة المعالجة
 */
export function generateInvoiceSummary(
  invoiceData: InvoiceData,
  paymentData: PaymentProcessingData
): string {
  // التأكد من أن البيانات صالحة
  const safeInvoiceData = {
    amount: invoiceData?.amount || 0,
    date: invoiceData?.date || '',
    vehiclePlate: invoiceData?.vehiclePlate || 'غير محدد',
    customerName: invoiceData?.customerName || 'غير محدد'
  };
  
  const safePaymentData = {
    isLate: paymentData?.isLate || false,
    daysLate: paymentData?.daysLate || 0,
    lateFeeAmount: paymentData?.lateFeeAmount || 0,
    totalAmount: paymentData?.totalAmount || 0,
    processingStatus: paymentData?.processingStatus || 'غير محدد',
    paymentMethod: paymentData?.paymentMethod || 'غير محدد'
  };

  const lines = [
    `📋 **ملخص الفاتورة المعالجة**`,
    ``,
    `💰 المبلغ: ${formatAmount(safeInvoiceData.amount)}`,
    `📅 التاريخ: ${formatArabicDate(safeInvoiceData.date)}`,
    `🚗 رقم السيارة: ${safeInvoiceData.vehiclePlate}`,
    `👤 العميل: ${safeInvoiceData.customerName}`,
    ``
  ];

  if (safePaymentData.isLate) {
    lines.push(
      `⚠️ **دفعة متأخرة**`,
      `🗓️ متأخرة ${safePaymentData.daysLate} يوم`,
      `💸 غرامة التأخير: ${formatAmount(safePaymentData.lateFeeAmount)}`,
      `💵 المجموع النهائي: ${formatAmount(safePaymentData.totalAmount)}`,
      ``
    );
  }

  lines.push(
    `✅ تم تسجيل الدفعة بنجاح`,
    `🔄 الحالة: ${safePaymentData.processingStatus}`,
    `💳 طريقة الدفع: ${safePaymentData.paymentMethod}`
  );

  return lines.join('\n');
}

/**
 * إنشاء تقرير معالجة مفصل
 */
export function generateProcessingReport(
  invoiceData: InvoiceData,
  matchResult: any,
  paymentData: PaymentProcessingData,
  processingTime: number
): string {
  const report = {
    timestamp: new Date().toISOString(),
    invoiceData,
    matchResult,
    paymentData,
    processingTime,
    status: paymentData.processingStatus
  };

  return JSON.stringify(report, null, 2);
}

/**
 * حساب غرامة التأخير بناءً على عدد الأيام
 * @param daysLate - عدد أيام التأخير
 * @returns مبلغ غرامة التأخير
 */
function calculateLateFee(daysLate: number): number {
  if (daysLate <= 0) return 0;
  
  // غرامة 120 ريال لكل يوم، بحد أقصى 3000 ريال
  const dailyFee = 120;
  const maxFee = 3000;
  const totalFee = daysLate * dailyFee;
  
  return Math.min(totalFee, maxFee);
} 