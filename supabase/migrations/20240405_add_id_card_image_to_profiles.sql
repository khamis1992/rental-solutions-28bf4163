-- Migration: Add ID card image field to profiles table
-- Created: 2024-04-05
-- Purpose: Store scanned ID card images for customers

-- Add id_card_image column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_card_image TEXT;

-- Add comment for the new column
COMMENT ON COLUMN profiles.id_card_image IS 'Base64 encoded image of the customer ID card from scanning';

-- Create index for faster queries (optional, since it's just for storage)
-- We don't index this since it's mainly for storage and display purposes 