-- ============================================
-- فحص بسيط لحالات المدفوعات
-- Simple check for payment statuses
-- ============================================

-- 1. جميع الحالات الموجودة في payment_schedules
SELECT 
    'payment_schedules' as table_name,
    status,
    COUNT(*) as total_count
FROM payment_schedules 
GROUP BY status
ORDER BY total_count DESC;

-- 2. جميع الحالات الموجودة في unified_payments  
SELECT 
    'unified_payments' as table_name,
    status,
    COUNT(*) as total_count
FROM unified_payments 
GROUP BY status
ORDER BY total_count DESC;

-- 3. حالات payment_schedules قبل 2024-01-09
SELECT 
    'payment_schedules before 2024-01-09' as table_name,
    status,
    COUNT(*) as count_before_date
FROM payment_schedules 
WHERE due_date < '2024-01-09'::date
GROUP BY status
ORDER BY count_before_date DESC;

-- 4. حالات unified_payments قبل 2024-01-09
SELECT 
    'unified_payments before 2024-01-09' as table_name,
    status,
    COUNT(*) as count_before_date
FROM unified_payments 
WHERE created_at < '2024-01-09'::date
GROUP BY status
ORDER BY count_before_date DESC; 