
-- Fix foreign key constraint for new_unified_payments table
-- Drop existing constraint if it exists
ALTER TABLE public.new_unified_payments DROP CONSTRAINT IF EXISTS new_unified_payments_lease_id_fkey;

-- Recreate with ON DELETE CASCADE
ALTER TABLE public.new_unified_payments 
ADD CONSTRAINT new_unified_payments_lease_id_fkey 
FOREIGN KEY (lease_id) 
REFERENCES public.leases(id) 
ON DELETE CASCADE;

-- Also update the unified_payments table constraint if it exists
ALTER TABLE public.unified_payments DROP CONSTRAINT IF EXISTS unified_payments_lease_id_fkey;

ALTER TABLE public.unified_payments 
ADD CONSTRAINT unified_payments_lease_id_fkey 
FOREIGN KEY (lease_id) 
REFERENCES public.leases(id) 
ON DELETE CASCADE;
