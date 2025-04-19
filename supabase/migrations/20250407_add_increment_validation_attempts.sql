
-- Function to safely increment the validation_attempts counter
CREATE OR REPLACE FUNCTION increment_validation_attempts(fine_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Get current count
    SELECT COALESCE(validation_attempts, 0) INTO current_count
    FROM traffic_fines
    WHERE id = fine_id;
    
    -- Return incremented count
    RETURN current_count + 1;
END;
$$;
