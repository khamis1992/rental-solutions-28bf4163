-- ============================================
-- التحقق من القيم الصحيحة لـ payment_status enum
-- Check correct values for payment_status enum
-- ============================================

-- 1. التحقق من قيم enum الموجودة في قاعدة البيانات
-- Check existing enum values in database
SELECT 
    n.nspname as schema_name,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname = 'payment_status'
ORDER BY e.enumsortorder;

-- 2. التحقق من الحالات الموجودة فعلياً في جدول payment_schedules
-- Check actual statuses in payment_schedules table
SELECT 
    'payment_schedules' as table_name,
    status,
    COUNT(*) as count
FROM payment_schedules 
GROUP BY status
ORDER BY count DESC;

-- 3. التحقق من الحالات الموجودة فعلياً في جدول unified_payments
-- Check actual statuses in unified_payments table  
SELECT 
    'unified_payments' as table_name,
    status,
    COUNT(*) as count
FROM unified_payments 
GROUP BY status
ORDER BY count DESC;

-- 4. التحقق من السجلات قبل 2024-01-09 بدون فلترة حالة معينة
-- Check records before 2024-01-09 without specific status filter
SELECT 
    'payment_schedules - Before 2024-01-09' as description,
    status,
    COUNT(*) as count
FROM payment_schedules 
WHERE due_date < '2024-01-09'::date
GROUP BY status
ORDER BY count DESC;

-- 5. التحقق من السجلات قبل 2024-01-09 في unified_payments
-- Check records before 2024-01-09 in unified_payments
SELECT 
    'unified_payments - Before 2024-01-09' as description,
    status,
    COUNT(*) as count
FROM unified_payments 
WHERE (
    original_due_date < '2024-01-09'::date 
    OR created_at < '2024-01-09'::date
    OR payment_date < '2024-01-09'::date
)
GROUP BY status
ORDER BY count DESC;

-- 6. معلومات الجداول وأعمدة الحالة
-- Table and status column information
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'status' 
AND table_name IN ('payment_schedules', 'unified_payments'); 