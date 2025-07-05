-- ============================================
-- تحديث جميع المدفوعات قبل 9 يناير 2024 لتكون مدفوعة
-- Update all payments before January 9, 2024 to be paid
-- ============================================

BEGIN;

-- 1. تحديث جدول payment_schedules
-- Update payment_schedules table
UPDATE payment_schedules 
SET 
    status = 'completed',
    actual_payment_date = CASE 
        WHEN actual_payment_date IS NULL THEN due_date 
        ELSE actual_payment_date 
    END,
    updated_at = NOW()
WHERE 
    due_date < '2024-01-09'::date 
    AND status IN ('pending', 'overdue');

-- 2. تحديث جدول unified_payments
-- Update unified_payments table
UPDATE unified_payments 
SET 
    status = 'completed',
    payment_date = CASE 
        WHEN payment_date IS NULL THEN 
            COALESCE(original_due_date, created_at::date)
        ELSE payment_date 
    END,
    amount_paid = CASE 
        WHEN amount_paid IS NULL OR amount_paid = 0 THEN amount 
        ELSE amount_paid 
    END,
    balance = 0,
    updated_at = NOW()
WHERE 
    (
        original_due_date < '2024-01-09'::date 
        OR created_at < '2024-01-09'::date
        OR payment_date < '2024-01-09'::date
    )
    AND status IN ('pending', 'overdue', 'partial');

-- 3. عرض تقرير للتحقق من التحديثات
-- Show report of updates
SELECT 
    'payment_schedules' as table_name,
    COUNT(*) as updated_records,
    'completed before 2024-01-09' as description
FROM payment_schedules 
WHERE due_date < '2024-01-09'::date AND status = 'completed'

UNION ALL

SELECT 
    'unified_payments' as table_name,
    COUNT(*) as updated_records,
    'completed before 2024-01-09' as description
FROM unified_payments 
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
    OR payment_date < '2024-01-09'::date
) AND status = 'completed';

-- 4. عرض إحصائيات مفصلة لكل جدول
-- Show detailed statistics for each table

-- إحصائيات payment_schedules
SELECT 
    'payment_schedules - Total Records' as description,
    COUNT(*) as count
FROM payment_schedules
WHERE due_date < '2024-01-09'::date

UNION ALL

SELECT 
    'payment_schedules - Completed Records' as description,
    COUNT(*) as count
FROM payment_schedules
WHERE due_date < '2024-01-09'::date AND status = 'completed'

UNION ALL

SELECT 
    'payment_schedules - Pending/Overdue Records' as description,
    COUNT(*) as count
FROM payment_schedules
WHERE due_date < '2024-01-09'::date AND status IN ('pending', 'overdue')

UNION ALL

-- إحصائيات unified_payments
SELECT 
    'unified_payments - Total Records' as description,
    COUNT(*) as count
FROM unified_payments
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
    OR payment_date < '2024-01-09'::date
)

UNION ALL

SELECT 
    'unified_payments - Completed Records' as description,
    COUNT(*) as count
FROM unified_payments
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
    OR payment_date < '2024-01-09'::date
) AND status = 'completed'

UNION ALL

SELECT 
    'unified_payments - Pending/Overdue/Partial Records' as description,
    COUNT(*) as count
FROM unified_payments
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
    OR payment_date < '2024-01-09'::date
) AND status IN ('pending', 'overdue', 'partial');

COMMIT;

-- ============================================
-- في حالة الحاجة للتراجع عن التحديثات (للطوارئ فقط)
-- In case rollback is needed (emergency only)
-- ============================================

/*
-- DON'T RUN UNLESS NEEDED - للتراجع عن التحديثات
BEGIN;

-- إعادة تعيين payment_schedules إلى pending للمدفوعات التي لم تدفع فعلياً
UPDATE payment_schedules 
SET 
    status = 'pending',
    actual_payment_date = NULL,
    updated_at = NOW()
WHERE 
    due_date < '2024-01-09'::date 
    AND status = 'completed'
    AND actual_payment_date = due_date; -- فقط التي تم تحديثها بالـ script

-- إعادة تعيين unified_payments إلى pending
UPDATE unified_payments 
SET 
    status = 'pending',
    payment_date = NULL,
    amount_paid = 0,
    balance = amount,
    updated_at = NOW()
WHERE 
    (
        original_due_date < '2024-01-09'::date 
        OR created_at < '2024-01-09'::date
    )
    AND status = 'completed'
    AND payment_date = COALESCE(original_due_date, created_at::date); -- فقط التي تم تحديثها

COMMIT;
*/ 