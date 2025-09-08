-- Update agreements_with_details view to show readable payment details in Arabic
CREATE OR REPLACE VIEW agreements_with_details AS
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
    EXTRACT(YEAR FROM l.start_date) as year,
    
    -- Customer information
    p.full_name as customer_name,
    p.email as customer_email,
    p.phone_number as customer_phone,
    p.driver_license as customer_driver_license,
    
    -- Vehicle information
    v.make,
    v.model,
    v.license_plate,
    v.status as vehicle_status,
    
    -- Payment information (only completed payments)
    COALESCE(payment_data.total_paid_amount, 0) as total_paid_amount,
    COALESCE(payment_data.payment_count, 0) as payment_count,
    payment_data.last_payment_date,
    payment_data.first_payment_date,
    COALESCE(payment_data.total_late_fees_paid, 0) as total_late_fees_paid,
    
    -- Readable payment details in Arabic
    CASE 
        WHEN payment_data.payment_count > 0 THEN 
            'تم سداد ' || COALESCE(payment_data.payment_count, 0) || ' دفعة بإجمالي ' || 
            COALESCE(payment_data.total_paid_amount, 0) || ' ر.ق' ||
            CASE 
                WHEN payment_data.last_payment_date IS NOT NULL THEN 
                    ' - آخر دفعة في ' || TO_CHAR(payment_data.last_payment_date, 'DD/MM/YYYY')
                ELSE ''
            END ||
            CASE 
                WHEN COALESCE(payment_data.total_late_fees_paid, 0) > 0 THEN 
                    ' - غرامات تأخير: ' || payment_data.total_late_fees_paid || ' ر.ق'
                ELSE ''
            END
        ELSE 'لا توجد دفعات مسجلة'
    END as payment_details,
    
    -- Traffic fines information
    COALESCE(fines_data.total_fines_amount, 0) as total_fines_amount,
    COALESCE(fines_data.fines_count, 0) as fines_count,
    COALESCE(fines_data.paid_fines_count, 0) as paid_fines_count,
    COALESCE(fines_data.pending_fines_count, 0) as pending_fines_count,
    COALESCE(fines_data.paid_fines_amount, 0) as paid_fines_amount,
    COALESCE(fines_data.pending_fines_amount, 0) as pending_fines_amount,
    
    -- Readable fines details in Arabic
    CASE 
        WHEN fines_data.fines_count > 0 THEN 
            'إجمالي ' || fines_data.fines_count || ' مخالفة بقيمة ' || fines_data.total_fines_amount || ' ر.ق' ||
            CASE 
                WHEN fines_data.paid_fines_count > 0 THEN 
                    ' - مسدد: ' || fines_data.paid_fines_count || ' (' || COALESCE(fines_data.paid_fines_amount, 0) || ' ر.ق)'
                ELSE ''
            END ||
            CASE 
                WHEN fines_data.pending_fines_count > 0 THEN 
                    ' - معلق: ' || fines_data.pending_fines_count || ' (' || COALESCE(fines_data.pending_fines_amount, 0) || ' ر.ق)'
                ELSE ''
            END
        ELSE 'لا توجد مخالفات'
    END as fines_details

FROM leases l
LEFT JOIN profiles p ON l.customer_id = p.id
LEFT JOIN vehicles v ON l.vehicle_id = v.id
LEFT JOIN (
    -- Payment summary (only completed payments)
    SELECT 
        up.lease_id,
        SUM(up.amount_paid) as total_paid_amount,
        COUNT(*) as payment_count,
        MAX(up.payment_date) as last_payment_date,
        MIN(up.payment_date) as first_payment_date,
        SUM(up.late_fine_amount) as total_late_fees_paid
    FROM unified_payments up
    WHERE up.status IN ('completed', 'paid')
    AND up.amount_paid > 0
    GROUP BY up.lease_id
) payment_data ON l.id = payment_data.lease_id
LEFT JOIN (
    -- Traffic fines summary
    SELECT 
        tf.lease_id,
        COUNT(*) as fines_count,
        SUM(tf.fine_amount) as total_fines_amount,
        COUNT(*) FILTER (WHERE tf.payment_status IN ('completed', 'paid')) as paid_fines_count,
        COUNT(*) FILTER (WHERE tf.payment_status = 'pending') as pending_fines_count,
        SUM(tf.fine_amount) FILTER (WHERE tf.payment_status IN ('completed', 'paid')) as paid_fines_amount,
        SUM(tf.fine_amount) FILTER (WHERE tf.payment_status = 'pending') as pending_fines_amount
    FROM traffic_fines tf
    WHERE tf.lease_id IS NOT NULL
    GROUP BY tf.lease_id
) fines_data ON l.id = fines_data.lease_id;