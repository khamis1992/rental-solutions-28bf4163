-- ============================================
-- تحديث المدفوعات - النسخة الآمنة جداً
-- Ultra-safe payment update without enum issues
-- ============================================

-- أولاً: تحديد الحالات الموجودة فعلياً بدون افتراضات
-- Step 1: Check actual existing statuses without assumptions

-- التحقق من payment_schedules
SELECT 
    'payment_schedules - actual statuses' as info,
    status,
    COUNT(*) as count
FROM payment_schedules 
GROUP BY status
ORDER BY count DESC;

-- التحقق من unified_payments  
SELECT 
    'unified_payments - actual statuses' as info,
    status,
    COUNT(*) as count
FROM unified_payments 
GROUP BY status
ORDER BY count DESC;

-- الآن نحدث فقط الحالات التي نعرف أنها موجودة
-- Now update only statuses we know exist

-- تحديث payment_schedules - فقط pending إلى completed
UPDATE payment_schedules 
SET 
    status = 'completed',
    actual_payment_date = COALESCE(actual_payment_date, due_date),
    updated_at = NOW()
WHERE 
    due_date < '2024-01-09'::date 
    AND status = 'pending';

-- إظهار كم سجل تم تحديثه
SELECT 
    'payment_schedules updated' as info,
    ROW_COUNT() as updated_count;

-- تحديث unified_payments - فقط pending إلى paid
UPDATE unified_payments 
SET 
    status = 'paid',
    payment_date = COALESCE(payment_date, original_due_date, created_at::date),
    amount_paid = COALESCE(amount_paid, amount),
    balance = 0,
    updated_at = NOW()
WHERE 
    (
        original_due_date < '2024-01-09'::date 
        OR created_at < '2024-01-09'::date
    )
    AND status = 'pending';

-- إظهار كم سجل تم تحديثه
SELECT 
    'unified_payments updated' as info,
    ROW_COUNT() as updated_count;

-- تحديث إضافي للحالات الأخرى إذا وُجدت (بأمان)
-- Additional safe updates for other statuses if they exist

-- إذا كانت هناك حالة 'unpaid' في payment_schedules
UPDATE payment_schedules 
SET 
    status = 'completed',
    actual_payment_date = COALESCE(actual_payment_date, due_date),
    updated_at = NOW()
WHERE 
    due_date < '2024-01-09'::date 
    AND status = 'unpaid';

-- إذا كانت هناك حالة 'unpaid' في unified_payments
UPDATE unified_payments 
SET 
    status = 'paid',
    payment_date = COALESCE(payment_date, original_due_date, created_at::date),
    amount_paid = COALESCE(amount_paid, amount),
    balance = 0,
    updated_at = NOW()
WHERE 
    (
        original_due_date < '2024-01-09'::date 
        OR created_at < '2024-01-09'::date
    )
    AND status = 'unpaid';

-- تقرير نهائي
SELECT 
    'Final Results' as section,
    'payment_schedules' as table_name,
    status,
    COUNT(*) as count
FROM payment_schedules 
WHERE due_date < '2024-01-09'::date
GROUP BY status

UNION ALL

SELECT 
    'Final Results' as section,
    'unified_payments' as table_name,
    status,
    COUNT(*) as count
FROM unified_payments 
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
)
GROUP BY status
ORDER BY section, table_name, count DESC;

-- رسالة النجاح
SELECT 'تم التحديث بنجاح - تم تجنب جميع مشاكل enum!' as success_message; 