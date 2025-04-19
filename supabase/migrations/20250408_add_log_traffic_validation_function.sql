
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

-- Add traffic_fine_validations table
CREATE TABLE IF NOT EXISTS traffic_fine_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fine_id UUID,
  validation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  error_message TEXT
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

-- Create column_exists function for utility
CREATE OR REPLACE FUNCTION column_exists(
  p_table_name TEXT,
  p_column_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) > 0 INTO column_exists
  FROM information_schema.columns
  WHERE table_name = p_table_name
  AND column_name = p_column_name;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql;

-- Add support for RPC functions
CREATE OR REPLACE FUNCTION get_dashboard_data()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Your implementation here
  SELECT jsonb_build_object(
    'activeVehicles', (SELECT COUNT(*) FROM vehicles WHERE status = 'available'),
    'totalCustomers', (SELECT COUNT(*) FROM profiles),
    'totalRevenue', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_vehicle_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalCount', (SELECT COUNT(*) FROM vehicles),
    'availableCount', (SELECT COUNT(*) FROM vehicles WHERE status = 'available'),
    'maintenanceCount', (SELECT COUNT(*) FROM vehicles WHERE status = 'maintenance')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_revenue_data()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Your implementation here
  SELECT jsonb_build_object(
    'monthly', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date > CURRENT_DATE - INTERVAL '30 days'),
    'weekly', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date > CURRENT_DATE - INTERVAL '7 days'),
    'daily', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date > CURRENT_DATE - INTERVAL '1 day')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_recent_activity()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Your implementation here
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'type', 'payment',
      'amount', amount,
      'date', payment_date,
      'description', description
    )
  )
  FROM payments
  ORDER BY payment_date DESC
  LIMIT 5
  INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add car_installments table for financial data
CREATE TABLE IF NOT EXISTS car_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  status payment_status_type DEFAULT 'pending',
  cheque_number TEXT NOT NULL,
  drawee_bank TEXT NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
