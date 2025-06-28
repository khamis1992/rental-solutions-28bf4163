-- ============================================
-- تحديث المدفوعات قبل 9 يناير 2024 - النسخة الآمنة
-- Update payments before January 9, 2024 - Safe Version
-- ============================================

-- أولاً: التحقق من الحالات الموجودة فعلياً
-- First: Check existing statuses
DO $$
DECLARE
    schedules_count INTEGER;
    payments_count INTEGER;
    schedules_pending INTEGER;
    payments_pending INTEGER;
BEGIN
    -- عدد payment_schedules قبل التاريخ المحدد
    SELECT COUNT(*) INTO schedules_count 
    FROM payment_schedules 
    WHERE due_date < '2024-01-09'::date;
    
    -- عدد payment_schedules المعلقة (فقط pending)
    SELECT COUNT(*) INTO schedules_pending 
    FROM payment_schedules 
    WHERE due_date < '2024-01-09'::date 
    AND status = 'pending';
    
    -- عدد unified_payments قبل التاريخ المحدد
    SELECT COUNT(*) INTO payments_count 
    FROM unified_payments 
    WHERE (
        original_due_date < '2024-01-09'::date 
        OR created_at < '2024-01-09'::date
        OR payment_date < '2024-01-09'::date
    );
    
    -- عدد unified_payments المعلقة (فقط pending)
    SELECT COUNT(*) INTO payments_pending 
    FROM unified_payments 
    WHERE (
        original_due_date < '2024-01-09'::date 
        OR created_at < '2024-01-09'::date
        OR payment_date < '2024-01-09'::date
    ) AND status = 'pending';
    
    RAISE NOTICE '=== تقرير ما قبل التحديث / Pre-Update Report ===';
    RAISE NOTICE 'Payment Schedules - Total before 2024-01-09: %', schedules_count;
    RAISE NOTICE 'Payment Schedules - Pending: %', schedules_pending;
    RAISE NOTICE 'Unified Payments - Total before 2024-01-09: %', payments_count;
    RAISE NOTICE 'Unified Payments - Pending: %', payments_pending;
    RAISE NOTICE '===============================================';
END $$;

-- 1. تحديث جدول payment_schedules (فقط pending)
-- Update payment_schedules table (only pending)
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
    AND status = 'pending';

-- 2. تحديث جدول unified_payments (فقط pending)
-- Update unified_payments table (only pending)
UPDATE unified_payments 
SET 
    status = 'paid',  -- استخدام 'paid' بدلاً من 'completed'
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
    AND status = 'pending';

-- التحقق من النتائج بعد التحديث
-- Check results after update
DO $$
DECLARE
    schedules_completed INTEGER;
    payments_completed INTEGER;
BEGIN
    -- عدد payment_schedules المكتملة بعد التحديث
    SELECT COUNT(*) INTO schedules_completed 
    FROM payment_schedules 
    WHERE due_date < '2024-01-09'::date AND status = 'completed';
    
    -- عدد unified_payments المدفوعة بعد التحديث
    SELECT COUNT(*) INTO payments_completed 
    FROM unified_payments 
    WHERE (
        original_due_date < '2024-01-09'::date 
        OR created_at < '2024-01-09'::date
        OR payment_date < '2024-01-09'::date
    ) AND status = 'paid';
    
    RAISE NOTICE '=== تقرير ما بعد التحديث / Post-Update Report ===';
    RAISE NOTICE 'Payment Schedules - Now Completed: %', schedules_completed;
    RAISE NOTICE 'Unified Payments - Now Paid: %', payments_completed;
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Safe Migration completed successfully! ✅';
    RAISE NOTICE 'جميع المدفوعات المعلقة قبل 9 يناير 2024 أصبحت مدفوعة';
END $$;

-- 3. إذا كانت هناك حالات أخرى، تحديثها بشكل منفصل
-- If there are other statuses, update them separately

-- التحقق من الحالات الأخرى أولاً
-- Check other statuses first
SELECT 
    'payment_schedules - Other statuses' as table_name,
    status,
    COUNT(*) as count
FROM payment_schedules 
WHERE due_date < '2024-01-09'::date
AND status NOT IN ('pending', 'completed')
GROUP BY status;

SELECT 
    'unified_payments - Other statuses' as table_name,
    status,
    COUNT(*) as count
FROM unified_payments 
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
    OR payment_date < '2024-01-09'::date
)
AND status NOT IN ('pending', 'paid')
GROUP BY status; 