-- Calculate remaining amount for a lease
CREATE OR REPLACE FUNCTION public.calculate_remaining_amount(lease_id UUID)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  total_amount numeric;
  total_paid numeric;
BEGIN
  -- Get total amount from the lease
  SELECT COALESCE(total_amount, 0)
  INTO total_amount
  FROM leases
  WHERE id = lease_id;

  -- Sum of all payments recorded for the lease
  SELECT COALESCE(SUM(COALESCE(amount_paid, amount)), 0)
  INTO total_paid
  FROM unified_payments up
  WHERE up.lease_id = lease_id
    AND status IS DISTINCT FROM 'voided';

  RETURN COALESCE(total_amount, 0) - COALESCE(total_paid, 0);
END;
$$;
