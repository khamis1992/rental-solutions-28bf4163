
-- Add overwrite_existing column to agreement_imports table
ALTER TABLE IF EXISTS public.agreement_imports 
ADD COLUMN IF NOT EXISTS overwrite_existing boolean DEFAULT false;

-- Create a new status value for imports that are about to be replaced
ALTER TYPE import_progress_status ADD VALUE IF NOT EXISTS 'pending_replacement';

-- Create function to update import date formats for imported agreements
CREATE OR REPLACE FUNCTION public.fix_agreement_import_dates(p_import_id UUID)
RETURNS TABLE(fixed_count BIGINT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  -- Find all dates that are in MM/DD/YYYY format and convert to proper YYYY-MM-DD
  UPDATE leases l
  SET 
    start_date = TO_DATE(
      CASE 
        WHEN EXTRACT(MONTH FROM l.start_date) > 12 
        THEN -- It's already in DD/MM/YYYY format internally, just normalize
          EXTRACT(YEAR FROM l.start_date) || '-' || 
          LPAD(EXTRACT(MONTH FROM l.start_date)::TEXT, 2, '0') || '-' || 
          LPAD(EXTRACT(DAY FROM l.start_date)::TEXT, 2, '0')
        ELSE -- Swap month and day (MM/DD/YYYY to DD/MM/YYYY)
          EXTRACT(YEAR FROM l.start_date) || '-' || 
          LPAD(EXTRACT(DAY FROM l.start_date)::TEXT, 2, '0') || '-' || 
          LPAD(EXTRACT(MONTH FROM l.start_date)::TEXT, 2, '0')
      END, 
      'YYYY-MM-DD'
    ),
    end_date = TO_DATE(
      CASE 
        WHEN EXTRACT(MONTH FROM l.end_date) > 12 
        THEN -- It's already in DD/MM/YYYY format internally, just normalize
          EXTRACT(YEAR FROM l.end_date) || '-' || 
          LPAD(EXTRACT(MONTH FROM l.end_date)::TEXT, 2, '0') || '-' || 
          LPAD(EXTRACT(DAY FROM l.end_date)::TEXT, 2, '0')
        ELSE -- Swap month and day (MM/DD/YYYY to DD/MM/YYYY)
          EXTRACT(YEAR FROM l.end_date) || '-' || 
          LPAD(EXTRACT(DAY FROM l.end_date)::TEXT, 2, '0') || '-' || 
          LPAD(EXTRACT(MONTH FROM l.end_date)::TEXT, 2, '0')
      END, 
      'YYYY-MM-DD'
    )
  WHERE 
    -- Only update agreements from the specified import
    l.id IN (
      SELECT lease_id 
      FROM imported_agreements 
      WHERE import_id = p_import_id
    )
    -- Only fix dates where there might be a problem (month value > 12)
    AND (
      EXTRACT(DAY FROM l.start_date) > 12 OR
      EXTRACT(DAY FROM l.end_date) > 12
    );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  fixed_count := v_count;
  
  RETURN QUERY SELECT fixed_count;
END;
$$;

-- Create function to handle agreement overwrites
CREATE OR REPLACE FUNCTION public.process_agreement_overwrite(
  p_customer_id UUID,
  p_vehicle_id UUID, 
  p_agreement_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_id UUID;
  v_agreement_id UUID;
BEGIN
  -- Look for an existing active agreement with the same customer and vehicle
  SELECT id INTO v_existing_id
  FROM leases
  WHERE 
    customer_id = p_customer_id AND
    vehicle_id = p_vehicle_id AND
    status != 'cancelled' AND
    status != 'closed';
    
  IF v_existing_id IS NOT NULL THEN
    -- Update the existing agreement
    UPDATE leases
    SET 
      start_date = (p_agreement_data->>'start_date')::TIMESTAMP,
      end_date = (p_agreement_data->>'end_date')::TIMESTAMP,
      rent_amount = (p_agreement_data->>'rent_amount')::NUMERIC,
      deposit_amount = NULLIF(p_agreement_data->>'deposit_amount', '')::NUMERIC,
      agreement_type = (CASE 
                         WHEN p_agreement_data->>'agreement_type' = 'long_term' THEN 'long_term'::agreement_type
                         WHEN p_agreement_data->>'agreement_type' = 'short_term' THEN 'short_term'::agreement_type
                         ELSE 'short_term'::agreement_type
                       END),
      notes = p_agreement_data->>'notes',
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_agreement_id;
  ELSE
    -- Insert a new agreement
    INSERT INTO leases (
      customer_id,
      vehicle_id,
      start_date,
      end_date,
      rent_amount,
      deposit_amount,
      agreement_type,
      notes,
      status,
      total_amount
    ) VALUES (
      p_customer_id,
      p_vehicle_id,
      (p_agreement_data->>'start_date')::TIMESTAMP,
      (p_agreement_data->>'end_date')::TIMESTAMP,
      (p_agreement_data->>'rent_amount')::NUMERIC,
      NULLIF(p_agreement_data->>'deposit_amount', '')::NUMERIC,
      (CASE 
        WHEN p_agreement_data->>'agreement_type' = 'long_term' THEN 'long_term'::agreement_type
        WHEN p_agreement_data->>'agreement_type' = 'short_term' THEN 'short_term'::agreement_type
        ELSE 'short_term'::agreement_type
      END),
      p_agreement_data->>'notes',
      'active'::lease_status,
      (p_agreement_data->>'rent_amount')::NUMERIC
    )
    RETURNING id INTO v_agreement_id;
  END IF;
  
  RETURN v_agreement_id;
END;
$$;
