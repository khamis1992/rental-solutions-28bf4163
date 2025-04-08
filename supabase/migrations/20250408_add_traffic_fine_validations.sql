
-- Create the traffic fine validations table
CREATE TABLE IF NOT EXISTS public.traffic_fine_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_plate TEXT NOT NULL,
  validation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  validation_source TEXT NOT NULL,
  has_fine BOOLEAN NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_traffic_fine_validations_license_plate ON public.traffic_fine_validations(license_plate);
CREATE INDEX IF NOT EXISTS idx_traffic_fine_validations_validation_date ON public.traffic_fine_validations(validation_date);

-- Create a function to log traffic fine validations
CREATE OR REPLACE FUNCTION public.log_traffic_fine_validation(
  p_license_plate TEXT,
  p_has_fine BOOLEAN,
  p_validation_source TEXT,
  p_details TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.traffic_fine_validations (license_plate, has_fine, validation_source, details)
  VALUES (p_license_plate, p_has_fine, p_validation_source, p_details)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Create table to track validation attempts by license plate
CREATE TABLE IF NOT EXISTS public.traffic_fine_validation_attempts (
  license_plate TEXT PRIMARY KEY,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to increment validation attempts
CREATE OR REPLACE FUNCTION public.increment_validation_attempts(
  p_license_plate TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.traffic_fine_validation_attempts (license_plate, attempt_count, last_attempt_date, updated_at)
  VALUES (p_license_plate, 1, now(), now())
  ON CONFLICT (license_plate)
  DO UPDATE SET
    attempt_count = traffic_fine_validation_attempts.attempt_count + 1,
    last_attempt_date = now(),
    updated_at = now()
  RETURNING attempt_count INTO v_count;
  
  RETURN v_count;
END;
$$;

-- Add RLS policies
ALTER TABLE public.traffic_fine_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_fine_validation_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select for traffic_fine_validations"
  ON public.traffic_fine_validations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert for traffic_fine_validations"
  ON public.traffic_fine_validations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated select for traffic_fine_validation_attempts"
  ON public.traffic_fine_validation_attempts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert for traffic_fine_validation_attempts"
  ON public.traffic_fine_validation_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

