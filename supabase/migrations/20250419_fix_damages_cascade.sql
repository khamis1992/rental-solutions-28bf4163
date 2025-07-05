
-- Fix foreign key constraint for damages table to use CASCADE DELETE
-- This will allow agreements to be deleted even when they have damage records

-- Check if damages table exists and has the foreign key constraint
DO $$
BEGIN
    -- Only proceed if the damages table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'damages'
    ) THEN
        -- Drop existing constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'damages_lease_id_fkey' 
            AND table_name = 'damages'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.damages DROP CONSTRAINT damages_lease_id_fkey;
        END IF;

        -- Recreate with ON DELETE CASCADE
        ALTER TABLE public.damages 
        ADD CONSTRAINT damages_lease_id_fkey 
        FOREIGN KEY (lease_id) 
        REFERENCES public.leases(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated damages table foreign key constraint with CASCADE DELETE';
    ELSE
        RAISE NOTICE 'Damages table does not exist, skipping constraint update';
    END IF;
END
$$;
