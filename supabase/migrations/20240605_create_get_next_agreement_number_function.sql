
-- Migration: Create get_next_agreement_number function for atomic agreement number generation

CREATE OR REPLACE FUNCTION get_next_agreement_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_number text;
  max_attempts integer := 10;
  attempt_count integer := 0;
BEGIN
  LOOP
    -- Lock the leases table to prevent concurrent modifications
    LOCK TABLE leases IN EXCLUSIVE MODE;
    
    -- Find the highest existing number and increment by 1
    SELECT COALESCE(
      (
        SELECT MAX(
          CASE 
            WHEN agreement_number ~ '^LT0RO[0-9]+$' 
            THEN CAST(SUBSTRING(agreement_number FROM 6) AS INTEGER)
            ELSE 0
          END
        )
        FROM leases 
        WHERE agreement_number LIKE 'LT0RO%'
      ), 0
    ) + 1 INTO next_num;
    
    -- Generate the new agreement number
    new_number := 'LT0RO' || LPAD(next_num::text, 2, '0');
    
    -- Check if this number already exists (safety check)
    IF NOT EXISTS (SELECT 1 FROM leases WHERE agreement_number = new_number) THEN
      RETURN new_number;
    END IF;
    
    -- If we somehow got a duplicate, increment and try again
    attempt_count := attempt_count + 1;
    next_num := next_num + 1;
    
    -- Prevent infinite loops
    IF attempt_count >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique agreement number after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Also create a unique constraint to prevent duplicates at database level
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leases_agreement_number_unique'
  ) THEN
    ALTER TABLE leases ADD CONSTRAINT leases_agreement_number_unique UNIQUE (agreement_number);
  END IF;
END $$;
