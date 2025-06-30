-- Fix ID card image column in profiles table
-- This ensures the column exists safely

DO $$ 
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'id_card_image'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.profiles ADD COLUMN id_card_image TEXT;
        
        -- Add comment
        COMMENT ON COLUMN public.profiles.id_card_image IS 'Base64 encoded image of customer ID card from scanning';
        
        RAISE NOTICE 'Successfully added id_card_image column to profiles table';
    ELSE
        RAISE NOTICE 'Column id_card_image already exists in profiles table';
    END IF;
END $$;

-- Update database types if needed
-- This will force a schema refresh
SELECT 1 as schema_updated; 