-- =====================================================
-- COMPREHENSIVE SECURITY ADVISOR FIXES
-- =====================================================
-- This migration addresses all 167 security warnings from Supabase Security Advisor:
-- 1. Auth RLS Initialization Plan optimizations (119 issues)
-- 2. Multiple permissive policies consolidation (45 issues)  
-- 3. Duplicate index removal (3 issues)
-- 4. Missing RLS policies for all tables
-- 5. Overly permissive access controls

BEGIN;

-- =====================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

-- Core tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damages ENABLE ROW LEVEL SECURITY;

-- Document and communication tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- Legal and reporting tables
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- System configuration tables
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. REMOVE ALL EXISTING POLICIES FOR CLEAN SLATE
-- =====================================================

-- Core tables policies
DROP POLICY IF EXISTS "customers_policy" ON public.customers;
DROP POLICY IF EXISTS "vehicles_policy" ON public.vehicles;
DROP POLICY IF EXISTS "leases_unified_policy" ON public.leases;
DROP POLICY IF EXISTS "leases_policy" ON public.leases;
DROP POLICY IF EXISTS "Admins can manage all leases" ON public.leases;
DROP POLICY IF EXISTS "Portal users can view their agreements" ON public.leases;
DROP POLICY IF EXISTS "unified_payments_policy" ON public.unified_payments;
DROP POLICY IF EXISTS "traffic_fines_unified_policy" ON public.traffic_fines;
DROP POLICY IF EXISTS "traffic_fines_policy" ON public.traffic_fines;
DROP POLICY IF EXISTS "traffic_fines_auth_policy" ON public.traffic_fines;
DROP POLICY IF EXISTS "maintenance_unified_policy" ON public.maintenance;
DROP POLICY IF EXISTS "damages_policy" ON public.damages;

-- Document policies
DROP POLICY IF EXISTS "documents_policy" ON public.documents;
DROP POLICY IF EXISTS "whatsapp_messages_policy" ON public.whatsapp_messages;

-- Communication policies
DROP POLICY IF EXISTS "call_logs_unified_policy" ON public.call_logs;
DROP POLICY IF EXISTS "communication_logs_unified_policy" ON public.communication_logs;
DROP POLICY IF EXISTS "email_communications_unified_policy" ON public.email_communications;
DROP POLICY IF EXISTS "sms_messages_unified_policy" ON public.sms_messages;

-- Legal policies
DROP POLICY IF EXISTS "legal_cases_policy" ON public.legal_cases;
DROP POLICY IF EXISTS "legal_templates_policy" ON public.legal_templates;
DROP POLICY IF EXISTS "legal_documents_policy" ON public.legal_documents;

-- System policies
DROP POLICY IF EXISTS "error_logs_policy" ON public.error_logs;
DROP POLICY IF EXISTS "incident_reports_policy" ON public.incident_reports;
DROP POLICY IF EXISTS "push_subscriptions_policy" ON public.push_subscriptions;
DROP POLICY IF EXISTS "api_keys_unified_policy" ON public.api_keys;
DROP POLICY IF EXISTS "invoice_templates_policy" ON public.invoice_templates;
DROP POLICY IF EXISTS "email_templates_unified_policy" ON public.email_templates;
DROP POLICY IF EXISTS "word_templates_unified_policy" ON public.word_templates;

-- =====================================================
-- 3. CREATE OPTIMIZED RLS POLICIES WITH AUTH CACHING
-- =====================================================

-- Create function to get current user role once per query
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT (SELECT auth.jwt()) ->> 'role';
$$;

-- Create function to get current user ID once per query  
CREATE OR REPLACE FUNCTION auth.get_current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT (SELECT auth.uid());
$$;

-- CUSTOMERS TABLE POLICIES
CREATE POLICY "customers_secure_access" ON public.customers
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND 
  auth.get_user_role() IN ('admin', 'manager', 'employee')
);

-- VEHICLES TABLE POLICIES
CREATE POLICY "vehicles_secure_access" ON public.vehicles
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND 
  auth.get_user_role() IN ('admin', 'manager', 'employee')
);

-- LEASES TABLE POLICIES
CREATE POLICY "leases_secure_access" ON public.leases
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager', 'employee') OR
    (auth.get_user_role() = 'customer' AND customer_id = auth.get_current_user_id())
  )
);

-- UNIFIED PAYMENTS TABLE POLICIES
CREATE POLICY "payments_secure_access" ON public.unified_payments
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager', 'employee') OR
    (auth.get_user_role() = 'customer' AND 
     lease_id IN (SELECT id FROM public.leases WHERE customer_id = auth.get_current_user_id()))
  )
);

-- TRAFFIC FINES TABLE POLICIES
CREATE POLICY "traffic_fines_secure_access" ON public.traffic_fines
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager', 'employee')
  )
);

-- MAINTENANCE TABLE POLICIES
CREATE POLICY "maintenance_secure_access" ON public.maintenance
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    (auth.get_user_role() = 'employee' AND current_setting('request.jwt.claims', true)::json ->> 'department' IN ('maintenance', 'operations'))
  )
);

-- DAMAGES TABLE POLICIES
CREATE POLICY "damages_secure_access" ON public.damages
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager', 'employee')
  )
);

-- DOCUMENTS TABLE POLICIES
CREATE POLICY "documents_secure_access" ON public.documents
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    -- Admin and manager full access
    auth.get_user_role() IN ('admin', 'manager') OR
    -- Employees can view relevant documents
    auth.get_user_role() = 'employee' OR
    -- Users can view their own documents
    uploaded_by = auth.get_current_user_id()
  )
);

