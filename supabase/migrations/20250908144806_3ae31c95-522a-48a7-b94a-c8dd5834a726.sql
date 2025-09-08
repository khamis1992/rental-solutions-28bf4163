-- Update agreements_with_details view to include payment information
-- Drop existing view first
DROP VIEW IF EXISTS agreements_with_details;

-- Create updated view with payment information
CREATE VIEW agreements_with_details AS
SELECT 
    l.id,
    l.agreement_number,
    l.status,
    l.start_date,
    l.end_date,
    l.rent_amount,
    l.rent_amount as total_amount,
    l.created_at,
    l.updated_at,
    
    -- Customer information
    p.full_name as customer_name,
    p.email as customer_email,
    p.phone_number as customer_phone,
    p.driver_license as customer_driver_license,
    
    -- Vehicle information
    v.license_plate,
    v.make,
    v.model,
    v.year,
    v.status as vehicle_status,
    
    -- Payment aggregations (only completed/paid payments)
    COALESCE(pay_summary.total_paid_amount, 0) as total_paid_amount,
    COALESCE(pay_summary.payment_count, 0) as payment_count,
    pay_summary.last_payment_date,
    pay_summary.first_payment_date,
    COALESCE(pay_summary.total_late_fees, 0) as total_late_fees_paid,
    
    -- Payment details as JSON array
    COALESCE(pay_details.payment_details, '[]'::jsonb) as payment_details

FROM leases l
LEFT JOIN profiles p ON l.customer_id = p.id
LEFT JOIN vehicles v ON l.vehicle_id = v.id

-- Aggregate payment summary
LEFT JOIN (
    SELECT 
        up.lease_id,
        SUM(up.amount_paid) as total_paid_amount,
        COUNT(*) as payment_count,
        MAX(up.payment_date) as last_payment_date,
        MIN(up.payment_date) as first_payment_date,
        SUM(COALESCE(up.late_fine_amount, 0)) as total_late_fees
    FROM unified_payments up
    WHERE up.status IN ('completed', 'paid') 
    AND up.amount_paid > 0
    AND up.payment_date IS NOT NULL
    GROUP BY up.lease_id
) pay_summary ON l.id = pay_summary.lease_id

-- Payment details as JSON array
LEFT JOIN (
    SELECT 
        up.lease_id,
        jsonb_agg(
            jsonb_build_object(
                'id', up.id,
                'amount', up.amount,
                'amount_paid', up.amount_paid,
                'payment_date', up.payment_date,
                'payment_method', up.payment_method,
                'description', up.description,
                'type', up.type,
                'late_fine_amount', up.late_fine_amount,
                'reference_number', up.reference_number
            ) ORDER BY up.payment_date DESC
        ) as payment_details
    FROM unified_payments up
    WHERE up.status IN ('completed', 'paid')
    AND up.amount_paid > 0
    AND up.payment_date IS NOT NULL
    GROUP BY up.lease_id
) pay_details ON l.id = pay_details.lease_id;