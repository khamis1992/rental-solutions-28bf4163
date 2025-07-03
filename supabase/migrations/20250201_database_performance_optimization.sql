-- ============================================
-- تحسينات شاملة لأداء قاعدة البيانات
-- Comprehensive Database Performance Optimization
-- تاريخ الإنشاء: 2025-02-01
-- ============================================

-- =====================================================
-- 1. فهارس محسنة للاستعلامات الشائعة
-- Optimized Indexes for Common Queries
-- =====================================================

-- فهارس للجدول الرئيسي: leases (العقود)
CREATE INDEX IF NOT EXISTS idx_leases_status_created_at ON public.leases(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leases_customer_status ON public.leases(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_leases_vehicle_status ON public.leases(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_leases_agreement_number_lower ON public.leases(LOWER(agreement_number));
CREATE INDEX IF NOT EXISTS idx_leases_date_range ON public.leases(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leases_rent_amount ON public.leases(rent_amount) WHERE rent_amount > 0;

-- فهارس للعملاء: profiles (customers)
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_gin ON public.profiles USING gin(to_tsvector('arabic', full_name));
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_lower ON public.profiles(LOWER(full_name));
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role_created_at ON public.profiles(role, created_at DESC);

-- فهارس للمركبات: vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate_lower ON public.vehicles(LOWER(license_plate));
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_year ON public.vehicles(status, year DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin_unique ON public.vehicles(vin) WHERE vin IS NOT NULL;

-- فهارس للدفعات: unified_payments
CREATE INDEX IF NOT EXISTS idx_payments_lease_status ON public.unified_payments(lease_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_date_status ON public.unified_payments(payment_date, status);
CREATE INDEX IF NOT EXISTS idx_payments_amount_date ON public.unified_payments(amount, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_customer_date ON public.unified_payments(customer_id, payment_date DESC);

-- فهارس للجدولة: payment_schedules
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_status ON public.payment_schedules(due_date, status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_lease_due ON public.payment_schedules(lease_id, due_date);

-- فهارس للصيانة: maintenance
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON public.maintenance(vehicle_id, maintenance_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_type_status ON public.maintenance(maintenance_type, status);

-- فهارس للوثائق: documents
CREATE INDEX IF NOT EXISTS idx_documents_entity_type ON public.documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_date ON public.documents(document_type, created_at DESC);

-- فهارس للسجلات: system_logs (تحسين الموجودة)
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp_desc ON public.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_timestamp ON public.system_logs(level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity_composite ON public.system_logs(entity_type, entity_id, timestamp DESC);

-- =====================================================
-- 2. تحسين استعلامات الـ JOIN المعقدة
-- Optimize Complex JOIN Queries
-- =====================================================

-- دالة محسنة للبحث في العقود مع البيانات المرتبطة
CREATE OR REPLACE FUNCTION get_agreements_with_relations(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_vehicle_id UUID DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  agreement_number VARCHAR,
  status VARCHAR,
  start_date DATE,
  end_date DATE,
  rent_amount NUMERIC,
  deposit_amount NUMERIC,
  customer_id UUID,
  vehicle_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_license_plate TEXT,
  vehicle_year INTEGER,
  total_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_leases AS (
    SELECT 
      l.*,
      COUNT(*) OVER() as total_count
    FROM public.leases l
    WHERE 
      (p_status IS NULL OR l.status = p_status) AND
      (p_customer_id IS NULL OR l.customer_id = p_customer_id) AND
      (p_vehicle_id IS NULL OR l.vehicle_id = p_vehicle_id) AND
      (p_start_date IS NULL OR l.start_date >= p_start_date) AND
      (p_end_date IS NULL OR l.end_date <= p_end_date) AND
      (p_search_term IS NULL OR 
       LOWER(l.agreement_number) LIKE LOWER('%' || p_search_term || '%'))
    ORDER BY l.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT 
    fl.id,
    fl.agreement_number,
    fl.status,
    fl.start_date,
    fl.end_date,
    fl.rent_amount,
    fl.deposit_amount,
    fl.customer_id,
    fl.vehicle_id,
    fl.created_at,
    c.full_name as customer_name,
    c.email as customer_email,
    c.phone_number as customer_phone,
    v.make as vehicle_make,
    v.model as vehicle_model,
    v.license_plate as vehicle_license_plate,
    v.year as vehicle_year,
    fl.total_count
  FROM filtered_leases fl
  LEFT JOIN public.profiles c ON fl.customer_id = c.id
  LEFT JOIN public.vehicles v ON fl.vehicle_id = v.id;
END;
$$;

-- دالة البحث المحسنة للعقود
CREATE OR REPLACE FUNCTION search_agreements_optimized(
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  agreement_number VARCHAR,
  status VARCHAR,
  customer_name TEXT,
  vehicle_info TEXT,
  rent_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  match_type TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  search_lower TEXT := LOWER(p_search_term);
BEGIN
  RETURN QUERY
  WITH all_matches AS (
    -- البحث برقم العقد
    SELECT 
      l.id, l.agreement_number, l.status, l.rent_amount, l.created_at,
      c.full_name as customer_name,
      CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
      'agreement_number'::TEXT as match_type,
      1 as priority
    FROM public.leases l
    LEFT JOIN public.profiles c ON l.customer_id = c.id
    LEFT JOIN public.vehicles v ON l.vehicle_id = v.id
    WHERE LOWER(l.agreement_number) LIKE '%' || search_lower || '%'

    UNION ALL

    -- البحث باسم العميل
    SELECT 
      l.id, l.agreement_number, l.status, l.rent_amount, l.created_at,
      c.full_name as customer_name,
      CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
      'customer_name'::TEXT as match_type,
      2 as priority
    FROM public.leases l
    INNER JOIN public.profiles c ON l.customer_id = c.id
    LEFT JOIN public.vehicles v ON l.vehicle_id = v.id
    WHERE LOWER(c.full_name) LIKE '%' || search_lower || '%'

    UNION ALL

    -- البحث برقم لوحة المركبة
    SELECT 
      l.id, l.agreement_number, l.status, l.rent_amount, l.created_at,
      c.full_name as customer_name,
      CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
      'license_plate'::TEXT as match_type,
      3 as priority
    FROM public.leases l
    LEFT JOIN public.profiles c ON l.customer_id = c.id
    INNER JOIN public.vehicles v ON l.vehicle_id = v.id
    WHERE LOWER(v.license_plate) LIKE '%' || search_lower || '%'
  ),
  ranked_matches AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (PARTITION BY id ORDER BY priority) as rn,
      COUNT(*) OVER() as total_count
    FROM all_matches
  )
  SELECT 
    rm.id,
    rm.agreement_number,
    rm.status,
    rm.customer_name,
    rm.vehicle_info,
    rm.rent_amount,
    rm.created_at,
    rm.match_type,
    rm.total_count
  FROM ranked_matches rm
  WHERE rm.rn = 1
  ORDER BY rm.priority, rm.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- دالة لإحصائيات العقود المحسنة
CREATE OR REPLACE FUNCTION get_agreement_statistics()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  active_count INTEGER;
  expired_count INTEGER;
  pending_count INTEGER;
  total_revenue NUMERIC;
  avg_rent NUMERIC;
  overdue_payments INTEGER;
BEGIN
  -- عد العقود النشطة
  SELECT COUNT(*) INTO active_count
  FROM public.leases 
  WHERE status = 'active';

  -- عد العقود المنتهية
  SELECT COUNT(*) INTO expired_count
  FROM public.leases 
  WHERE status = 'expired' OR end_date < CURRENT_DATE;

  -- عد العقود المعلقة
  SELECT COUNT(*) INTO pending_count
  FROM public.leases 
  WHERE status = 'pending';

  -- حساب إجمالي الإيرادات
  SELECT COALESCE(SUM(rent_amount), 0) INTO total_revenue
  FROM public.leases 
  WHERE status = 'active';

  -- متوسط الإيجار
  SELECT COALESCE(AVG(rent_amount), 0) INTO avg_rent
  FROM public.leases 
  WHERE status = 'active';

  -- الدفعات المتأخرة
  SELECT COUNT(*) INTO overdue_payments
  FROM public.payment_schedules 
  WHERE status = 'overdue' AND due_date < CURRENT_DATE;

  -- بناء JSON النتيجة
  result := json_build_object(
    'active_agreements', active_count,
    'expired_agreements', expired_count,
    'pending_agreements', pending_count,
    'total_revenue', total_revenue,
    'average_rent', avg_rent,
    'overdue_payments', overdue_payments,
    'last_updated', NOW()
  );

  RETURN result;
END;
$$;

-- =====================================================
-- 3. إعداد Connection Pooling المتقدم
-- Advanced Connection Pooling Setup
-- =====================================================

-- تحسين إعدادات PostgreSQL للاتصالات المتعددة
-- NOTE: هذه الإعدادات تحتاج تطبيق على مستوى الخادم في Supabase

-- تكوين إعدادات Connection Pool (للمرجع - يطبق في Supabase Dashboard)
/*
CONNECTION POOL SETTINGS (Apply in Supabase Dashboard):
- Pool Size: 15-20 connections
- Pool Timeout: 30 seconds
- Pool Overflow: 5 connections
- Max Lifetime: 60 minutes
- Idle Timeout: 10 minutes

Database Settings to Optimize:
- max_connections = 100
- shared_buffers = 256MB
- effective_cache_size = 1GB
- work_mem = 4MB
- maintenance_work_mem = 64MB
- checkpoint_completion_target = 0.9
- wal_buffers = 16MB
- default_statistics_target = 100
*/

-- دالة لمراقبة الاتصالات النشطة
CREATE OR REPLACE FUNCTION monitor_connections()
RETURNS TABLE(
  database_name TEXT,
  active_connections BIGINT,
  idle_connections BIGINT,
  waiting_connections BIGINT,
  max_connections INTEGER,
  usage_percentage NUMERIC
)
LANGUAGE sql
AS $$
  SELECT 
    current_database() as database_name,
    COUNT(*) FILTER (WHERE state = 'active') as active_connections,
    COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
    COUNT(*) FILTER (WHERE state = 'idle in transaction') as waiting_connections,
    current_setting('max_connections')::INTEGER as max_connections,
    ROUND(
      (COUNT(*)::NUMERIC / current_setting('max_connections')::NUMERIC) * 100, 
      2
    ) as usage_percentage
  FROM pg_stat_activity
  WHERE pid != pg_backend_pid();
$$;

-- =====================================================
-- 4. إعداد Redis للتخزين المؤقت (التحضير)
-- Redis Cache Setup Preparation
-- =====================================================

-- جدول لإعدادات الكاش
CREATE TABLE IF NOT EXISTS cache_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_type VARCHAR(50) NOT NULL CHECK (cache_type IN ('query', 'result', 'session', 'user')),
  ttl_seconds INTEGER DEFAULT 3600,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج إعدادات الكاش الافتراضية
INSERT INTO cache_settings (cache_key, cache_type, ttl_seconds, description) VALUES
('agreements_list', 'query', 300, 'قائمة العقود - 5 دقائق'),
('customers_list', 'query', 600, 'قائمة العملاء - 10 دقائق'),
('vehicles_list', 'query', 900, 'قائمة المركبات - 15 دقائق'),
('payment_statistics', 'result', 1800, 'إحصائيات الدفعات - 30 دقيقة'),
('agreement_statistics', 'result', 1800, 'إحصائيات العقود - 30 دقيقة'),
('user_permissions', 'user', 7200, 'صلاحيات المستخدم - 2 ساعة'),
('dashboard_data', 'result', 900, 'بيانات لوحة التحكم - 15 دقيقة')
ON CONFLICT (cache_key) DO NOTHING;

-- جدول للكاش المؤقت (fallback عند عدم وجود Redis)
CREATE TABLE IF NOT EXISTS query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للكاش
CREATE INDEX IF NOT EXISTS idx_query_cache_key_expires ON query_cache(cache_key, expires_at);

-- دالة تنظيف الكاش المنتهي الصلاحية
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM query_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- دالة للحصول من الكاش
CREATE OR REPLACE FUNCTION get_from_cache(p_cache_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  cached_data JSONB;
BEGIN
  SELECT cache_data INTO cached_data
  FROM query_cache
  WHERE cache_key = p_cache_key 
    AND expires_at > NOW()
  LIMIT 1;
  
  RETURN cached_data;
END;
$$;

-- دالة لحفظ في الكاش
CREATE OR REPLACE FUNCTION set_cache(
  p_cache_key TEXT,
  p_data JSONB,
  p_ttl_seconds INTEGER DEFAULT 3600
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO query_cache (cache_key, cache_data, expires_at)
  VALUES (p_cache_key, p_data, NOW() + INTERVAL '1 second' * p_ttl_seconds)
  ON CONFLICT (cache_key) DO UPDATE SET
    cache_data = EXCLUDED.cache_data,
    expires_at = EXCLUDED.expires_at,
    created_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- =====================================================
-- 5. Views محسنة للاستعلامات الشائعة
-- Optimized Views for Common Queries
-- =====================================================

-- View للعقود مع البيانات الكاملة
CREATE OR REPLACE VIEW agreements_full_view AS
SELECT 
  l.id,
  l.agreement_number,
  l.status,
  l.start_date,
  l.end_date,
  l.rent_amount,
  l.deposit_amount,
  l.daily_late_fee,
  l.agreement_type,
  l.notes,
  l.created_at,
  l.updated_at,
  c.id as customer_id,
  c.full_name as customer_name,
  c.email as customer_email,
  c.phone_number as customer_phone,
  v.id as vehicle_id,
  v.make as vehicle_make,
  v.model as vehicle_model,
  v.license_plate as vehicle_license_plate,
  v.year as vehicle_year,
  v.color as vehicle_color,
  v.vin as vehicle_vin,
  -- إحصائيات الدفعات
  COALESCE(ps.total_payments, 0) as total_payments,
  COALESCE(ps.paid_amount, 0) as paid_amount,
  COALESCE(ps.overdue_count, 0) as overdue_payments
FROM public.leases l
LEFT JOIN public.profiles c ON l.customer_id = c.id
LEFT JOIN public.vehicles v ON l.vehicle_id = v.id
LEFT JOIN (
  SELECT 
    lease_id,
    COUNT(*) as total_payments,
    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
  FROM public.unified_payments
  GROUP BY lease_id
) ps ON l.id = ps.lease_id;

-- View للإحصائيات السريعة
CREATE OR REPLACE VIEW dashboard_statistics AS
SELECT 
  'agreements' as metric_type,
  json_build_object(
    'total', (SELECT COUNT(*) FROM public.leases),
    'active', (SELECT COUNT(*) FROM public.leases WHERE status = 'active'),
    'expired', (SELECT COUNT(*) FROM public.leases WHERE status = 'expired'),
    'pending', (SELECT COUNT(*) FROM public.leases WHERE status = 'pending')
  ) as data,
  NOW() as last_updated
UNION ALL
SELECT 
  'payments' as metric_type,
  json_build_object(
    'total_amount', (SELECT COALESCE(SUM(amount), 0) FROM public.unified_payments WHERE status = 'paid'),
    'overdue_count', (SELECT COUNT(*) FROM public.payment_schedules WHERE status = 'overdue'),
    'this_month', (SELECT COALESCE(SUM(amount), 0) FROM public.unified_payments 
                   WHERE status = 'paid' AND DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE))
  ) as data,
  NOW() as last_updated
UNION ALL
SELECT 
  'vehicles' as metric_type,
  json_build_object(
    'total', (SELECT COUNT(*) FROM public.vehicles),
    'available', (SELECT COUNT(*) FROM public.vehicles WHERE status = 'available'),
    'rented', (SELECT COUNT(*) FROM public.vehicles WHERE status = 'rented'),
    'maintenance', (SELECT COUNT(*) FROM public.vehicles WHERE status = 'maintenance')
  ) as data,
  NOW() as last_updated;

-- =====================================================
-- 6. مراقبة الأداء والتحليل
-- Performance Monitoring and Analysis
-- =====================================================

-- جدول لمراقبة أداء الاستعلامات
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name VARCHAR(255) NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  row_count INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  parameters JSONB
);

-- فهرس لمراقبة الأداء
CREATE INDEX IF NOT EXISTS idx_query_performance_name_time ON query_performance_log(query_name, executed_at DESC);

-- دالة لتسجيل أداء الاستعلام
CREATE OR REPLACE FUNCTION log_query_performance(
  p_query_name TEXT,
  p_execution_time INTEGER,
  p_row_count INTEGER DEFAULT NULL,
  p_cache_hit BOOLEAN DEFAULT FALSE,
  p_user_id UUID DEFAULT NULL,
  p_parameters JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO query_performance_log (
    query_name, execution_time_ms, row_count, cache_hit, user_id, parameters
  ) VALUES (
    p_query_name, p_execution_time, p_row_count, p_cache_hit, p_user_id, p_parameters
  );
END;
$$;

-- دالة لتحليل أداء الاستعلامات
CREATE OR REPLACE FUNCTION analyze_query_performance(
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  query_name TEXT,
  avg_execution_time NUMERIC,
  max_execution_time INTEGER,
  min_execution_time INTEGER,
  total_executions BIGINT,
  cache_hit_rate NUMERIC,
  avg_row_count NUMERIC
)
LANGUAGE sql
AS $$
  SELECT 
    qpl.query_name,
    ROUND(AVG(qpl.execution_time_ms), 2) as avg_execution_time,
    MAX(qpl.execution_time_ms) as max_execution_time,
    MIN(qpl.execution_time_ms) as min_execution_time,
    COUNT(*) as total_executions,
    ROUND(
      (COUNT(*) FILTER (WHERE qpl.cache_hit = true)::NUMERIC / COUNT(*)) * 100, 
      2
    ) as cache_hit_rate,
    ROUND(AVG(qpl.row_count), 2) as avg_row_count
  FROM query_performance_log qpl
  WHERE qpl.executed_at > NOW() - INTERVAL '1 hour' * p_hours
  GROUP BY qpl.query_name
  ORDER BY avg_execution_time DESC;
$$;

-- =====================================================
-- 7. إعدادات النظام المحسنة
-- Optimized System Settings
-- =====================================================

-- تحديث إحصائيات الجداول
ANALYZE public.leases;
ANALYZE public.profiles;
ANALYZE public.vehicles;
ANALYZE public.unified_payments;
ANALYZE public.payment_schedules;
ANALYZE public.maintenance;
ANALYZE public.documents;

-- إنشاء وظيفة تنظيف دورية
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- تنظيف الكاش المنتهي الصلاحية
  PERFORM cleanup_expired_cache();
  
  -- تنظيف سجلات الأداء القديمة (أكثر من 30 يوم)
  DELETE FROM query_performance_log 
  WHERE executed_at < NOW() - INTERVAL '30 days';
  
  -- تحديث إحصائيات الجداول الرئيسية
  ANALYZE public.leases;
  ANALYZE public.profiles;
  ANALYZE public.vehicles;
  ANALYZE public.unified_payments;
  
  -- تسجيل إتمام الصيانة
  INSERT INTO public.system_logs (
    level, event_type, entity_type, message, details
  ) VALUES (
    'info', 'system_operation', 'system', 
    'Daily maintenance completed successfully',
    json_build_object(
      'cache_cleaned', true,
      'performance_logs_cleaned', true,
      'tables_analyzed', true,
      'timestamp', NOW()
    )
  );
END;
$$;

-- =====================================================
-- التعليقات والتوثيق
-- Comments and Documentation
-- =====================================================

COMMENT ON FUNCTION get_agreements_with_relations IS 'استعلام محسن للحصول على العقود مع البيانات المرتبطة';
COMMENT ON FUNCTION search_agreements_optimized IS 'بحث محسن في العقود باستخدام فهارس متقدمة';
COMMENT ON FUNCTION get_agreement_statistics IS 'حساب إحصائيات العقود بشكل محسن';
COMMENT ON FUNCTION monitor_connections IS 'مراقبة الاتصالات النشطة بقاعدة البيانات';
COMMENT ON FUNCTION log_query_performance IS 'تسجيل أداء الاستعلامات لمراقبة الأداء';
COMMENT ON FUNCTION daily_maintenance IS 'صيانة دورية يومية لقاعدة البيانات';

COMMENT ON TABLE cache_settings IS 'إعدادات التخزين المؤقت للاستعلامات';
COMMENT ON TABLE query_cache IS 'تخزين مؤقت للاستعلامات عند عدم وجود Redis';
COMMENT ON TABLE query_performance_log IS 'سجل أداء الاستعلامات لمراقبة الأداء';

COMMENT ON VIEW agreements_full_view IS 'عرض شامل للعقود مع جميع البيانات المرتبطة';
COMMENT ON VIEW dashboard_statistics IS 'إحصائيات سريعة للوحة التحكم';

-- إنهاء Migration
SELECT 'Database performance optimization completed successfully' as status; 