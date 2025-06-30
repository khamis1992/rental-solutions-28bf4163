-- =====================================================
-- Safe Security Fixes - Only for Existing Tables
-- =====================================================
-- This migration safely applies security fixes only to tables that exist

DO $$ 
DECLARE
    table_exists boolean;
BEGIN

-- =====================================================
-- STEP 1: Core Tables Security (Always Present)
-- =====================================================

-- Enable RLS on core tables
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unified_payments ENABLE ROW LEVEL SECURITY;

-- Create optimized auth functions
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT (SELECT auth.jwt()) ->> 'role';
$$;

CREATE OR REPLACE FUNCTION auth.get_current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT (SELECT auth.uid());
$$;

-- Drop old problematic policies
DROP POLICY IF EXISTS "Admins can manage all leases" ON public.leases;
DROP POLICY IF EXISTS "Portal users can view their agreements" ON public.leases;

-- Create secure policies for core tables
DROP POLICY IF EXISTS "customers_secure_access" ON public.customers;
CREATE POLICY "customers_secure_access" ON public.customers
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

DROP POLICY IF EXISTS "vehicles_secure_access" ON public.vehicles;
CREATE POLICY "vehicles_secure_access" ON public.vehicles
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

DROP POLICY IF EXISTS "leases_secure_access" ON public.leases;
CREATE POLICY "leases_secure_access" ON public.leases
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee') OR
    (((SELECT auth.jwt()) ->> 'role') = 'customer' AND customer_id = (SELECT auth.uid()))
  )
);

DROP POLICY IF EXISTS "payments_secure_access" ON public.unified_payments;
CREATE POLICY "payments_secure_access" ON public.unified_payments
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee') OR
    (((SELECT auth.jwt()) ->> 'role') = 'customer' AND 
     lease_id IN (SELECT id FROM public.leases WHERE customer_id = (SELECT auth.uid())))
  )
);

-- =====================================================
-- STEP 2: Conditional Tables (Check Existence First)
-- =====================================================

-- Check and secure documents table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'documents'
) INTO table_exists;

IF table_exists THEN
    ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "documents_secure" ON public.documents;
    DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
    DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
    DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
    DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
    
    CREATE POLICY "documents_secure_unified" ON public.documents
    FOR ALL USING (
      (SELECT auth.uid()) IS NOT NULL AND (
        ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR
        created_by = (SELECT auth.uid())
      )
    );
    
    RAISE NOTICE 'Applied security policies to documents table';
ELSE
    RAISE NOTICE 'documents table does not exist, skipping';
END IF;

-- Check and secure whatsapp_messages table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_messages'
) INTO table_exists;

IF table_exists THEN
    ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "whatsapp_secure" ON public.whatsapp_messages;
    
    CREATE POLICY "whatsapp_secure_unified" ON public.whatsapp_messages
    FOR ALL USING (
      (SELECT auth.uid()) IS NOT NULL AND 
      ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
    );
    
    RAISE NOTICE 'Applied security policies to whatsapp_messages table';
ELSE
    RAISE NOTICE 'whatsapp_messages table does not exist, skipping';
END IF;

-- Check and secure maintenance table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'maintenance'
) INTO table_exists;

IF table_exists THEN
    ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "maintenance_secure" ON public.maintenance;
    DROP POLICY IF EXISTS "maintenance_consolidated" ON public.maintenance;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.maintenance;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.maintenance;
    
    CREATE POLICY "maintenance_secure_unified" ON public.maintenance  
    FOR ALL USING (
      (SELECT auth.uid()) IS NOT NULL AND 
      ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
    );
    
    RAISE NOTICE 'Applied security policies to maintenance table';
ELSE
    RAISE NOTICE 'maintenance table does not exist, skipping';
END IF;

-- Check and secure traffic_fines table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'traffic_fines'
) INTO table_exists;

IF table_exists THEN
    ALTER TABLE public.traffic_fines ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "traffic_fines_secure" ON public.traffic_fines;
    DROP POLICY IF EXISTS "traffic_fines_consolidated" ON public.traffic_fines;
    DROP POLICY IF EXISTS "traffic_fines_auth_policy" ON public.traffic_fines;
    DROP POLICY IF EXISTS "traffic_fines_policy" ON public.traffic_fines;
    DROP POLICY IF EXISTS "traffic_fines_unified_policy" ON public.traffic_fines;
    
    CREATE POLICY "traffic_fines_secure_unified" ON public.traffic_fines
    FOR ALL USING (
      (SELECT auth.uid()) IS NOT NULL AND 
      ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
    );
    
    RAISE NOTICE 'Applied security policies to traffic_fines table';
ELSE
    RAISE NOTICE 'traffic_fines table does not exist, skipping';
END IF;

-- Check and secure error_logs table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs'
) INTO table_exists;

IF table_exists THEN
    ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "error_logs_admin" ON public.error_logs;
    
    CREATE POLICY "error_logs_admin_only" ON public.error_logs
    FOR ALL USING (
      (SELECT auth.uid()) IS NOT NULL AND 
      ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')
    );
    
    RAISE NOTICE 'Applied security policies to error_logs table';
ELSE
    RAISE NOTICE 'error_logs table does not exist, skipping';
END IF;

-- Check and secure damages table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'damages'
) INTO table_exists;

IF table_exists THEN
    ALTER TABLE public.damages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "damages_secure_access" ON public.damages;
    
    CREATE POLICY "damages_secure_unified" ON public.damages
    FOR ALL USING (
      (SELECT auth.uid()) IS NOT NULL AND 
      ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
    );
    
    RAISE NOTICE 'Applied security policies to damages table';
ELSE
    RAISE NOTICE 'damages table does not exist, skipping';
END IF;

-- =====================================================
-- STEP 3: Remove Duplicate Indexes (Safe)
-- =====================================================

-- Remove duplicate indexes if they exist
DROP INDEX IF EXISTS public.idx_automation_rules_trigger_type;
DROP INDEX IF EXISTS public.leases_agreement_number_key;
DROP INDEX IF EXISTS public.idx_master_sheet_agreement;

-- Create optimized indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_leases_customer_auth ON public.leases(customer_id, id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_lease_auth ON public.unified_payments(lease_id, id) WHERE lease_id IS NOT NULL;

-- =====================================================
-- STEP 4: Final Security Setup
-- =====================================================

-- Grant proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Revoke public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

-- Update statistics for core tables
ANALYZE public.customers;
ANALYZE public.vehicles;
ANALYZE public.leases;
ANALYZE public.unified_payments;

RAISE NOTICE 'Security migration completed successfully!';

END $$; 