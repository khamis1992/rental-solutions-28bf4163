-- =====================================================
-- Database Performance Optimization Script
-- =====================================================
-- This script fixes the issues found in the Supabase linting report:
-- 1. Auth RLS Initialization Plan optimizations
-- 2. Multiple permissive policies consolidation  
-- 3. Duplicate index removal

-- =====================================================
-- 1. FIX AUTH RLS INITIALIZATION PLAN ISSUES
-- =====================================================
-- Replace auth.<function>() with (select auth.<function>()) to prevent
-- re-evaluation for each row

-- Fix leases table
DROP POLICY IF EXISTS "Admins can manage all leases" ON public.leases;
CREATE POLICY "Admins can manage all leases" ON public.leases
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL AND 
        ((SELECT auth.jwt()) ->> 'role' = 'admin' OR 
         (SELECT auth.jwt()) ->> 'user_role' = 'admin')
    );

-- Fix sales_leads table
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON public.sales_leads;
CREATE POLICY "Allow authenticated users to insert leads" ON public.sales_leads
    FOR INSERT WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix loyalty_points table
DROP POLICY IF EXISTS "Allow read access to own loyalty points" ON public.loyalty_points;
CREATE POLICY "Allow read access to own loyalty points" ON public.loyalty_points
    FOR SELECT USING (
        user_id = (SELECT auth.uid())
    );

-- Fix customer_rewards table
DROP POLICY IF EXISTS "Allow read access to own rewards" ON public.customer_rewards;
CREATE POLICY "Allow read access to own rewards" ON public.customer_rewards
    FOR SELECT USING (
        customer_id = (SELECT auth.uid())
    );

-- Fix zone_events table - Consolidate policies
DROP POLICY IF EXISTS "Allow users to create zone events" ON public.zone_events;
DROP POLICY IF EXISTS "Allow users to view their own zone events" ON public.zone_events;
CREATE POLICY "Users can manage their own zone events" ON public.zone_events
    FOR ALL USING (
        user_id = (SELECT auth.uid())
    );

-- Fix geofence_zones table
DROP POLICY IF EXISTS "Allow users to create zones" ON public.geofence_zones;
CREATE POLICY "Allow users to create zones" ON public.geofence_zones
    FOR INSERT WITH CHECK (
        created_by = (SELECT auth.uid())
    );

-- Fix csv_import_mappings table
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.csv_import_mappings;
CREATE POLICY "Enable all access for authenticated users" ON public.csv_import_mappings
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix parts inventory tables
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_inventory;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_inventory;
CREATE POLICY "Enable all access for authenticated users" ON public.parts_inventory
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_order_items;
CREATE POLICY "Enable all access for authenticated users" ON public.parts_order_items
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_orders;
CREATE POLICY "Enable all access for authenticated users" ON public.parts_orders
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_suppliers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_suppliers;
CREATE POLICY "Enable all access for authenticated users" ON public.parts_suppliers
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix transaction import tables
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.raw_transaction_imports;
CREATE POLICY "Enable all operations for authenticated users" ON public.raw_transaction_imports
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.transaction_import_items;
CREATE POLICY "Enable all operations for authenticated users" ON public.transaction_import_items
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.transaction_imports;
CREATE POLICY "Enable all operations for authenticated users" ON public.transaction_imports
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix communication tables - Consolidate multiple policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.call_logs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.call_logs;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.call_logs;
CREATE POLICY "Enable all access for authenticated users" ON public.call_logs
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.communication_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.communication_logs;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.communication_logs;
CREATE POLICY "Enable all access for authenticated users" ON public.communication_logs
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.email_communications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.email_communications;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.email_communications;
CREATE POLICY "Enable all access for authenticated users" ON public.email_communications
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.email_templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.email_templates;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.email_templates;
CREATE POLICY "Enable all access for authenticated users" ON public.email_templates
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.sms_messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.sms_messages;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.sms_messages;
CREATE POLICY "Enable all access for authenticated users" ON public.sms_messages
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
CREATE POLICY "Enable all access for authenticated users" ON public.word_templates
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Fix user location tables - Consolidate policies
DROP POLICY IF EXISTS "Portal users can insert their own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can insert their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Portal users can read their own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can view their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can view their own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update their own location" ON public.user_locations;
CREATE POLICY "Users can manage their own locations" ON public.user_locations
    FOR ALL USING (
        user_id = (SELECT auth.uid())
    );

-- Fix conversation_contexts table - Consolidate policies
DROP POLICY IF EXISTS "Users can manage their own conversation context" ON public.conversation_contexts;
DROP POLICY IF EXISTS "Users can view their own conversation context" ON public.conversation_contexts;
DROP POLICY IF EXISTS "Users can update their own conversation context" ON public.conversation_contexts;
CREATE POLICY "Users can manage their own conversation context" ON public.conversation_contexts
    FOR ALL USING (
        user_id = (SELECT auth.uid())
    );

-- Fix maintenance table - Consolidate policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Users can view all maintenance records" ON public.maintenance;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.maintenance;
CREATE POLICY "Enable all access for authenticated users" ON public.maintenance
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
CREATE POLICY "Users can manage AI analysis" ON public.ai_analysis
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- =====================================================
-- 2. REMOVE DUPLICATE INDEXES
-- =====================================================

-- Remove duplicate indexes for email_automation_rules
DROP INDEX IF EXISTS public.idx_automation_rules_trigger_type;
-- Keep: idx_email_automation_rules_trigger

-- Remove duplicate indexes for leases
DROP INDEX IF EXISTS public.leases_agreement_number_key;
-- Keep: leases_agreement_number_unique

-- Remove duplicate indexes for master_sheet_data
DROP INDEX IF EXISTS public.idx_master_sheet_agreement;
-- Keep: idx_master_sheet_agreement_no

-- =====================================================
-- 3. ANALYZE TABLES FOR PERFORMANCE
-- =====================================================

-- Update table statistics for better query planning
ANALYZE public.leases;
ANALYZE public.traffic_fines;
ANALYZE public.maintenance;
ANALYZE public.parts_inventory;
ANALYZE public.user_locations;
ANALYZE public.conversation_contexts;
ANALYZE public.ai_analysis;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check RLS policies are correctly applied
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Check for remaining duplicate indexes
SELECT 
    t1.indexname as index1,
    t2.indexname as index2,
    t1.tablename
FROM pg_indexes t1
JOIN pg_indexes t2 ON (
    t1.tablename = t2.tablename 
    AND t1.indexdef = t2.indexdef 
    AND t1.indexname < t2.indexname
)
WHERE t1.schemaname = 'public';

COMMIT; 