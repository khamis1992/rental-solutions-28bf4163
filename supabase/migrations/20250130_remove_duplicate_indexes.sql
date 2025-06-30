-- Remove Duplicate Indexes Migration
-- Addresses duplicate index warnings from Security Advisor

BEGIN;

-- Remove duplicate indexes as identified in linting report
DROP INDEX IF EXISTS public.idx_automation_rules_trigger_type;
DROP INDEX IF EXISTS public.leases_agreement_number_key;
DROP INDEX IF EXISTS public.idx_master_sheet_agreement;

-- Remove other potential duplicate indexes
DROP INDEX IF EXISTS public.idx_vehicles_license_plate_dup;
DROP INDEX IF EXISTS public.idx_customers_email_dup;
DROP INDEX IF EXISTS public.idx_payments_reference_dup;

-- Create optimized indexes for auth queries
CREATE INDEX IF NOT EXISTS idx_leases_auth_optimized ON public.leases(customer_id, id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_auth_optimized ON public.unified_payments(lease_id, id) WHERE lease_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_auth_optimized ON public.documents(uploaded_by, id) WHERE uploaded_by IS NOT NULL;

-- Update statistics
ANALYZE public.leases;
ANALYZE public.unified_payments;
ANALYZE public.documents;

COMMIT; 