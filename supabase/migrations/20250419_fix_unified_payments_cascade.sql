
-- Fix foreign key constraints to use CASCADE DELETE
-- This will allow agreements to be deleted without foreign key violations

-- Fix unified_payments table
ALTER TABLE public.unified_payments DROP CONSTRAINT IF EXISTS unified_payments_lease_id_fkey;
ALTER TABLE public.unified_payments 
ADD CONSTRAINT unified_payments_lease_id_fkey 
FOREIGN KEY (lease_id) 
REFERENCES public.leases(id) 
ON DELETE CASCADE;

-- Fix new_unified_payments table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'new_unified_payments'
    ) THEN
        ALTER TABLE public.new_unified_payments DROP CONSTRAINT IF EXISTS new_unified_payments_lease_id_fkey;
        ALTER TABLE public.new_unified_payments 
        ADD CONSTRAINT new_unified_payments_lease_id_fkey 
        FOREIGN KEY (lease_id) 
        REFERENCES public.leases(id) 
        ON DELETE CASCADE;
    END IF;
END
$$;

-- Fix damages table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'damages'
    ) THEN
        ALTER TABLE public.damages DROP CONSTRAINT IF EXISTS damages_lease_id_fkey;
        ALTER TABLE public.damages 
        ADD CONSTRAINT damages_lease_id_fkey 
        FOREIGN KEY (lease_id) 
        REFERENCES public.leases(id) 
        ON DELETE CASCADE;
    END IF;
END
$$;

-- Fix overdue_payments table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'overdue_payments'
    ) THEN
        ALTER TABLE public.overdue_payments DROP CONSTRAINT IF EXISTS overdue_payments_agreement_id_fkey;
        ALTER TABLE public.overdue_payments 
        ADD CONSTRAINT overdue_payments_agreement_id_fkey 
        FOREIGN KEY (agreement_id) 
        REFERENCES public.leases(id) 
        ON DELETE CASCADE;
    END IF;
END
$$;

-- Fix payment_schedules table
ALTER TABLE public.payment_schedules DROP CONSTRAINT IF EXISTS payment_schedules_lease_id_fkey;
ALTER TABLE public.payment_schedules 
ADD CONSTRAINT payment_schedules_lease_id_fkey 
FOREIGN KEY (lease_id) 
REFERENCES public.leases(id) 
ON DELETE CASCADE;

-- Fix traffic_fines table
ALTER TABLE public.traffic_fines DROP CONSTRAINT IF EXISTS traffic_fines_lease_id_fkey;
ALTER TABLE public.traffic_fines 
ADD CONSTRAINT traffic_fines_lease_id_fkey 
FOREIGN KEY (lease_id) 
REFERENCES public.leases(id) 
ON DELETE CASCADE;

-- Fix agreement_documents table
ALTER TABLE public.agreement_documents DROP CONSTRAINT IF EXISTS agreement_documents_lease_id_fkey;
ALTER TABLE public.agreement_documents 
ADD CONSTRAINT agreement_documents_lease_id_fkey 
FOREIGN KEY (lease_id) 
REFERENCES public.leases(id) 
ON DELETE CASCADE;
