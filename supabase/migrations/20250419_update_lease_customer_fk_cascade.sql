
-- Drop existing foreign key constraint
ALTER TABLE public.leases DROP CONSTRAINT IF EXISTS fk_leases_customer;

-- Recreate with ON DELETE CASCADE
ALTER TABLE public.leases 
ADD CONSTRAINT fk_leases_customer 
FOREIGN KEY (customer_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
