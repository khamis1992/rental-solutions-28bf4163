-- Complete RLS Coverage for All Remaining Tables
-- Migration: 20250131_complete_rls_coverage.sql

BEGIN;

-- =====================================================
-- PART 1: ENABLE RLS ON ALL REMAINING TABLES
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
-- PART 2: CLEAN UP EXISTING PROBLEMATIC POLICIES
-- =====================================================

-- Remove overly permissive policies that cause security warnings
DO $$
BEGIN
    -- Documents table policies
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.documents;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.documents;
    
    -- Communication tables policies
    DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.whatsapp_messages;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.call_logs;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.call_logs;
    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.call_logs;
    
    -- Maintenance table policies
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.maintenance;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.maintenance;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.maintenance;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.maintenance;
    DROP POLICY IF EXISTS "Users can view all maintenance records" ON public.maintenance;
    
    -- Traffic fines policies
    DROP POLICY IF EXISTS "traffic_fines_auth_policy" ON public.traffic_fines;
    DROP POLICY IF EXISTS "traffic_fines_policy" ON public.traffic_fines;
    
    -- Template policies
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.word_templates;
    DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.word_templates;
    DROP POLICY IF EXISTS "Allow authorized users to insert templates" ON public.word_templates;
    DROP POLICY IF EXISTS "Allow users to create templates" ON public.word_templates;
    DROP POLICY IF EXISTS "Allow authorized users to update templates" ON public.word_templates;
    DROP POLICY IF EXISTS "Allow users to view templates" ON public.word_templates;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.word_templates;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Policy doesn't exist, continue
END $$;

-- =====================================================
-- PART 3: CREATE SECURE ROLE-BASED POLICIES
-- =====================================================

-- Documents table - secure access based on roles
CREATE POLICY "documents_role_based_access" ON public.documents
FOR ALL USING (
    auth.uid() IS NOT NULL AND (
        public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager']) OR
        public.user_has_any_role(auth.uid(), ARRAY['employee']) OR
        uploaded_by = auth.uid()
    )
);

-- WhatsApp messages - business users only
CREATE POLICY "whatsapp_business_access" ON public.whatsapp_messages
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'employee'])
);

-- Call logs - own records or management access
CREATE POLICY "call_logs_secure_access" ON public.call_logs
FOR ALL USING (
    auth.uid() IS NOT NULL AND (
        public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager']) OR
        created_by = auth.uid()
    )
);

-- Communication logs - user or admin access
CREATE POLICY "communication_logs_secure_access" ON public.communication_logs
FOR ALL USING (
    auth.uid() IS NOT NULL AND (
        public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager']) OR
        user_id = auth.uid()
    )
);

-- Email communications - sender or admin access
CREATE POLICY "email_comms_secure_access" ON public.email_communications
FOR ALL USING (
    auth.uid() IS NOT NULL AND (
        public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager']) OR
        sent_by = auth.uid()
    )
);

-- SMS messages - sender or admin access  
CREATE POLICY "sms_secure_access" ON public.sms_messages
FOR ALL USING (
    auth.uid() IS NOT NULL AND (
        public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager']) OR
        sent_by = auth.uid()
    )
);

-- Legal tables - legal team and admin access
CREATE POLICY "legal_cases_secure_access" ON public.legal_cases
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'legal'])
);

CREATE POLICY "legal_templates_secure_access" ON public.legal_templates
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'legal'])
);

CREATE POLICY "legal_documents_secure_access" ON public.legal_documents
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'legal'])
);

-- Maintenance - operations team access
CREATE POLICY "maintenance_operations_access" ON public.maintenance
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'maintenance', 'employee'])
);

-- Traffic fines - administrative access
CREATE POLICY "traffic_fines_admin_access" ON public.traffic_fines
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'employee'])
);

-- Damages - business access
CREATE POLICY "damages_business_access" ON public.damages
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'employee'])
);

-- System tables - admin only
CREATE POLICY "error_logs_admin_only" ON public.error_logs
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager'])
);

CREATE POLICY "incident_reports_admin_only" ON public.incident_reports
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager'])
);

-- Push subscriptions - own subscriptions only
CREATE POLICY "push_subscriptions_own_only" ON public.push_subscriptions
FOR ALL USING (
    user_id = auth.uid()
);

-- API keys - own keys only
CREATE POLICY "api_keys_own_only" ON public.api_keys
FOR ALL USING (
    user_id = auth.uid()
);

-- Template tables - business users
CREATE POLICY "invoice_templates_business" ON public.invoice_templates
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'accountant', 'employee'])
);

CREATE POLICY "email_templates_business" ON public.email_templates
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'employee'])
);

CREATE POLICY "word_templates_business" ON public.word_templates
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'employee'])
);

-- Import tables - admin and manager access
CREATE POLICY "csv_import_mappings_admin" ON public.csv_import_mappings
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager'])
);

CREATE POLICY "imported_agreements_admin" ON public.imported_agreements
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager'])
);

CREATE POLICY "agreement_import_reverts_admin" ON public.agreement_import_reverts
FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager'])
);

-- =====================================================
-- PART 4: ADDITIONAL SECURITY ENHANCEMENTS
-- =====================================================

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    action_type TEXT,
    table_name TEXT,
    record_id UUID DEFAULT NULL,
    details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.security_audit_log (
        user_id,
        action,
        table_name,
        record_id,
        new_values,
        created_at
    ) VALUES (
        auth.uid(),
        action_type,
        table_name,
        record_id,
        details,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check security violations
CREATE OR REPLACE FUNCTION public.check_security_violations()
RETURNS TABLE (
    table_name TEXT,
    policy_count INTEGER,
    has_rls BOOLEAN,
    security_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        COALESCE(p.policy_count, 0)::INTEGER,
        t.rowsecurity,
        CASE 
            WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) > 0 THEN 'SECURE'
            WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) = 0 THEN 'RLS_ENABLED_NO_POLICIES'
            WHEN NOT t.rowsecurity THEN 'NO_RLS'
            ELSE 'UNKNOWN'
        END::TEXT
    FROM pg_tables t
    LEFT JOIN (
        SELECT 
            tablename,
            COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY tablename
    ) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 5: PERFORMANCE INDEXES FOR NEW POLICIES
-- =====================================================

-- Create performance indexes for new role-based queries
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_call_logs_creator ON public.call_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_communication_logs_user ON public.communication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_comms_sender ON public.email_communications(sent_by);
CREATE INDEX IF NOT EXISTS idx_sms_sender ON public.sms_messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);

-- Create partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_status ON public.traffic_fines(status);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON public.legal_cases(status);

COMMIT; 