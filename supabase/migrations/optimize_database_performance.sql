-- =====================================================
-- DATABASE PERFORMANCE OPTIMIZATION MIGRATION
-- =====================================================
-- This migration fixes issues found in Supabase linting report:
-- 1. Auth RLS Initialization Plan optimizations (119 issues)
-- 2. Multiple permissive policies consolidation (45 issues)  
-- 3. Duplicate index removal (3 issues)

BEGIN;

-- =====================================================
-- 1. REMOVE DUPLICATE INDEXES FIRST
-- =====================================================

-- email_automation_rules table
DROP INDEX IF EXISTS public.idx_automation_rules_trigger_type;
-- Keeping: idx_email_automation_rules_trigger

-- leases table  
DROP INDEX IF EXISTS public.leases_agreement_number_key;
-- Keeping: leases_agreement_number_unique

-- master_sheet_data table
DROP INDEX IF EXISTS public.idx_master_sheet_agreement;
-- Keeping: idx_master_sheet_agreement_no

-- =====================================================
-- 2. OPTIMIZE AUTH RLS POLICIES
-- =====================================================

-- Fix leases table - Consolidate policies and optimize auth calls
DROP POLICY IF EXISTS "Admins can manage all leases" ON public.leases;
DROP POLICY IF EXISTS "Portal users can view their agreements" ON public.leases;
CREATE POLICY "leases_unified_policy" ON public.leases
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL AND (
            -- Admin access
            ((SELECT auth.jwt()) ->> 'role' = 'admin') OR
            -- User can view their own agreements
            (customer_id = (SELECT auth.uid()))
        )
    );

-- Fix sales_leads table
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON public.sales_leads;
CREATE POLICY "sales_leads_policy" ON public.sales_leads
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix loyalty_points table
DROP POLICY IF EXISTS "Allow read access to own loyalty points" ON public.loyalty_points;
CREATE POLICY "loyalty_points_policy" ON public.loyalty_points
    FOR ALL USING (
        user_id = (SELECT auth.uid())
    );

-- Fix customer_rewards table
DROP POLICY IF EXISTS "Allow read access to own rewards" ON public.customer_rewards;
CREATE POLICY "customer_rewards_policy" ON public.customer_rewards
    FOR ALL USING (
        customer_id = (SELECT auth.uid())
    );

-- Fix zone_events table - Consolidate policies
DROP POLICY IF EXISTS "Allow users to create zone events" ON public.zone_events;
DROP POLICY IF EXISTS "Allow users to view their own zone events" ON public.zone_events;
CREATE POLICY "zone_events_unified_policy" ON public.zone_events
    FOR ALL USING (
        user_id = (SELECT auth.uid())
    );

