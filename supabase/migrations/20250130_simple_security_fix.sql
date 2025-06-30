-- Simple Security Fix - Avoids Constraint Issues
-- Only handles essential security without touching problematic constraints

BEGIN;

-- Enable RLS on core tables
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unified_payments ENABLE ROW LEVEL SECURITY;

-- Drop problematic old policies
DROP POLICY IF EXISTS "Admins can manage all leases" ON public.leases;
DROP POLICY IF EXISTS "Portal users can view their agreements" ON public.leases;

-- Create simple, secure policies
DROP POLICY IF EXISTS "customers_policy" ON public.customers;
CREATE POLICY "customers_policy" ON public.customers
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "vehicles_policy" ON public.vehicles;  
CREATE POLICY "vehicles_policy" ON public.vehicles
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "leases_policy" ON public.leases;
CREATE POLICY "leases_policy" ON public.leases
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "payments_policy" ON public.unified_payments;
CREATE POLICY "payments_policy" ON public.unified_payments
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

-- Only remove indexes that are safe to remove (not linked to constraints)
DROP INDEX IF EXISTS public.idx_automation_rules_trigger_type;
DROP INDEX IF EXISTS public.idx_master_sheet_agreement;

-- Skip leases_agreement_number_key as it's linked to a constraint
-- This will be handled separately if needed

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;

COMMIT; 