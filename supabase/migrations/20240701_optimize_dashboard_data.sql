
-- Create optimized views and functions for dashboard data

-- 1. Vehicle status statistics view
CREATE OR REPLACE VIEW vehicle_status_stats AS
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'available') as available,
  COUNT(*) FILTER (WHERE status = 'rented') as rented,
  COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
  COUNT(*) FILTER (WHERE status = 'police_station') as police_station,
  COUNT(*) FILTER (WHERE status = 'accident') as accident,
  COUNT(*) FILTER (WHERE status = 'stolen') as stolen,
  COUNT(*) FILTER (WHERE status = 'reserved') as reserved,
  -- Attention vehicles - maintenance needed
  COUNT(*) FILTER (WHERE status = 'maintenance') as attention,
  -- Critical vehicles - sum of accidents and stolen
  (COUNT(*) FILTER (WHERE status = 'accident') + 
   COUNT(*) FILTER (WHERE status = 'stolen')) as critical
FROM vehicles;

-- 2. Financial statistics view for current and last month
CREATE OR REPLACE VIEW financial_stats AS
WITH 
current_month AS (
  SELECT 
    EXTRACT(MONTH FROM CURRENT_DATE) as month,
    EXTRACT(YEAR FROM CURRENT_DATE) as year,
    DATE_TRUNC('month', CURRENT_DATE) as first_day
),
last_month AS (
  SELECT 
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') as first_day
),
current_month_revenue AS (
  SELECT 
    COALESCE(SUM(amount_paid), 0) as revenue
  FROM unified_payments
  WHERE payment_date >= (SELECT first_day FROM current_month)
),
last_month_revenue AS (
  SELECT 
    COALESCE(SUM(amount_paid), 0) as revenue
  FROM unified_payments
  WHERE payment_date >= (SELECT first_day FROM last_month)
    AND payment_date < (SELECT first_day FROM current_month)
)
SELECT 
  cmr.revenue as current_month_revenue,
  lmr.revenue as last_month_revenue,
  CASE 
    WHEN lmr.revenue = 0 THEN 
      CASE WHEN cmr.revenue > 0 THEN 100 ELSE 0 END
    ELSE 
      ROUND(((cmr.revenue - lmr.revenue) / lmr.revenue) * 100, 1)
  END as revenue_growth
FROM current_month_revenue cmr, last_month_revenue lmr;

-- 3. Customer statistics view
CREATE OR REPLACE VIEW customer_stats AS
WITH
customer_count AS (
  SELECT COUNT(*) as total
  FROM profiles
  WHERE role = 'customer'
),
active_customers AS (
  SELECT COUNT(DISTINCT customer_id) as active
  FROM leases
  WHERE status = 'active'
),
last_month_new_customers AS (
  SELECT COUNT(*) as count
  FROM profiles
  WHERE role = 'customer'
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND created_at < DATE_TRUNC('month', CURRENT_DATE)
),
two_months_ago_new_customers AS (
  SELECT COUNT(*) as count
  FROM profiles
  WHERE role = 'customer'
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')
    AND created_at < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
)
SELECT 
  cc.total,
  ac.active,
  CASE 
    WHEN tmanc.count = 0 THEN 
      CASE WHEN lmnc.count > 0 THEN 100 ELSE 0 END
    ELSE 
      ROUND(((lmnc.count - tmanc.count) / tmanc.count) * 100, 1)
  END as growth
FROM customer_count cc, active_customers ac, 
     last_month_new_customers lmnc, 
     two_months_ago_new_customers tmanc;

-- 4. Agreement statistics view
CREATE OR REPLACE VIEW agreement_stats AS
WITH
active_agreements AS (
  SELECT COUNT(*) as active
  FROM leases
  WHERE status = 'active'
),
last_month_new_agreements AS (
  SELECT COUNT(*) as count
  FROM leases
  WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND created_at < DATE_TRUNC('month', CURRENT_DATE)
),
two_months_ago_new_agreements AS (
  SELECT COUNT(*) as count
  FROM leases
  WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')
    AND created_at < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
)
SELECT 
  aa.active,
  CASE 
    WHEN tmana.count = 0 THEN 
      CASE WHEN lmna.count > 0 THEN 100 ELSE 0 END
    ELSE 
      ROUND(((lmna.count - tmana.count) / tmana.count) * 100, 1)
  END as growth
FROM active_agreements aa,
     last_month_new_agreements lmna,
     two_months_ago_new_agreements tmana;

-- 5. Monthly revenue view for charts
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  TO_CHAR(DATE_TRUNC('month', payment_date), 'Mon') as name,
  EXTRACT(YEAR FROM payment_date) as year,
  EXTRACT(MONTH FROM payment_date) as month,
  SUM(amount_paid) as revenue
