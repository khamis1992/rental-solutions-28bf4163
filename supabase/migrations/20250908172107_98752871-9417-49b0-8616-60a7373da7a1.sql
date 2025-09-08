-- Update agreements_with_details view to show detailed payment breakdowns - Fixed
DROP VIEW IF EXISTS agreements_with_details;

CREATE VIEW agreements_with_details AS
SELECT 
    l.id,
    l.agreement_number,
    l.status,
    l.start_date,
    l.end_date,
    l.total_amount,
    l.rent_amount,
    l.created_at,
    l.updated_at,
    -- Customer information
    p.name as customer_name,
    p.email as customer_email,
    p.phone as customer_phone,
    p.driver_license as customer_driver_license,
    -- Vehicle information
    v.make,
    v.model,
    v.year,
    v.license_plate,
    v.status as vehicle_status,
    -- Payment statistics
    COALESCE(payment_stats.total_paid_amount, 0) as total_paid_amount,
    COALESCE(payment_stats.payment_count, 0) as payment_count,
    payment_stats.first_payment_date,
    payment_stats.last_payment_date,
    COALESCE(payment_stats.total_late_fees_paid, 0) as total_late_fees_paid,
    -- Detailed payment information in Arabic
    CASE 
        WHEN COALESCE(payment_stats.payment_count, 0) = 0 THEN 'لا توجد دفعات مسجلة'
        ELSE 
            CASE 
                WHEN payment_details_list.payment_list IS NOT NULL AND LENGTH(payment_details_list.payment_list) > 0 THEN
                    'الدفعات المسجلة:' || CHR(10) || payment_details_list.payment_list ||
                    CASE 
                        WHEN COALESCE(payment_stats.total_late_fees_paid, 0) > 0 THEN
                            CHR(10) || CHR(10) || 'إجمالي غرامات التأخير المدفوعة: ' || COALESCE(payment_stats.total_late_fees_paid, 0) || ' ريال'
                        ELSE ''
                    END
                ELSE 'إجمالي المدفوع: ' || COALESCE(payment_stats.total_paid_amount, 0) || ' ريال - عدد الدفعات: ' || COALESCE(payment_stats.payment_count, 0) || 
                     CASE WHEN payment_stats.last_payment_date IS NOT NULL 
                          THEN ' - آخر دفعة: ' || TO_CHAR(payment_stats.last_payment_date, 'DD/MM/YYYY')
                          ELSE '' END
            END
    END as payment_details,
    -- Traffic fines statistics
    COALESCE(fines_stats.fines_count, 0) as fines_count,
    COALESCE(fines_stats.total_fines_amount, 0) as total_fines_amount,
    COALESCE(fines_stats.paid_fines_count, 0) as paid_fines_count,
    COALESCE(fines_stats.paid_fines_amount, 0) as paid_fines_amount,
    COALESCE(fines_stats.pending_fines_count, 0) as pending_fines_count,
    COALESCE(fines_stats.pending_fines_amount, 0) as pending_fines_amount,
    -- Detailed fines information in Arabic
    CASE 
        WHEN COALESCE(fines_stats.fines_count, 0) = 0 THEN 'لا توجد مخالفات مرورية'
        ELSE 
            CASE 
                WHEN fines_details_list.fines_list IS NOT NULL AND LENGTH(fines_details_list.fines_list) > 0 THEN
                    'المخالفات المرورية:' || CHR(10) || fines_details_list.fines_list
                ELSE 'إجمالي المخالفات: ' || COALESCE(fines_stats.fines_count, 0) || 
                     ' - إجمالي المبلغ: ' || COALESCE(fines_stats.total_fines_amount, 0) || ' ريال' ||
                     ' - مدفوعة: ' || COALESCE(fines_stats.paid_fines_count, 0) || ' (' || COALESCE(fines_stats.paid_fines_amount, 0) || ' ريال)' ||
                     ' - معلقة: ' || COALESCE(fines_stats.pending_fines_count, 0) || ' (' || COALESCE(fines_stats.pending_fines_amount, 0) || ' ريال)'
            END
    END as fines_details
FROM leases l
LEFT JOIN profiles p ON l.customer_id = p.id
LEFT JOIN vehicles v ON l.vehicle_id = v.id
-- Payment statistics subquery
LEFT JOIN (
    SELECT 
        up.lease_id,
        COUNT(*)::bigint as payment_count,
        SUM(up.amount_paid) as total_paid_amount,
        SUM(COALESCE(up.late_fine_amount, 0)) as total_late_fees_paid,
        MIN(up.payment_date) as first_payment_date,
        MAX(up.payment_date) as last_payment_date
    FROM unified_payments up 
    WHERE up.status IN ('completed', 'partially_paid')
    GROUP BY up.lease_id
) payment_stats ON l.id = payment_stats.lease_id
-- Detailed payment list subquery
LEFT JOIN (
    SELECT 
        up.lease_id,
        STRING_AGG(
            '• ' || TO_CHAR(up.payment_date, 'DD/MM/YYYY') || ': ' || 
            COALESCE(up.amount_paid, up.amount) || ' ريال' ||
            CASE 
                WHEN up.description IS NOT NULL AND LENGTH(TRIM(up.description)) > 0 
                THEN ' (' || up.description || ')'
                ELSE ''
            END ||
            CASE 
                WHEN COALESCE(up.late_fine_amount, 0) > 0 
                THEN ' + غرامة تأخير: ' || up.late_fine_amount || ' ريال'
                ELSE ''
            END,
            CHR(10) 
            ORDER BY up.payment_date DESC
        ) as payment_list
    FROM unified_payments up 
    WHERE up.status IN ('completed', 'partially_paid')
    GROUP BY up.lease_id
) payment_details_list ON l.id = payment_details_list.lease_id
-- Traffic fines statistics subquery  
LEFT JOIN (
    SELECT 
        tf.lease_id,
        COUNT(*)::bigint as fines_count,
        SUM(tf.fine_amount) as total_fines_amount,
        COUNT(CASE WHEN tf.payment_status = 'paid' THEN 1 END)::bigint as paid_fines_count,
        SUM(CASE WHEN tf.payment_status = 'paid' THEN tf.fine_amount ELSE 0 END) as paid_fines_amount,
        COUNT(CASE WHEN tf.payment_status != 'paid' THEN 1 END)::bigint as pending_fines_count,
        SUM(CASE WHEN tf.payment_status != 'paid' THEN tf.fine_amount ELSE 0 END) as pending_fines_amount
    FROM traffic_fines tf 
    GROUP BY tf.lease_id
) fines_stats ON l.id = fines_stats.lease_id
-- Detailed fines list subquery
LEFT JOIN (
    SELECT 
        tf.lease_id,
        STRING_AGG(
            '• ' || 
            CASE 
                WHEN tf.violation_date IS NOT NULL 
                THEN TO_CHAR(tf.violation_date, 'MM/YYYY') 
                ELSE 'تاريخ غير محدد'
            END || 
            ': ' || tf.fine_amount || ' ريال' ||
            CASE 
                WHEN tf.description IS NOT NULL AND LENGTH(TRIM(tf.description)) > 0 
                THEN ' (' || tf.description || ')'
                ELSE ''
            END ||
            ' - ' ||
            CASE tf.payment_status
                WHEN 'paid' THEN 'مدفوعة'
                WHEN 'pending' THEN 'معلقة'
                ELSE 'غير محددة'
            END,
            CHR(10) 
            ORDER BY tf.violation_date DESC NULLS LAST
        ) as fines_list
    FROM traffic_fines tf 
    GROUP BY tf.lease_id
) fines_details_list ON l.id = fines_details_list.lease_id;