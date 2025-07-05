-- Consolidate Multiple Permissive Policies
-- Reduces policy count and improves performance

BEGIN;

-- Maintenance table - remove multiple policies and create one unified
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.maintenance;
DROP POLICY IF EXISTS "Users can view all maintenance records" ON public.maintenance;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.maintenance;

CREATE POLICY "maintenance_consolidated" ON public.maintenance
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'maintenance', 'employee')
);

-- Traffic fines - consolidate multiple policies
DROP POLICY IF EXISTS "traffic_fines_auth_policy" ON public.traffic_fines;
DROP POLICY IF EXISTS "traffic_fines_policy" ON public.traffic_fines;
DROP POLICY IF EXISTS "traffic_fines_unified_policy" ON public.traffic_fines;

CREATE POLICY "traffic_fines_consolidated" ON public.traffic_fines
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

-- Parts system - consolidate all parts-related policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.parts_inventory;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts_inventory;

CREATE POLICY "parts_inventory_consolidated" ON public.parts_inventory
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'maintenance')
);

-- Transaction imports - consolidate policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.raw_transaction_imports;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.transaction_import_items;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.transaction_imports;

CREATE POLICY "transaction_imports_consolidated" ON public.raw_transaction_imports
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')
);

-- CSV import mappings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.csv_import_mappings;

CREATE POLICY "csv_import_consolidated" ON public.csv_import_mappings
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')
);

-- Sales leads
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON public.sales_leads;

CREATE POLICY "sales_leads_consolidated" ON public.sales_leads
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'sales', 'employee')
);

-- Customer rewards and loyalty
DROP POLICY IF EXISTS "Allow read access to own loyalty points" ON public.loyalty_points;
DROP POLICY IF EXISTS "Allow read access to own rewards" ON public.customer_rewards;

CREATE POLICY "loyalty_points_consolidated" ON public.loyalty_points
FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "customer_rewards_consolidated" ON public.customer_rewards
FOR ALL USING (customer_id = (SELECT auth.uid()));

-- Zone events and geofencing
DROP POLICY IF EXISTS "Allow users to create zone events" ON public.zone_events;
DROP POLICY IF EXISTS "Allow users to view their own zone events" ON public.zone_events;
DROP POLICY IF EXISTS "Allow users to create zones" ON public.geofence_zones;

CREATE POLICY "zone_events_consolidated" ON public.zone_events
FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "geofence_zones_consolidated" ON public.geofence_zones
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

-- AI Analysis
DROP POLICY IF EXISTS "Users can create and update AI analysis" ON public.ai_analysis;
DROP POLICY IF EXISTS "Users can view AI analysis" ON public.ai_analysis;

CREATE POLICY "ai_analysis_consolidated" ON public.ai_analysis
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

COMMIT; 