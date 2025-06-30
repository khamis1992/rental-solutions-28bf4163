-- Safe Security Migration - Only for Existing Tables
-- Checks table existence before applying policies

BEGIN;

-- Create auth helper functions
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER
AS $$ SELECT (SELECT auth.jwt()) ->> 'role'; $$;

-- Enable RLS on core tables that should exist
DO $$
BEGIN
    -- Customers table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
        ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "customers_secure_access" ON public.customers;
        CREATE POLICY "customers_secure_access" ON public.customers
        FOR ALL USING ((SELECT auth.uid()) IS NOT NULL AND ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee'));
        RAISE NOTICE 'Applied security to customers table';
    END IF;

    -- Vehicles table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles' AND table_schema = 'public') THEN
        ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "vehicles_secure_access" ON public.vehicles;
        CREATE POLICY "vehicles_secure_access" ON public.vehicles
        FOR ALL USING ((SELECT auth.uid()) IS NOT NULL AND ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee'));
        RAISE NOTICE 'Applied security to vehicles table';
    END IF;

    -- Leases table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leases' AND table_schema = 'public') THEN
        ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Admins can manage all leases" ON public.leases;
        DROP POLICY IF EXISTS "Portal users can view their agreements" ON public.leases;
        DROP POLICY IF EXISTS "leases_secure_access" ON public.leases;
        CREATE POLICY "leases_secure_access" ON public.leases
        FOR ALL USING ((SELECT auth.uid()) IS NOT NULL AND (((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee') OR (((SELECT auth.jwt()) ->> 'role') = 'customer' AND customer_id = (SELECT auth.uid()))));
        RAISE NOTICE 'Applied security to leases table';
    END IF;

    -- Unified payments table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_payments' AND table_schema = 'public') THEN
        ALTER TABLE public.unified_payments ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "payments_secure_access" ON public.unified_payments;
        CREATE POLICY "payments_secure_access" ON public.unified_payments
        FOR ALL USING ((SELECT auth.uid()) IS NOT NULL AND (((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee') OR (((SELECT auth.jwt()) ->> 'role') = 'customer' AND lease_id IN (SELECT id FROM public.leases WHERE customer_id = (SELECT auth.uid())))));
        RAISE NOTICE 'Applied security to unified_payments table';
    END IF;

    -- Documents table (conditional)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
        ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
        DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
        DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
        DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
        CREATE POLICY "documents_secure_unified" ON public.documents
        FOR ALL USING ((SELECT auth.uid()) IS NOT NULL AND (((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR created_by = (SELECT auth.uid())));
        RAISE NOTICE 'Applied security to documents table';
    ELSE
        RAISE NOTICE 'documents table does not exist, skipping';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during security migration: %', SQLERRM;
END $$;

-- Remove duplicate indexes safely
DROP INDEX IF EXISTS public.idx_automation_rules_trigger_type;
DROP INDEX IF EXISTS public.leases_agreement_number_key;
DROP INDEX IF EXISTS public.idx_master_sheet_agreement;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_leases_customer_auth ON public.leases(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_lease_auth ON public.unified_payments(lease_id) WHERE lease_id IS NOT NULL;

-- Set proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;

COMMIT; 