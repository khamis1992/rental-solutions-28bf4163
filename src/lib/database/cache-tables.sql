-- ============================================
-- جداول التخزين المؤقت ومراقبة الأداء
-- Cache Tables and Performance Monitoring
-- ============================================

-- جدول التخزين المؤقت للاستعلامات
CREATE TABLE IF NOT EXISTS query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس الكاش
CREATE INDEX IF NOT EXISTS idx_query_cache_key ON query_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_query_cache_expires ON query_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_query_cache_created ON query_cache(created_at DESC);

-- جدول إعدادات الكاش
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
('agreements:list', 'query', 300, 'قائمة العقود - 5 دقائق'),
('customers:list', 'query', 600, 'قائمة العملاء - 10 دقائق'),
('vehicles:list', 'query', 900, 'قائمة المركبات - 15 دقيقة'),
('stats:payments', 'result', 1800, 'إحصائيات الدفعات - 30 دقيقة'),
('stats:agreements', 'result', 1800, 'إحصائيات العقود - 30 دقيقة'),
('user:permissions', 'user', 7200, 'صلاحيات المستخدم - 2 ساعة'),
('dashboard:data', 'result', 900, 'بيانات لوحة التحكم - 15 دقيقة')
ON CONFLICT (cache_key) DO NOTHING;

-- جدول مراقبة أداء الاستعلامات
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name VARCHAR(255) NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  row_count INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  parameters JSONB,
  error_message TEXT
);

-- فهارس الأداء
CREATE INDEX IF NOT EXISTS idx_query_performance_name ON query_performance_log(query_name);
CREATE INDEX IF NOT EXISTS idx_query_performance_time ON query_performance_log(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_slow ON query_performance_log(execution_time_ms DESC);

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
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

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

-- دالة لمراقبة الاتصالات
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

-- دالة تنظيف دورية
CREATE OR REPLACE FUNCTION daily_cache_maintenance()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- تنظيف الكاش المنتهي الصلاحية
  PERFORM cleanup_expired_cache();
  
  -- تنظيف سجلات الأداء القديمة (أكثر من 30 يوم)
  DELETE FROM query_performance_log 
  WHERE executed_at < NOW() - INTERVAL '30 days';
  
  -- تسجيل إتمام الصيانة
  INSERT INTO public.system_logs (
    level, event_type, entity_type, message, details
  ) VALUES (
    'info', 'system_operation', 'system', 
    'Cache maintenance completed successfully',
    json_build_object(
      'cache_cleaned', true,
      'performance_logs_cleaned', true,
      'timestamp', NOW()
    )
  );
END;
$$;

-- التعليقات
COMMENT ON TABLE query_cache IS 'تخزين مؤقت للاستعلامات عند عدم وجود Redis';
COMMENT ON TABLE cache_settings IS 'إعدادات التخزين المؤقت للاستعلامات';
COMMENT ON TABLE query_performance_log IS 'سجل أداء الاستعلامات لمراقبة الأداء';

COMMENT ON FUNCTION cleanup_expired_cache IS 'تنظيف الكاش المنتهي الصلاحية';
COMMENT ON FUNCTION get_from_cache IS 'الحصول من الكاش';
COMMENT ON FUNCTION set_cache IS 'حفظ في الكاش';
COMMENT ON FUNCTION log_query_performance IS 'تسجيل أداء الاستعلامات';
COMMENT ON FUNCTION monitor_connections IS 'مراقبة الاتصالات النشطة';
COMMENT ON FUNCTION daily_cache_maintenance IS 'صيانة دورية للكاش'; 