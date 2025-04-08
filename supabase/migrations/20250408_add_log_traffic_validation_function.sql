
-- Function to log traffic fine validation attempts
CREATE OR REPLACE FUNCTION log_traffic_fine_validation(
  p_license_plate TEXT,
  p_has_fine BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Create a log entry for this validation attempt
  INSERT INTO traffic_validation_logs (
    license_plate,
    validation_date,
    has_fine
  ) VALUES (
    p_license_plate,
    NOW(),
    p_has_fine
  );
END;
$$ LANGUAGE plpgsql;

-- Function to increment validation attempts for tracking
CREATE OR REPLACE FUNCTION increment_validation_attempts(
  p_license_plate TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update the validation attempts counter or create a new record if it doesn't exist
  INSERT INTO traffic_fine_validation_stats (
    license_plate,
    validation_attempts,
    last_check_date
  ) VALUES (
    p_license_plate,
    1,
    NOW()
  )
  ON CONFLICT (license_plate)
  DO UPDATE SET
    validation_attempts = traffic_fine_validation_stats.validation_attempts + 1,
    last_check_date = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create the table for validation logs if it doesn't exist
CREATE TABLE IF NOT EXISTS traffic_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate TEXT NOT NULL,
  validation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  has_fine BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create the table for validation statistics
CREATE TABLE IF NOT EXISTS traffic_fine_validation_stats (
  license_plate TEXT PRIMARY KEY,
  validation_attempts INTEGER DEFAULT 1,
  last_check_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add traffic_fine_validations_view for easier querying
CREATE OR REPLACE VIEW traffic_fine_validations_view AS
SELECT 
  tfv.id,
  tfv.fine_id,
  tfv.validation_date,
  tfv.status,
  tfv.result,
  tfv.created_at,
  tfv.created_by
FROM 
  traffic_fine_validations tfv
ORDER BY 
  tfv.validation_date DESC;
