-- ============================================
-- معاينة المدفوعات التي ستتأثر بالتحديث
-- Preview payments that will be affected by the update
-- (هذا Script للمعاينة فقط - لا يجري أي تحديث)
-- ============================================

-- 1. إحصائيات عامة
-- General statistics
SELECT 
    '=== إحصائيات عامة / General Statistics ===' as section,
    '' as table_name,
    0 as count,
    '' as description
    
UNION ALL

-- عدد جميع المدفوعات المجدولة قبل 2024-01-09
SELECT 
    'payment_schedules' as section,
    'Total Records' as table_name,
    COUNT(*) as count,
    'جميع السجلات قبل 9 يناير 2024' as description
FROM payment_schedules 
WHERE due_date < '2024-01-09'::date

UNION ALL

-- عدد المدفوعات المجدولة المعلقة قبل 2024-01-09
SELECT 
    'payment_schedules' as section,
    'Pending/Overdue' as table_name,
    COUNT(*) as count,
    'السجلات المعلقة/المتأخرة (ستُحدث)' as description
FROM payment_schedules 
WHERE due_date < '2024-01-09'::date 
AND status IN ('pending', 'overdue')

UNION ALL

-- عدد المدفوعات المجدولة المكتملة مسبقاً
SELECT 
    'payment_schedules' as section,
    'Already Completed' as table_name,
    COUNT(*) as count,
    'السجلات المكتملة مسبقاً (لن تتأثر)' as description
FROM payment_schedules 
WHERE due_date < '2024-01-09'::date 
AND status = 'completed'

UNION ALL

-- عدد جميع المدفوعات الموحدة قبل 2024-01-09
SELECT 
    'unified_payments' as section,
    'Total Records' as table_name,
    COUNT(*) as count,
    'جميع السجلات قبل 9 يناير 2024' as description
FROM unified_payments 
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
    OR payment_date < '2024-01-09'::date
)

UNION ALL

-- عدد المدفوعات الموحدة المعلقة قبل 2024-01-09
SELECT 
    'unified_payments' as section,
    'Pending/Overdue/Partial' as table_name,
    COUNT(*) as count,
    'السجلات المعلقة/المتأخرة/الجزئية (ستُحدث)' as description
FROM unified_payments 
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
    OR payment_date < '2024-01-09'::date
) AND status IN ('pending', 'overdue', 'partial')

UNION ALL

-- عدد المدفوعات الموحدة المكتملة مسبقاً
SELECT 
    'unified_payments' as section,
    'Already Completed' as table_name,
    COUNT(*) as count,
    'السجلات المكتملة مسبقاً (لن تتأثر)' as description
FROM unified_payments 
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
    OR payment_date < '2024-01-09'::date
) AND status = 'completed';

-- 2. عينة من السجلات التي ستتأثر
-- Sample of records that will be affected

-- عينة من payment_schedules التي ستُحدث
SELECT 
    '=== عينة من Payment Schedules التي ستُحدث ===' as info,
    ps.id,
    ps.lease_id,
    ps.due_date,
    ps.amount,
    ps.status as current_status,
    ps.actual_payment_date,
    'completed' as new_status,
    CASE 
        WHEN ps.actual_payment_date IS NULL THEN ps.due_date 
        ELSE ps.actual_payment_date 
    END as new_payment_date
FROM payment_schedules ps
WHERE ps.due_date < '2024-01-09'::date 
AND ps.status IN ('pending', 'overdue')
ORDER BY ps.due_date ASC
LIMIT 10;

-- عينة من unified_payments التي ستُحدث
SELECT 
    '=== عينة من Unified Payments التي ستُحدث ===' as info,
    up.id,
    up.lease_id,
    up.original_due_date,
    up.payment_date,
    up.amount,
    up.amount_paid,
    up.balance,
    up.status as current_status,
    'completed' as new_status,
    up.amount as new_amount_paid,
    0 as new_balance
FROM unified_payments up
WHERE (
    up.original_due_date < '2024-01-09'::date 
    OR up.created_at < '2024-01-09'::date
    OR up.payment_date < '2024-01-09'::date
) AND up.status IN ('pending', 'overdue', 'partial')
ORDER BY COALESCE(up.original_due_date, up.created_at::date) ASC
LIMIT 10;

-- 3. ملخص المبالغ المالية
-- Financial amounts summary
SELECT 
    '=== ملخص المبالغ المالية ===' as section,
    'payment_schedules' as table_name,
    ROUND(SUM(amount), 2) as total_amount,
    COUNT(*) as record_count,
    'مجموع مبالغ المدفوعات المجدولة التي ستُحدث' as description
FROM payment_schedules 
WHERE due_date < '2024-01-09'::date 
AND status IN ('pending', 'overdue')

UNION ALL

SELECT 
    'unified_payments' as section,
    'unified_payments' as table_name,
    ROUND(SUM(amount), 2) as total_amount,
    COUNT(*) as record_count,
    'مجموع مبالغ المدفوعات الموحدة التي ستُحدث' as description
FROM unified_payments 
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
    OR payment_date < '2024-01-09'::date
) AND status IN ('pending', 'overdue', 'partial');

-- 4. رسالة تأكيد
SELECT 
    '================================' as message
UNION ALL
SELECT 'هذا معاينة فقط - لم يتم تحديث أي بيانات'
UNION ALL  
SELECT 'This is preview only - no data was updated'
UNION ALL
SELECT 'لتنفيذ التحديث، استخدم ملف الهجرة:'
UNION ALL
SELECT 'supabase/migrations/20250128_update_payments_before_2024.sql'
UNION ALL
SELECT '================================';