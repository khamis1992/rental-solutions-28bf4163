-- Security Fixes for Supabase Database
-- Addresses Security Advisor warnings

BEGIN;

-- Enable RLS on core tables if not already enabled
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.traffic_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.error_logs ENABLE ROW LEVEL SECURITY;

-- Drop problematic policies that cause warnings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.documents;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.maintenance;

-- Create secure policies with optimized auth calls
CREATE POLICY "documents_secure" ON public.documents
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "whatsapp_secure" ON public.whatsapp_messages  
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "maintenance_secure" ON public.maintenance
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "traffic_fines_secure" ON public.traffic_fines
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "error_logs_admin" ON public.error_logs
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')
);

-- Grant proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;

COMMIT; 