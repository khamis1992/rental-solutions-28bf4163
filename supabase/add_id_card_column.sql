-- Add ID card image column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_card_image TEXT;

-- Add comment for the new column
COMMENT ON COLUMN profiles.id_card_image IS 'Base64 encoded image of customer ID card from scanning';

-- Display success message
SELECT 'Column id_card_image added successfully to profiles table' as result; 