-- Advanced Security Cleanup Migration
-- Removes duplicate indexes and consolidates policies

BEGIN;

-- =====================================================
-- REMOVE DUPLICATE INDEXES 
-- =====================================================

-- Check and remove duplicate indexes found in linting report
DROP INDEX IF EXISTS public.idx_automation_rules_trigger_type;
DROP INDEX IF EXISTS public.leases_agreement_number_key; 
DROP INDEX IF EXISTS public.idx_master_sheet_agreement;

-- Remove other potential duplicate indexes
DROP INDEX IF EXISTS public.idx_vehicles_license_plate_duplicate;
DROP INDEX IF EXISTS public.idx_customers_email_duplicate;
DROP INDEX IF EXISTS public.idx_payments_reference_duplicate;

-- =====================================================
-- CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- =====================================================

-- Word templates - remove multiple policies and create one unified policy
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.word_templates;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.word_templates;
DROP POLICY IF EXISTS "Allow authorized users to insert templates" ON public.word_templates;
DROP POLICY IF EXISTS "Allow users to create templates" ON public.word_templates;
DROP POLICY IF EXISTS "Allow authorized users to update templates" ON public.word_templates;
DROP POLICY IF EXISTS "Allow users to view templates" ON public.word_templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.word_templates;

CREATE POLICY "word_templates_unified" ON public.word_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

-- Call logs - consolidate multiple operation policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.call_logs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.call_logs;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.call_logs;

CREATE POLICY "call_logs_unified" ON public.call_logs
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR
    (created_by = (SELECT auth.uid()))
  )
);

-- Communication logs - consolidate policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.communication_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.communication_logs;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.communication_logs;

CREATE POLICY "communication_logs_unified" ON public.communication_logs
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR
    (user_id = (SELECT auth.uid()))
  )
);

-- Email communications - consolidate policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.email_communications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.email_communications;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.email_communications;

CREATE POLICY "email_communications_unified" ON public.email_communications
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR
    (sent_by = (SELECT auth.uid()))
  )
);

-- SMS messages - consolidate policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.sms_messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.sms_messages;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.sms_messages;

CREATE POLICY "sms_messages_unified" ON public.sms_messages
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR
    (sent_by = (SELECT auth.uid()))
  )
);

-- Email templates - consolidate policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.email_templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.email_templates;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.email_templates;

CREATE POLICY "email_templates_unified" ON public.email_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

-- Parts inventory system - consolidate multiple policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_inventory;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_inventory;

CREATE POLICY "parts_inventory_unified" ON public.parts_inventory
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'maintenance')
);

-- Parts orders - consolidate policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_orders;

CREATE POLICY "parts_orders_unified" ON public.parts_orders
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'maintenance')
);

-- Parts order items - consolidate policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_order_items;

CREATE POLICY "parts_order_items_unified" ON public.parts_order_items
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'maintenance')
);

-- Parts suppliers - consolidate policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_suppliers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_suppliers;

CREATE POLICY "parts_suppliers_unified" ON public.parts_suppliers
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'maintenance')
);

-- =====================================================
-- OPTIMIZE AUTH FUNCTION CALLS
-- =====================================================

-- Update existing policies to use SELECT auth.uid() instead of auth.uid()
-- This prevents re-evaluation for each row

-- User locations - consolidate and optimize
DROP POLICY IF EXISTS "Portal users can insert their own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can insert their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Portal users can read their own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can view their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can view their own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update their own location" ON public.user_locations;

CREATE POLICY "user_locations_unified" ON public.user_locations
FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- Conversation contexts - consolidate and optimize
DROP POLICY IF EXISTS "Users can manage their own conversation context" ON public.conversation_contexts;
DROP POLICY IF EXISTS "Users can view their own conversation context" ON public.conversation_contexts;
DROP POLICY IF EXISTS "Users can update their own conversation context" ON public.conversation_contexts;

CREATE POLICY "conversation_contexts_unified" ON public.conversation_contexts
FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- API keys - consolidate policies
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;

CREATE POLICY "api_keys_unified" ON public.api_keys
FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- =====================================================
-- CREATE OPTIMIZED INDEXES
-- =====================================================

-- Create indexes for auth-optimized queries
CREATE INDEX IF NOT EXISTS idx_user_locations_auth ON public.user_locations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_auth ON public.api_keys(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_auth ON public.conversation_contexts(user_id) WHERE user_id IS NOT NULL;

-- Create covering indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leases_customer_status ON public.leases(customer_id, status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_lease_status ON public.unified_payments(lease_id, status) WHERE status IS NOT NULL;

-- =====================================================
-- SECURITY FUNCTIONS FOR BETTER PERFORMANCE
-- =====================================================

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT ((SELECT auth.jwt()) ->> 'role') = required_role;
$$;

-- Create function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.user_has_any_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT ((SELECT auth.jwt()) ->> 'role') = ANY(required_roles);
$$;

-- =====================================================
-- UPDATE STATISTICS FOR PERFORMANCE
-- =====================================================

-- Update statistics on all affected tables
ANALYZE public.word_templates;
ANALYZE public.call_logs;
ANALYZE public.communication_logs;
ANALYZE public.email_communications;
ANALYZE public.sms_messages;
ANALYZE public.email_templates;
ANALYZE public.user_locations;
ANALYZE public.conversation_contexts;
ANALYZE public.api_keys;

-- Vacuum tables to reclaim space from dropped indexes
VACUUM ANALYZE public.leases;
VACUUM ANALYZE public.vehicles;
VACUUM ANALYZE public.customers;

COMMIT; 