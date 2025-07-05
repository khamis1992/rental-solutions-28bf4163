
-- Create a function to check if a column exists in a table
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    column_count integer;
BEGIN
    SELECT COUNT(*) 
    INTO column_count
    FROM information_schema.columns 
    WHERE table_name = $1
    AND column_name = $2
    AND table_schema = 'public';
    
    RETURN column_count > 0;
END;
$$;

-- Add the overwrite_existing column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'agreement_imports'
        AND column_name = 'overwrite_existing'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agreement_imports 
        ADD COLUMN overwrite_existing boolean DEFAULT false;
    END IF;
END $$;
