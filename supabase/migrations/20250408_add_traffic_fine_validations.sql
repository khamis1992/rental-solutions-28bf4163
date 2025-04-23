
-- Create the traffic fine validations table
CREATE TABLE IF NOT EXISTS public.traffic_fine_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_plate TEXT NOT NULL,
  validation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  result JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fine_id UUID,
  created_by UUID,
  error_message TEXT,
  batch_id UUID, -- NEW: For batch processing
  validation_source TEXT -- NEW: Track which validation method was used
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_traffic_fine_validations_license_plate ON public.traffic_fine_validations(license_plate);
CREATE INDEX IF NOT EXISTS idx_traffic_fine_validations_validation_date ON public.traffic_fine_validations(validation_date);
CREATE INDEX IF NOT EXISTS idx_traffic_fine_validations_batch_id ON public.traffic_fine_validations(batch_id); -- NEW index

-- Create a function to log traffic fine validations
CREATE OR REPLACE FUNCTION public.log_traffic_fine_validation(
  p_license_plate TEXT,
  p_result JSONB,
  p_status TEXT DEFAULT 'completed',
  p_fine_id UUID DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL -- NEW parameter
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.traffic_fine_validations (license_plate, result, status, fine_id, batch_id)
  VALUES (p_license_plate, p_result, p_status, p_fine_id, p_batch_id)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Create a function to update fine status based on validation results (NEW)
CREATE OR REPLACE FUNCTION public.update_fine_status_from_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_fine BOOLEAN;
BEGIN
  -- Extract hasFine value from the JSONB result
  SELECT (NEW.result->>'hasFine')::BOOLEAN INTO v_has_fine;
  
  -- If validation shows no fine and we have a fine_id, update the fine status to paid
  IF NOT v_has_fine AND NEW.fine_id IS NOT NULL THEN
    UPDATE public.traffic_fines
    SET payment_status = 'paid',
        payment_date = NOW()
    WHERE id = NEW.fine_id
    AND payment_status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger for automatic status updates (NEW)
CREATE TRIGGER trg_update_fine_status_on_validation
AFTER INSERT ON public.traffic_fine_validations
FOR EACH ROW
EXECUTE FUNCTION public.update_fine_status_from_validation();

-- Add RLS policies
ALTER TABLE public.traffic_fine_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select for traffic_fine_validations"
  ON public.traffic_fine_validations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert for traffic_fine_validations"
  ON public.traffic_fine_validations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update for traffic_fine_validations"
  ON public.traffic_fine_validations FOR UPDATE
  TO authenticated
  USING (true);
