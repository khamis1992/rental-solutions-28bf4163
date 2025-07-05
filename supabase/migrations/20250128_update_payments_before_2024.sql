-- ============================================
-- تحديث جميع المدفوعات قبل 9 يناير 2024 لتكون مدفوعة
-- Migration: Update all payments before January 9, 2024 to be paid
-- Date: 2025-01-28
-- ============================================

-- التحقق من البيانات قبل التحديث
-- Check data before update
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
    
    -- عدد payment_schedules المعلقة قبل التاريخ المحدد
    SELECT COUNT(*) INTO schedules_pending 
    FROM payment_schedules 
    WHERE due_date < '2024-01-09'::date 
    AND status IN ('pending', 'overdue');
    
    -- عدد unified_payments قبل التاريخ المحدد
    SELECT COUNT(*) INTO payments_count 
    FROM unified_payments 
    WHERE (
        original_due_date < '2024-01-09'::date 
        OR created_at < '2024-01-09'::date
        OR payment_date < '2024-01-09'::date
    );
    
    -- عدد unified_payments المعلقة قبل التاريخ المحدد
    SELECT COUNT(*) INTO payments_pending 
    FROM unified_payments 
    WHERE (
        original_due_date < '2024-01-09'::date 
        OR created_at < '2024-01-09'::date
        OR payment_date < '2024-01-09'::date
    ) AND status IN ('pending', 'overdue', 'partial');
    
    RAISE NOTICE '=== تقرير ما قبل التحديث / Pre-Update Report ===';
    RAISE NOTICE 'Payment Schedules - Total before 2024-01-09: %', schedules_count;
    RAISE NOTICE 'Payment Schedules - Pending/Overdue: %', schedules_pending;
    RAISE NOTICE 'Unified Payments - Total before 2024-01-09: %', payments_count;
    RAISE NOTICE 'Unified Payments - Pending/Overdue/Partial: %', payments_pending;
    RAISE NOTICE '===============================================';
END $$;

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

-- التحقق من النتائج بعد التحديث
-- Check results after update
DO $$
DECLARE
    schedules_updated INTEGER;
    payments_updated INTEGER;
    schedules_completed INTEGER;
    payments_completed INTEGER;
BEGIN
    -- عدد payment_schedules المكتملة بعد التحديث
    SELECT COUNT(*) INTO schedules_completed 
    FROM payment_schedules 
    WHERE due_date < '2024-01-09'::date AND status = 'completed';
    
    -- عدد unified_payments المكتملة بعد التحديث
    SELECT COUNT(*) INTO payments_completed 
    FROM unified_payments 
    WHERE (
        original_due_date < '2024-01-09'::date 
        OR created_at < '2024-01-09'::date
        OR payment_date < '2024-01-09'::date
    ) AND status = 'completed';
    
    RAISE NOTICE '=== تقرير ما بعد التحديث / Post-Update Report ===';
    RAISE NOTICE 'Payment Schedules - Now Completed: %', schedules_completed;
    RAISE NOTICE 'Unified Payments - Now Completed: %', payments_completed;
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Migration completed successfully! ✅';
    RAISE NOTICE 'جميع المدفوعات قبل 9 يناير 2024 أصبحت مدفوعة';
END $$;

-- إنشاء log للتحديث
-- Create update log
INSERT INTO public.system_logs (
    action,
    description,
    metadata,
    created_at
) VALUES (
    'payments_mass_update',
    'Updated all payments before 2024-01-09 to completed status',
    jsonb_build_object(
        'cutoff_date', '2024-01-09',
        'update_date', NOW(),
        'affected_tables', ARRAY['payment_schedules', 'unified_payments']
    ),
    NOW()
) ON CONFLICT DO NOTHING; 