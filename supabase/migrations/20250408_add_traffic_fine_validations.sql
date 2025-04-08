
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
  error_message TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_traffic_fine_validations_license_plate ON public.traffic_fine_validations(license_plate);
CREATE INDEX IF NOT EXISTS idx_traffic_fine_validations_validation_date ON public.traffic_fine_validations(validation_date);

-- Create a function to log traffic fine validations
CREATE OR REPLACE FUNCTION public.log_traffic_fine_validation(
  p_license_plate TEXT,
  p_result JSONB,
  p_status TEXT DEFAULT 'completed',
  p_fine_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.traffic_fine_validations (license_plate, result, status, fine_id)
  VALUES (p_license_plate, p_result, p_status, p_fine_id)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

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
