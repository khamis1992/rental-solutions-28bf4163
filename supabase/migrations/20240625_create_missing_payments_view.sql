
-- Create a view to show active leases that might be missing payment schedules
CREATE OR REPLACE VIEW leases_missing_payments AS 
WITH lease_timelines AS (
  SELECT 
    l.id,
    l.agreement_number,
    l.status,
    l.rent_amount,
    l.start_date,
    CURRENT_DATE as current_month,
    (
      SELECT COUNT(*) 
      FROM payment_schedules ps 
      WHERE ps.lease_id = l.id
    ) as schedule_count,
    (
      SELECT COUNT(DISTINCT DATE_TRUNC('month', ps.due_date))
      FROM payment_schedules ps
      WHERE ps.lease_id = l.id
    ) as distinct_months_scheduled,
    (
      SELECT COUNT(DISTINCT DATE_TRUNC('month', COALESCE(up.payment_date, up.original_due_date)))
      FROM unified_payments up
      WHERE up.lease_id = l.id
      AND up.payment_date IS NOT NULL
    ) as distinct_months_paid,
    -- Calculate total months that should have payments
    CASE 
      WHEN l.start_date IS NOT NULL THEN
        EXTRACT(YEAR FROM CURRENT_DATE) * 12 + EXTRACT(MONTH FROM CURRENT_DATE) - 
        (EXTRACT(YEAR FROM l.start_date) * 12 + EXTRACT(MONTH FROM l.start_date)) + 1
      ELSE 0
    END as total_months_due
  FROM leases l
  WHERE l.status = 'active'
)
SELECT 
  lt.id,
  lt.agreement_number,
  lt.status,
  lt.rent_amount,
  lt.start_date,
  lt.current_month,
  lt.schedule_count,
  lt.distinct_months_scheduled,
  lt.distinct_months_paid,
  lt.total_months_due,
  CASE
    WHEN lt.schedule_count = 0 THEN 'No payment schedules found'
    WHEN lt.distinct_months_scheduled < lt.total_months_due THEN 'Missing payment schedules for some months'
    WHEN lt.distinct_months_paid < lt.total_months_due THEN 'Has unpaid months'
    ELSE 'Payment schedules up to date'
  END as status_description,
  CASE
    WHEN lt.schedule_count = 0 THEN 0
    ELSE lt.distinct_months_scheduled
  END as payment_count
FROM lease_timelines lt
ORDER BY lt.status DESC, lt.schedule_count ASC;
