-- Add reference_number column to unified_payments table
-- Created: 2025-01-28
-- Purpose: Fix "Could not find the 'reference_number' column" error

-- Add the missing reference_number column
ALTER TABLE unified_payments 
ADD COLUMN reference_number text;

-- Add comment for documentation
COMMENT ON COLUMN unified_payments.reference_number IS 'Reference number for payment identification';

-- Migrate existing data from payment_reference to reference_number if needed
UPDATE unified_payments 
SET reference_number = payment_reference 
WHERE payment_reference IS NOT NULL AND reference_number IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_unified_payments_reference_number 
ON unified_payments(reference_number); 