-- Update agreements_with_details view to include traffic fines data (simplified)
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
    payment_data.payment_details,
    
    -- Traffic fines information
    COALESCE(fines_data.total_fines_amount, 0) as total_fines_amount,
    COALESCE(fines_data.fines_count, 0) as fines_count,
    COALESCE(fines_data.paid_fines_count, 0) as paid_fines_count,
    COALESCE(fines_data.pending_fines_count, 0) as pending_fines_count,
    COALESCE(fines_data.paid_fines_amount, 0) as paid_fines_amount,
    COALESCE(fines_data.pending_fines_amount, 0) as pending_fines_amount,
    fines_data.fines_details

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
        SUM(up.late_fine_amount) as total_late_fees_paid,
        jsonb_agg(
            jsonb_build_object(
                'id', up.id,
                'amount', up.amount,
                'amount_paid', up.amount_paid,
                'payment_date', up.payment_date,
                'payment_method', up.payment_method,
                'description', up.description,
                'late_fine_amount', up.late_fine_amount
            ) ORDER BY up.payment_date DESC
        ) as payment_details
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
        SUM(tf.fine_amount) FILTER (WHERE tf.payment_status = 'pending') as pending_fines_amount,
        jsonb_agg(
            jsonb_build_object(
                'id', tf.id,
                'violation_number', tf.violation_number,
                'fine_amount', tf.fine_amount,
                'violation_date', tf.violation_date,
                'payment_status', tf.payment_status,
                'payment_date', tf.payment_date,
                'license_plate', tf.license_plate
            ) ORDER BY tf.violation_date DESC
        ) as fines_details
    FROM traffic_fines tf
    WHERE tf.lease_id IS NOT NULL
    GROUP BY tf.lease_id
) fines_data ON l.id = fines_data.lease_id;