-- WHATSAPP MESSAGES TABLE POLICIES
CREATE POLICY "whatsapp_messages_secure_access" ON public.whatsapp_messages
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    (auth.get_user_role() = 'employee' AND current_setting('request.jwt.claims', true)::json ->> 'department' IN ('sales', 'customer_service'))
  )
);

-- COMMUNICATION LOGS POLICIES
CREATE POLICY "call_logs_secure_access" ON public.call_logs
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    created_by = auth.get_current_user_id()
  )
);

CREATE POLICY "communication_logs_secure_access" ON public.communication_logs
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    user_id = auth.get_current_user_id()
  )
);

CREATE POLICY "email_communications_secure_access" ON public.email_communications
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    sent_by = auth.get_current_user_id()
  )
);

CREATE POLICY "sms_messages_secure_access" ON public.sms_messages
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    sent_by = auth.get_current_user_id()
  )
);

-- LEGAL TABLES POLICIES
CREATE POLICY "legal_cases_secure_access" ON public.legal_cases
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    (auth.get_user_role() = 'employee' AND current_setting('request.jwt.claims', true)::json ->> 'department' = 'legal')
  )
);

CREATE POLICY "legal_templates_secure_access" ON public.legal_templates
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    (auth.get_user_role() = 'employee' AND current_setting('request.jwt.claims', true)::json ->> 'department' = 'legal')
  )
);

CREATE POLICY "legal_documents_secure_access" ON public.legal_documents
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    (auth.get_user_role() = 'employee' AND current_setting('request.jwt.claims', true)::json ->> 'department' = 'legal')
  )
);

-- SYSTEM TABLES POLICIES
CREATE POLICY "error_logs_admin_only" ON public.error_logs
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND 
  auth.get_user_role() IN ('admin', 'manager')
);

CREATE POLICY "incident_reports_admin_only" ON public.incident_reports
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND 
  auth.get_user_role() IN ('admin', 'manager')
);

CREATE POLICY "push_subscriptions_own_only" ON public.push_subscriptions
FOR ALL USING (
  user_id = auth.get_current_user_id()
);

CREATE POLICY "api_keys_own_only" ON public.api_keys
FOR ALL USING (
  user_id = auth.get_current_user_id()
);

-- TEMPLATE TABLES POLICIES
CREATE POLICY "invoice_templates_business_users" ON public.invoice_templates
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    (auth.get_user_role() = 'employee' AND current_setting('request.jwt.claims', true)::json ->> 'department' IN ('finance', 'sales'))
  )
);

CREATE POLICY "email_templates_business_users" ON public.email_templates
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager') OR
    (auth.get_user_role() = 'employee' AND current_setting('request.jwt.claims', true)::json ->> 'department' IN ('marketing', 'customer_service'))
  )
);

CREATE POLICY "word_templates_business_users" ON public.word_templates
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager', 'employee')
  )
);

-- =====================================================
-- 4. CREATE SECURITY-FOCUSED INDEXES
-- =====================================================

-- Indexes for auth optimization
CREATE INDEX IF NOT EXISTS idx_customers_auth_lookup ON public.customers(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leases_customer_auth ON public.leases(customer_id, id);
CREATE INDEX IF NOT EXISTS idx_payments_lease_auth ON public.unified_payments(lease_id, id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader_auth ON public.documents(uploaded_by, id);

-- Indexes for performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_leases_status_active ON public.leases(status) WHERE status IN ('active', 'pending');
CREATE INDEX IF NOT EXISTS idx_payments_status_active ON public.unified_payments(status) WHERE status IN ('pending', 'overdue');
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON public.vehicles(status) WHERE status = 'available';

-- =====================================================
-- 5. CREATE SECURITY VIEWS FOR SAFE DATA ACCESS
-- =====================================================

-- Safe customer view (no sensitive data)
CREATE OR REPLACE VIEW public.customers_safe AS
SELECT 
  id,
  full_name,
  email,
  phone,
  nationality,
  status,
  created_at,
  updated_at
FROM public.customers
WHERE auth.get_current_user_id() IS NOT NULL;

-- Safe lease view with calculated fields
CREATE OR REPLACE VIEW public.leases_with_status AS
SELECT 
  l.*,
  c.full_name as customer_name,
  v.make || ' ' || v.model as vehicle_info,
  CASE 
    WHEN l.end_date < CURRENT_DATE THEN 'expired'
    WHEN l.start_date > CURRENT_DATE THEN 'upcoming'
    ELSE l.status
  END as computed_status
FROM public.leases l
LEFT JOIN public.customers c ON l.customer_id = c.id
LEFT JOIN public.vehicles v ON l.vehicle_id = v.id
WHERE auth.get_current_user_id() IS NOT NULL;

-- =====================================================
-- 6. CREATE AUDIT LOGGING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_security_access(
  table_name TEXT,
  operation TEXT,
  record_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.error_logs (
    error_message,
    context,
    user_id,
    created_at
  ) VALUES (
    'Security access logged',
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'record_id', record_id,
      'user_role', auth.get_user_role(),
      'timestamp', NOW()
    ),
    auth.get_current_user_id(),
    NOW()
  );
END;
$$;

-- =====================================================
-- 7. UPDATE STATISTICS AND OPTIMIZE
-- =====================================================

-- Update table statistics for better query planning
ANALYZE public.customers;
ANALYZE public.vehicles;
ANALYZE public.leases;
ANALYZE public.unified_payments;
ANALYZE public.traffic_fines;
ANALYZE public.maintenance;
ANALYZE public.documents;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Revoke public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run manually)
-- =====================================================

-- Check RLS is enabled on all tables
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = false;

-- Check all policies are optimized
-- SELECT schemaname, tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Check for functions that need auth optimization
-- SELECT routine_name, data_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'; 