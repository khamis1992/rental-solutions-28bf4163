
-- Function to identify and fix duplicate payments for a specific agreement
CREATE OR REPLACE FUNCTION public.fix_duplicate_payments(p_lease_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duplicate_count INTEGER := 0;
  fixed_count INTEGER := 0;
  grouped_payments RECORD;
  payment_record RECORD;
  keep_id UUID;
  duplicate_ids UUID[];
  month_year TEXT;
  result JSONB;
BEGIN
  -- Find duplicate payments by grouping and finding multiple payments for the same month/year
  FOR grouped_payments IN (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', COALESCE(payment_date, original_due_date)), 'YYYY-MM') AS month_year,
      COUNT(*) as payment_count,
      ARRAY_AGG(id) AS payment_ids
    FROM unified_payments
    WHERE lease_id = p_lease_id
    AND type = 'Income'
    GROUP BY TO_CHAR(DATE_TRUNC('month', COALESCE(payment_date, original_due_date)), 'YYYY-MM')
    HAVING COUNT(*) > 1
  ) LOOP
    duplicate_count := duplicate_count + grouped_payments.payment_count - 1;
    
    -- Keep the first payment and mark the rest for deletion
    SELECT id INTO keep_id FROM unified_payments 
    WHERE id = ANY(grouped_payments.payment_ids)
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Calculate array of ids to delete
    SELECT ARRAY_AGG(id) INTO duplicate_ids 
    FROM unified_payments 
    WHERE id = ANY(grouped_payments.payment_ids) 
    AND id != keep_id;
    
    -- Delete the duplicates
    DELETE FROM unified_payments 
    WHERE id = ANY(duplicate_ids);
    
    fixed_count := fixed_count + array_length(duplicate_ids, 1);
  END LOOP;

  -- Refresh payment schedules to ensure proper sync
  FOR payment_record IN (
    SELECT ps.id, ps.due_date, ps.lease_id
    FROM payment_schedules ps
    WHERE ps.lease_id = p_lease_id
  ) LOOP
    -- Check if there's a corresponding payment
    IF EXISTS (
      SELECT 1 FROM unified_payments up
      WHERE up.lease_id = payment_record.lease_id
      AND TO_CHAR(DATE_TRUNC('month', COALESCE(up.payment_date, up.original_due_date)), 'YYYY-MM') = 
          TO_CHAR(DATE_TRUNC('month', payment_record.due_date), 'YYYY-MM')
      AND up.status IN ('paid', 'completed')
    ) THEN
      -- If payment exists, mark schedule as completed
      UPDATE payment_schedules
      SET status = 'completed'
      WHERE id = payment_record.id;
    END IF;
  END LOOP;

  -- Build the result
  result := jsonb_build_object(
    'lease_id', p_lease_id,
    'found_duplicates', duplicate_count > 0,
    'duplicate_count', duplicate_count,
    'fixed_count', fixed_count,
    'status', 'success'
  );

  RETURN result;
END;
$$;
