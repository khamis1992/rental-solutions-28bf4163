-- Complete Security Coverage for All Tables
-- This migration covers remaining tables and security issues

BEGIN;

-- =====================================================
-- ENABLE RLS ON ALL REMAINING TABLES
-- =====================================================

-- Document and communication tables
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sms_messages ENABLE ROW LEVEL SECURITY;

-- Legal and compliance tables
ALTER TABLE IF EXISTS public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Maintenance and operations
ALTER TABLE IF EXISTS public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.traffic_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.damages ENABLE ROW LEVEL SECURITY;

-- System and configuration tables
ALTER TABLE IF EXISTS public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;

-- Template tables
ALTER TABLE IF EXISTS public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.word_templates ENABLE ROW LEVEL SECURITY;

-- Import and data management tables
ALTER TABLE IF EXISTS public.csv_import_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.imported_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agreement_import_reverts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CLEAN UP OLD POLICIES WITH PERFORMANCE ISSUES
-- =====================================================

-- Remove all existing permissive policies that cause warnings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.documents;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.call_logs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.call_logs;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.call_logs;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Users can view all maintenance records" ON public.maintenance;
DROP POLICY IF EXISTS "traffic_fines_auth_policy" ON public.traffic_fines;
DROP POLICY IF EXISTS "traffic_fines_policy" ON public.traffic_fines;

-- Clean up template policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.word_templates;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.word_templates;
DROP POLICY IF EXISTS "Allow authorized users to insert templates" ON public.word_templates;
DROP POLICY IF EXISTS "Allow users to create templates" ON public.word_templates;
DROP POLICY IF EXISTS "Allow authorized users to update templates" ON public.word_templates;
DROP POLICY IF EXISTS "Allow users to view templates" ON public.word_templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.word_templates;

-- =====================================================
-- CREATE SECURE POLICIES FOR ALL TABLES
-- =====================================================

-- Documents table - secure access
CREATE POLICY "documents_role_based_access" ON public.documents
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR
    (((SELECT auth.jwt()) ->> 'role') = 'employee') OR
    (uploaded_by = (SELECT auth.uid()))
  )
);

-- WhatsApp messages - business users only
CREATE POLICY "whatsapp_business_access" ON public.whatsapp_messages
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

-- Call logs - own records or admin access
CREATE POLICY "call_logs_secure_access" ON public.call_logs
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR
    (created_by = (SELECT auth.uid()))
  )
);

-- Communication logs - user or admin access
CREATE POLICY "communication_logs_secure_access" ON public.communication_logs
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR
    (user_id = (SELECT auth.uid()))
  )
);

-- Email communications - sender or admin access
CREATE POLICY "email_comms_secure_access" ON public.email_communications
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR
    (sent_by = (SELECT auth.uid()))
  )
);

-- SMS messages - sender or admin access
CREATE POLICY "sms_secure_access" ON public.sms_messages
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR
    (sent_by = (SELECT auth.uid()))
  )
);

-- Legal tables - legal team and admin access
CREATE POLICY "legal_cases_secure_access" ON public.legal_cases
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'legal')
);

CREATE POLICY "legal_templates_secure_access" ON public.legal_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'legal')
);

CREATE POLICY "legal_documents_secure_access" ON public.legal_documents
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'legal')
);

-- Maintenance - operations team access
CREATE POLICY "maintenance_operations_access" ON public.maintenance
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'maintenance', 'employee')
);

-- Traffic fines - administrative access
CREATE POLICY "traffic_fines_admin_access" ON public.traffic_fines
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

-- Damages - business access
CREATE POLICY "damages_business_access" ON public.damages
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

-- System tables - admin only
CREATE POLICY "error_logs_admin_only" ON public.error_logs
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')
);

CREATE POLICY "incident_reports_admin_only" ON public.incident_reports
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')
);

-- Push subscriptions - own subscriptions only
CREATE POLICY "push_subscriptions_own_only" ON public.push_subscriptions
FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- API keys - own keys only
CREATE POLICY "api_keys_own_only" ON public.api_keys
FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- Template tables - business users
CREATE POLICY "invoice_templates_business" ON public.invoice_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'finance', 'employee')
);

CREATE POLICY "email_templates_business" ON public.email_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'marketing', 'employee')
);

CREATE POLICY "word_templates_business" ON public.word_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

-- Import tables - admin and data managers
CREATE POLICY "csv_imports_admin_access" ON public.csv_import_mappings
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')
);

CREATE POLICY "imported_agreements_admin" ON public.imported_agreements
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')
);

CREATE POLICY "import_reverts_admin" ON public.agreement_import_reverts
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')
);

-- =====================================================
-- CREATE SECURITY INDEXES FOR PERFORMANCE
-- =====================================================

-- Auth-related indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_customers_auth ON public.customers(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leases_customer_auth ON public.leases(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_lease_auth ON public.unified_payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_call_logs_creator ON public.call_logs(created_by);

-- Status-based indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_status ON public.traffic_fines(status);

-- =====================================================
-- REMOVE DUPLICATE INDEXES
-- =====================================================

-- Remove duplicate indexes found in linting
DROP INDEX IF EXISTS public.idx_automation_rules_trigger_type;
DROP INDEX IF EXISTS public.leases_agreement_number_key;
DROP INDEX IF EXISTS public.idx_master_sheet_agreement;

-- =====================================================
-- GRANT PROPER PERMISSIONS
-- =====================================================

-- Grant authenticated role access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Revoke public access for security
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

-- =====================================================
-- UPDATE STATISTICS
-- =====================================================

-- Update table statistics for better query performance
ANALYZE public.customers;
ANALYZE public.vehicles;
ANALYZE public.leases;
ANALYZE public.unified_payments;
ANALYZE public.maintenance;
ANALYZE public.traffic_fines;
ANALYZE public.documents;

COMMIT; 