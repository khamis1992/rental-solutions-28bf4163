// نظام تحليل ذكي للدفعات - مشترك بين جميع مكونات النظام
export interface PaymentData {
  id: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue';
  description?: string;
  created_at?: string;
}

// تحليل وصف الدفعة لاستخراج التاريخ
export function parsePaymentDescription(description: string): { month?: number; year?: number; isValid: boolean } {
  if (!description) return { isValid: false };

  const text = description.toLowerCase();
  
  // English month names
  const englishMonths = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  // Arabic month names  
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  let month: number | undefined;
  let year: number | undefined;

  // البحث عن الشهر الإنجليزي
  englishMonths.forEach((monthName, index) => {
    if (text.includes(monthName)) {
      month = index + 1;
    }
  });

  // البحث عن الشهر العربي
  arabicMonths.forEach((monthName, index) => {
    if (description.includes(monthName)) {
      month = index + 1;
    }
  });

  // البحث عن السنة (4 أرقام)
  const yearMatch = description.match(/20\d{2}/);
  if (yearMatch) {
    year = parseInt(yearMatch[0]);
  }

  const isValid = month !== undefined && year !== undefined;
  
  if (isValid) {
    console.log(`📝 تحليل الوصف: "${description}" -> شهر ${month}، سنة ${year}`);
  }

  return { month, year, isValid };
}

// تحديد الحالة الذكية للدفعة
export function getSmartPaymentStatus(
  payment: PaymentData, 
  currentDate: Date = new Date()
): {
  smartStatus: 'paid' | 'pending' | 'overdue';
  reason: string;
  isConflict: boolean;
  computedDate?: Date;
} {
  const databaseStatus = payment.status;
  
  // إذا كانت مدفوعة، فهي مدفوعة
  if (databaseStatus === 'paid') {
    return {
      smartStatus: 'paid',
      reason: 'الحالة مؤكدة: مدفوعة',
      isConflict: false
    };
  }

  // استخدام تاريخ الاستحقاق من قاعدة البيانات أولاً
  let referenceDate = new Date(payment.due_date);
  let dateSource = 'تاريخ الاستحقاق من قاعدة البيانات';

  // إذا لم يكن تاريخ الاستحقاق صحيحاً، جرب تحليل الوصف
  if (isNaN(referenceDate.getTime()) && payment.description) {
    const parsed = parsePaymentDescription(payment.description);
    if (parsed.isValid && parsed.month && parsed.year) {
      // آخر يوم في الشهر المحدد
      referenceDate = new Date(parsed.year, parsed.month, 0);
      dateSource = 'محسوب من وصف الدفعة';
    }
  }

  // إذا لا يزال التاريخ غير صحيح، استخدم التاريخ الحالي
  if (isNaN(referenceDate.getTime())) {
    return {
      smartStatus: databaseStatus as any,
      reason: 'لا يمكن تحديد تاريخ الاستحقاق - استخدام حالة قاعدة البيانات',
      isConflict: false
    };
  }

  // مقارنة التواريخ
  const isOverdue = referenceDate < currentDate;
  const smartStatus = isOverdue ? 'overdue' : 'pending';
  
  const isConflict = smartStatus !== databaseStatus;
  
  const daysDiff = Math.floor((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let reason: string;
  if (isOverdue) {
    reason = `متأخرة ${daysDiff} يوم (${dateSource})`;
  } else {
    reason = `معلقة - تستحق في ${referenceDate.toLocaleDateString('ar-QA')} (${dateSource})`;
  }

  return {
    smartStatus,
    reason,
    isConflict,
    computedDate: referenceDate
  };
}

// حساب إحصائيات الدفعات باستخدام التحليل الذكي
export function calculateSmartPaymentStats(payments: PaymentData[], currentDate: Date = new Date()) {
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  let conflictsCount = 0;
  
  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  
  const overduePayments: PaymentData[] = [];
  const pendingPayments: PaymentData[] = [];
  const paidPayments: PaymentData[] = [];
  
  payments.forEach(payment => {
    const analysis = getSmartPaymentStatus(payment, currentDate);
    
    if (analysis.isConflict) {
      conflictsCount++;
    }
    
    switch (analysis.smartStatus) {
      case 'paid':
        paidCount++;
        totalPaid += payment.amount;
        paidPayments.push(payment);
        break;
      case 'pending':
        pendingCount++;
        totalPending += payment.amount;
        pendingPayments.push(payment);
        break;
      case 'overdue':
        overdueCount++;
        totalOverdue += payment.amount;
        overduePayments.push(payment);
        break;
    }
  });

  // حساب غرامات التأخير (3000 ريال لكل شهر متأخر)
  const overdueMonthsCount = overduePayments.length; // كل دفعة متأخرة = شهر واحد
  const totalLateFees = overdueMonthsCount * 3000;

  return {
    counts: {
      paid: paidCount,
      pending: pendingCount,
      overdue: overdueCount,
      conflicts: conflictsCount,
      total: payments.length
    },
    amounts: {
      totalPaid,
      totalPending,
      totalOverdue,
      totalLateFees
    },
    payments: {
      overduePayments,
      pendingPayments,
      paidPayments
    },
    overdueMonthsCount
  };
}

// تحديث حالات الدفعات في قاعدة البيانات
export async function updatePaymentStatuses(
  payments: PaymentData[],
  supabaseClient: any,
  currentDate: Date = new Date()
): Promise<{ updated: number; errors: string[] }> {
  let updated = 0;
  const errors: string[] = [];

  for (const payment of payments) {
    try {
      const analysis = getSmartPaymentStatus(payment, currentDate);
      
      if (analysis.isConflict) {
        const { error } = await supabaseClient
          .from('payments')
          .update({ 
            status: analysis.smartStatus,
            description: `${payment.description || ''}\n[تحديث ذكي ${new Date().toLocaleString('ar-QA')}] ${analysis.reason}`.trim()
          })
          .eq('id', payment.id);

        if (error) {
          errors.push(`خطأ في تحديث الدفعة ${payment.id}: ${error.message}`);
        } else {
          updated++;
          console.log(`✅ تم تحديث الدفعة ${payment.id} من ${payment.status} إلى ${analysis.smartStatus}`);
        }
      }
    } catch (error) {
      errors.push(`خطأ في معالجة الدفعة ${payment.id}: ${error}`);
    }
  }

  return { updated, errors };
} 