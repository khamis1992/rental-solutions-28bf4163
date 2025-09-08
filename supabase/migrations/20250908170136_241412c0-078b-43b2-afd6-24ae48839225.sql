-- Update the agreements_with_details view to show payment_details as readable Arabic text
DROP VIEW IF EXISTS public.agreements_with_details;

CREATE VIEW public.agreements_with_details AS
SELECT 
    l.id,
    l.agreement_number,
    l.status,
    l.start_date,
    l.end_date,
    l.rent_amount,
    l.total_amount,
    l.created_at,
    l.updated_at,
    
    -- Customer information
    p.full_name as customer_name,
    p.email as customer_email,
    p.phone_number as customer_phone,
    p.driver_license as customer_driver_license,
    
    -- Vehicle information
    v.make,
    v.model,
    v.year,
    v.license_plate,
    v.status as vehicle_status,
    
    -- Payment aggregations
    COALESCE(pay_summary.total_paid_amount, 0) as total_paid_amount,
    COALESCE(pay_summary.payment_count, 0) as payment_count,
    pay_summary.last_payment_date,
    pay_summary.first_payment_date,
    COALESCE(pay_summary.total_late_fees_paid, 0) as total_late_fees_paid,
    
    -- Readable payment details in Arabic
    CASE 
        WHEN pay_summary.payment_count > 0 THEN
            'إجمالي المدفوع: ' || COALESCE(pay_summary.total_paid_amount, 0) || ' ريال' ||
            CASE WHEN pay_summary.payment_count > 0 THEN ' - عدد الدفعات: ' || pay_summary.payment_count ELSE '' END ||
            CASE WHEN pay_summary.last_payment_date IS NOT NULL THEN ' - آخر دفعة: ' || TO_CHAR(pay_summary.last_payment_date, 'DD/MM/YYYY') ELSE '' END ||
            CASE WHEN pay_summary.total_late_fees_paid > 0 THEN ' - غرامات متأخرة: ' || pay_summary.total_late_fees_paid || ' ريال' ELSE '' END
        ELSE 'لا توجد مدفوعات'
    END as payment_details,
    
    -- Traffic fines aggregations
    COALESCE(fines_summary.fines_count, 0) as fines_count,
    COALESCE(fines_summary.paid_fines_count, 0) as paid_fines_count,
    COALESCE(fines_summary.pending_fines_count, 0) as pending_fines_count,
    COALESCE(fines_summary.total_fines_amount, 0) as total_fines_amount,
    COALESCE(fines_summary.paid_fines_amount, 0) as paid_fines_amount,
    COALESCE(fines_summary.pending_fines_amount, 0) as pending_fines_amount,
    
    -- Readable fines details in Arabic
    CASE 
        WHEN fines_summary.fines_count > 0 THEN
            'إجمالي المخالفات: ' || COALESCE(fines_summary.fines_count, 0) ||
            CASE WHEN fines_summary.total_fines_amount > 0 THEN ' - المبلغ الإجمالي: ' || fines_summary.total_fines_amount || ' ريال' ELSE '' END ||
            CASE WHEN fines_summary.paid_fines_count > 0 THEN ' - مدفوع: ' || fines_summary.paid_fines_count || ' (' || COALESCE(fines_summary.paid_fines_amount, 0) || ' ريال)' ELSE '' END ||
            CASE WHEN fines_summary.pending_fines_count > 0 THEN ' - معلق: ' || fines_summary.pending_fines_count || ' (' || COALESCE(fines_summary.pending_fines_amount, 0) || ' ريال)' ELSE '' END
        ELSE 'لا توجد مخالفات'
    END as fines_details

FROM leases l
LEFT JOIN profiles p ON l.customer_id = p.id
LEFT JOIN vehicles v ON l.vehicle_id = v.id

-- Payment summary subquery
LEFT JOIN (
    SELECT 
        up.lease_id,
        SUM(up.amount_paid) as total_paid_amount,
        COUNT(up.id) as payment_count,
        MAX(up.payment_date) as last_payment_date,
        MIN(up.payment_date) as first_payment_date,
        SUM(CASE WHEN up.type = 'LATE_PAYMENT_FEE' THEN up.amount_paid ELSE 0 END) as total_late_fees_paid
    FROM unified_payments up
    WHERE up.status = 'completed' OR up.amount_paid > 0
    GROUP BY up.lease_id
) pay_summary ON l.id = pay_summary.lease_id

-- Traffic fines summary subquery
LEFT JOIN (
    SELECT 
        tf.lease_id,
        COUNT(tf.id) as fines_count,
        COUNT(CASE WHEN tf.payment_status = 'completed' THEN 1 END) as paid_fines_count,
        COUNT(CASE WHEN tf.payment_status = 'pending' THEN 1 END) as pending_fines_count,
        SUM(tf.fine_amount) as total_fines_amount,
        SUM(CASE WHEN tf.payment_status = 'completed' THEN tf.fine_amount ELSE 0 END) as paid_fines_amount,
        SUM(CASE WHEN tf.payment_status = 'pending' THEN tf.fine_amount ELSE 0 END) as pending_fines_amount
    FROM traffic_fines tf
    GROUP BY tf.lease_id
) fines_summary ON l.id = fines_summary.lease_id;