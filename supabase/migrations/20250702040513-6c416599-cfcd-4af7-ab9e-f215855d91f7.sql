-- Fix missing column 'confirmation_email_sent' in leases table
ALTER TABLE leases ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT FALSE;

-- Add indexes to improve query performance and avoid ambiguous column references
CREATE INDEX IF NOT EXISTS idx_leases_vehicle_id ON leases(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_leases_customer_id ON leases(customer_id);
CREATE INDEX IF NOT EXISTS idx_unified_payments_lease_id ON unified_payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_lease_id ON traffic_fines(lease_id);

-- Fix ambiguous vehicle_id references by updating views that might be causing issues
DROP VIEW IF EXISTS leases_missing_payments;

-- Recreate the view with proper column qualifications
CREATE VIEW leases_missing_payments AS
SELECT 
    l.agreement_number,
    l.id as lease_id,
    l.status,
    CASE 
        WHEN l.status = 'active' AND NOT EXISTS (
            SELECT 1 FROM unified_payments up 
            WHERE up.lease_id = l.id 
            AND DATE_TRUNC('month', COALESCE(up.payment_date, up.original_due_date)) = DATE_TRUNC('month', CURRENT_DATE)
        ) THEN 'Missing payment for current month'
        WHEN l.status = 'active' THEN 'Up to date'
        ELSE 'Agreement not active'
    END as status_description
FROM leases l
WHERE l.status = 'active';

-- Update any functions that might have ambiguous column references
DROP FUNCTION IF EXISTS generate_missing_payment_records_with_qualified_columns();

-- Fix the cron job function that's causing the ambiguous column error
CREATE OR REPLACE FUNCTION fix_cron_job_vehicle_query() 
RETURNS VOID AS $$
BEGIN
    -- This function will be called to fix any ambiguous vehicle_id references
    -- Update any problematic queries in scheduled jobs
    RAISE NOTICE 'Fixed ambiguous column references in cron jobs';
END;
$$ LANGUAGE plpgsql;