FROM unified_payments
WHERE payment_date >= CURRENT_DATE - INTERVAL '8 months'
GROUP BY DATE_TRUNC('month', payment_date), 
         EXTRACT(YEAR FROM payment_date), 
         EXTRACT(MONTH FROM payment_date)
ORDER BY year, month;

-- 6. Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
(
  -- Recent leases
  SELECT
    l.id,
    'rental' as type,
    'New Rental' as title,
    CONCAT(p.full_name, ' rented ', v.make, ' ', v.model, ' (', v.license_plate, ')') as description,
    l.created_at as activity_time
  FROM leases l
  JOIN profiles p ON l.customer_id = p.id
  JOIN vehicles v ON l.vehicle_id = v.id
  ORDER BY l.created_at DESC
  LIMIT 3
)
UNION ALL
(
  -- Recent payments
  SELECT
    p.id,
    'payment' as type,
    'Payment Received' as title,
    CONCAT('QAR ', ROUND(p.amount_paid::numeric, 2), ' received for lease #', p.lease_id) as description,
    p.payment_date as activity_time
  FROM unified_payments p
  WHERE p.payment_date IS NOT NULL
  ORDER BY p.payment_date DESC
  LIMIT 3
)
UNION ALL
(
  -- Recent maintenance
  SELECT
    m.id,
    'maintenance' as type,
    'Maintenance Scheduled' as title,
    CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ') scheduled for ', m.maintenance_type) as description,
    m.created_at as activity_time
  FROM maintenance m
  JOIN vehicles v ON m.vehicle_id = v.id
  ORDER BY m.created_at DESC
  LIMIT 2
)
ORDER BY activity_time DESC
LIMIT 5;

-- 7. Create a function to get all dashboard data in one batch
CREATE OR REPLACE FUNCTION get_dashboard_data()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats json;
  v_revenue json;
  v_activity json;
  result json;
BEGIN
  -- Get vehicle stats
  SELECT json_build_object(
    'total', total,
    'available', available,
    'rented', rented,
    'maintenance', maintenance,
    'police_station', police_station,
    'accident', accident,
    'stolen', stolen,
    'reserved', reserved,
    'attention', attention,
    'critical', critical
  ) INTO v_stats
  FROM vehicle_status_stats;
  
  -- Get financial stats
  SELECT json_build_object(
    'currentMonthRevenue', current_month_revenue,
    'lastMonthRevenue', last_month_revenue,
    'revenueGrowth', revenue_growth
  ) INTO v_revenue
  FROM financial_stats;
  
  -- Get customer stats
  SELECT json_build_object(
    'total', c.total,
    'active', c.active,
    'growth', c.growth
  ) INTO v_stats
  FROM customer_stats c;
  
  -- Get agreement stats
  SELECT json_build_object(
    'active', a.active,
    'growth', a.growth
  ) INTO v_stats
  FROM agreement_stats a;
  
  -- Combine all stats
  SELECT json_build_object(
    'vehicleStats', (SELECT row_to_json(vs) FROM vehicle_status_stats vs),
    'financialStats', (SELECT row_to_json(fs) FROM financial_stats fs),
    'customerStats', (SELECT row_to_json(cs) FROM customer_stats cs),
    'agreementStats', (SELECT row_to_json(as) FROM agreement_stats as)
  ) INTO v_stats;
  
  -- Get revenue data
  SELECT json_agg(row_to_json(mr))
  INTO v_revenue
  FROM monthly_revenue mr;
  
  -- Get activity data
  SELECT json_agg(row_to_json(ra))
  INTO v_activity
  FROM recent_activity ra;
  
  -- Build the complete result
  result := json_build_object(
    'stats', v_stats,
    'revenue', v_revenue,
    'activity', v_activity
  );
  
  RETURN result;
END;
$$;

-- 8. Create individual functions for specific data needs

-- Function to get vehicle stats
CREATE OR REPLACE FUNCTION get_vehicle_stats()
RETURNS json
LANGUAGE sql
AS $$
  SELECT row_to_json(vs) FROM vehicle_status_stats vs;
$$;

-- Function to get revenue data
CREATE OR REPLACE FUNCTION get_revenue_data()
RETURNS json
LANGUAGE sql
AS $$
  SELECT json_agg(row_to_json(mr))
  FROM monthly_revenue mr;
$$;

-- Function to get recent activity data
CREATE OR REPLACE FUNCTION get_recent_activity()
RETURNS json
LANGUAGE sql
AS $$
  SELECT json_agg(row_to_json(ra))
  FROM recent_activity ra;
$$;

-- Function to get all financial stats 
CREATE OR REPLACE FUNCTION get_financial_stats()
RETURNS json
LANGUAGE sql
AS $$
  SELECT json_build_object(
    'currentMonthRevenue', current_month_revenue,
    'lastMonthRevenue', last_month_revenue,
    'revenueGrowth', revenue_growth
  )
  FROM financial_stats;
$$;
