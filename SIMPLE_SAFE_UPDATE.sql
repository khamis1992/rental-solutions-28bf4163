-- ============================================
-- تحديث بسيط وآمن للمدفوعات قبل 2024-01-09
-- Simple and safe payment update before 2024-01-09
-- ============================================

-- 1. معاينة سريعة للحالات الموجودة
SELECT 'payment_schedules statuses:' as info;
SELECT DISTINCT status, COUNT(*) 
FROM payment_schedules 
GROUP BY status;

SELECT 'unified_payments statuses:' as info;
SELECT DISTINCT status, COUNT(*) 
FROM unified_payments 
GROUP BY status;

-- 2. تحديث آمن - فقط المدفوعات المعلقة (pending)
-- Payment schedules: pending → completed
UPDATE payment_schedules 
SET 
    status = 'completed',
    actual_payment_date = due_date,
    updated_at = NOW()
WHERE 
    due_date < '2024-01-09'::date 
    AND status = 'pending';

-- Unified payments: pending → paid  
UPDATE unified_payments 
SET 
    status = 'paid',
    payment_date = COALESCE(original_due_date, created_at::date),
    amount_paid = amount,
    balance = 0,
    updated_at = NOW()
WHERE 
    created_at < '2024-01-09'::date
    AND status = 'pending';

-- 3. تقرير النتائج
SELECT 
    'Results after update:' as info,
    'payment_schedules' as table_name,
    COUNT(*) as total_before_date,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as still_pending
FROM payment_schedules 
WHERE due_date < '2024-01-09'::date

UNION ALL

SELECT 
    'Results after update:' as info,
    'unified_payments' as table_name,
    COUNT(*) as total_before_date,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as still_pending
FROM unified_payments 
WHERE created_at < '2024-01-09'::date;

SELECT 'تم التحديث بنجاح! ✅' as result; 