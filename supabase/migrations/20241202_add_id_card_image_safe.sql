-- Safe migration to add id_card_image column
-- Date: 2024-12-02

-- Add the column only if it doesn't exist
DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'id_card_image'
    ) THEN
        -- Add the column
        ALTER TABLE public.profiles ADD COLUMN id_card_image TEXT;
        
        -- Add comment
        COMMENT ON COLUMN public.profiles.id_card_image IS 'Base64 encoded image of customer ID card from scanning';
        
        RAISE NOTICE 'Successfully added id_card_image column to profiles table';
    ELSE
        RAISE NOTICE 'Column id_card_image already exists in profiles table - skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding id_card_image column: %', SQLERRM;
END $$; 