-- Fix geofence_zones table
DROP POLICY IF EXISTS "Allow users to create zones" ON public.geofence_zones;
CREATE POLICY "geofence_zones_policy" ON public.geofence_zones
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix csv_import_mappings table
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.csv_import_mappings;
CREATE POLICY "csv_import_mappings_policy" ON public.csv_import_mappings
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix parts inventory system - Consolidate multiple policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_inventory;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_inventory;
CREATE POLICY "parts_inventory_unified_policy" ON public.parts_inventory
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_order_items;
CREATE POLICY "parts_order_items_unified_policy" ON public.parts_order_items
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_orders;
CREATE POLICY "parts_orders_unified_policy" ON public.parts_orders
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_suppliers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_suppliers;
CREATE POLICY "parts_suppliers_unified_policy" ON public.parts_suppliers
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix transaction import tables
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.raw_transaction_imports;
CREATE POLICY "raw_transaction_imports_policy" ON public.raw_transaction_imports
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.transaction_import_items;
CREATE POLICY "transaction_import_items_policy" ON public.transaction_import_items
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.transaction_imports;
CREATE POLICY "transaction_imports_policy" ON public.transaction_imports
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix communication tables - Consolidate multiple policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.call_logs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.call_logs;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.call_logs;
CREATE POLICY "call_logs_unified_policy" ON public.call_logs
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.communication_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.communication_logs;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.communication_logs;
CREATE POLICY "communication_logs_unified_policy" ON public.communication_logs
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.email_communications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.email_communications;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.email_communications;
CREATE POLICY "email_communications_unified_policy" ON public.email_communications
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.email_templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.email_templates;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.email_templates;
CREATE POLICY "email_templates_unified_policy" ON public.email_templates
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.sms_messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.sms_messages;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.sms_messages;
CREATE POLICY "sms_messages_unified_policy" ON public.sms_messages
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix word_templates table - Consolidate multiple policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.word_templates;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.word_templates;
DROP POLICY IF EXISTS "Allow authorized users to insert templates" ON public.word_templates;
DROP POLICY IF EXISTS "Allow users to create templates" ON public.word_templates;
DROP POLICY IF EXISTS "Allow authorized users to update templates" ON public.word_templates;
DROP POLICY IF EXISTS "Allow users to view templates" ON public.word_templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.word_templates;
CREATE POLICY "word_templates_unified_policy" ON public.word_templates
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix user management tables
DROP POLICY IF EXISTS "Portal users can insert their own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can insert their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Portal users can read their own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can view their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can view their own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update their own location" ON public.user_locations;
CREATE POLICY "user_locations_unified_policy" ON public.user_locations
    FOR ALL USING (
        user_id = (SELECT auth.uid())
    );

-- Fix conversation_contexts table
DROP POLICY IF EXISTS "Users can manage their own conversation context" ON public.conversation_contexts;
DROP POLICY IF EXISTS "Users can view their own conversation context" ON public.conversation_contexts;
DROP POLICY IF EXISTS "Users can update their own conversation context" ON public.conversation_contexts;
CREATE POLICY "conversation_contexts_unified_policy" ON public.conversation_contexts
    FOR ALL USING (
        user_id = (SELECT auth.uid())
    );

-- Fix maintenance table - Consolidate policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Users can view all maintenance records" ON public.maintenance;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.maintenance;
CREATE POLICY "maintenance_unified_policy" ON public.maintenance
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix traffic_fines table - Consolidate policies
DROP POLICY IF EXISTS "traffic_fines_auth_policy" ON public.traffic_fines;
DROP POLICY IF EXISTS "traffic_fines_policy" ON public.traffic_fines;
CREATE POLICY "traffic_fines_unified_policy" ON public.traffic_fines
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix ai_analysis table - Consolidate policies
DROP POLICY IF EXISTS "Users can create and update AI analysis" ON public.ai_analysis;
DROP POLICY IF EXISTS "Users can view AI analysis" ON public.ai_analysis;
CREATE POLICY "ai_analysis_unified_policy" ON public.ai_analysis
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix invoice_templates table
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.invoice_templates;
CREATE POLICY "invoice_templates_policy" ON public.invoice_templates
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix API keys table - Consolidate policies
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;
CREATE POLICY "api_keys_unified_policy" ON public.api_keys
    FOR ALL USING (
        user_id = (SELECT auth.uid())
    );

-- =====================================================
-- 3. UPDATE TABLE STATISTICS
-- =====================================================

-- Update statistics for better query planning
ANALYZE public.leases;
ANALYZE public.traffic_fines;
ANALYZE public.maintenance;
ANALYZE public.parts_inventory;
ANALYZE public.user_locations;
ANALYZE public.conversation_contexts;
ANALYZE public.ai_analysis;
ANALYZE public.word_templates;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run these manually to verify)
-- =====================================================

-- Check for remaining duplicate indexes
-- SELECT 
--     t1.indexname as index1,
--     t2.indexname as index2,
--     t1.tablename
-- FROM pg_indexes t1
-- JOIN pg_indexes t2 ON (
--     t1.tablename = t2.tablename 
--     AND t1.indexdef = t2.indexdef 
--     AND t1.indexname < t2.indexname
-- )
-- WHERE t1.schemaname = 'public';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname; 