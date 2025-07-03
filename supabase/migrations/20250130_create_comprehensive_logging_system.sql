-- إنشاء نظام التسجيل الشامل
-- Comprehensive Logging System Migration

-- إنشاء جدول السجلات الشاملة
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'user_action', 'system_operation', 'database_operation', 'api_call',
        'authentication', 'payment', 'maintenance', 'legal', 'notification',
        'reporting', 'security', 'performance', 'error', 'audit'
    )),
    entity_type VARCHAR(50) CHECK (entity_type IN (
        'customer', 'vehicle', 'agreement', 'payment', 'maintenance',
        'user', 'system', 'report', 'notification', 'legal_case'
    )),
    entity_id VARCHAR(255),
    user_id UUID,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    component VARCHAR(255),
    operation VARCHAR(255),
    message TEXT NOT NULL,
    details JSONB,
    metadata JSONB,
    error_code VARCHAR(100),
    error_stack TEXT,
    request_id VARCHAR(255),
    duration_ms INTEGER,
    status VARCHAR(20) CHECK (status IN ('success', 'warning', 'error')),
    source VARCHAR(255),
    environment VARCHAR(50),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity_type ON system_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity_id ON system_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_session_id ON system_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_operation ON system_logs(operation);
CREATE INDEX IF NOT EXISTS idx_system_logs_status ON system_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_environment ON system_logs(environment);

-- فهرس مركب للبحث السريع
CREATE INDEX IF NOT EXISTS idx_system_logs_level_event_type ON system_logs(level, event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp_level ON system_logs(timestamp, level);

-- فهرس GIN للبحث في JSON
CREATE INDEX IF NOT EXISTS idx_system_logs_details_gin ON system_logs USING gin(details);
CREATE INDEX IF NOT EXISTS idx_system_logs_metadata_gin ON system_logs USING gin(metadata);

-- إنشاء جدول للتنبيهات
CREATE TABLE IF NOT EXISTS log_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    condition_level VARCHAR(20) CHECK (condition_level IN ('debug', 'info', 'warn', 'error', 'critical')),
    condition_event_type VARCHAR(50),
    condition_message_pattern TEXT,
    condition_threshold INTEGER DEFAULT 1,
    condition_timeframe_minutes INTEGER DEFAULT 60,
    action_email TEXT[],
    action_webhook TEXT,
    action_console BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول لتاريخ التنبيهات
CREATE TABLE IF NOT EXISTS log_alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES log_alerts(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    condition_met TEXT,
    log_entries_count INTEGER,
    action_taken TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- دالة لحساب الإحصائيات
CREATE OR REPLACE FUNCTION get_log_statistics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    level_stats JSON;
    event_stats JSON;
    recent_errors JSON;
    slow_ops JSON;
    total_count INTEGER;
    error_count INTEGER;
    avg_duration NUMERIC;
BEGIN
    -- إجمالي السجلات
    SELECT COUNT(*) INTO total_count
    FROM system_logs
    WHERE timestamp BETWEEN start_date AND end_date;
    
    -- عدد الأخطاء
    SELECT COUNT(*) INTO error_count
    FROM system_logs
    WHERE timestamp BETWEEN start_date AND end_date
    AND level IN ('error', 'critical');
    
    -- متوسط الاستجابة
    SELECT AVG(duration_ms) INTO avg_duration
    FROM system_logs
    WHERE timestamp BETWEEN start_date AND end_date
    AND duration_ms IS NOT NULL;
    
    -- احصائيات حسب المستوى
    SELECT json_object_agg(level, count)
    INTO level_stats
    FROM (
        SELECT level, COUNT(*) as count
        FROM system_logs
        WHERE timestamp BETWEEN start_date AND end_date
        GROUP BY level
    ) level_counts;
    
    -- احصائيات حسب نوع الحدث
    SELECT json_object_agg(event_type, count)
    INTO event_stats
    FROM (
        SELECT event_type, COUNT(*) as count
        FROM system_logs
        WHERE timestamp BETWEEN start_date AND end_date
        GROUP BY event_type
    ) event_counts;
    
    -- الأخطاء الأخيرة
    SELECT json_agg(row_to_json(t))
    INTO recent_errors
    FROM (
        SELECT id, timestamp, level, event_type, message, details
        FROM system_logs
        WHERE timestamp BETWEEN start_date AND end_date
        AND level IN ('error', 'critical')
        ORDER BY timestamp DESC
        LIMIT 10
    ) t;
    
    -- أبطأ العمليات
    SELECT json_agg(row_to_json(t))
    INTO slow_ops
    FROM (
        SELECT 
            operation,
            ROUND(AVG(duration_ms), 2) as avg_duration,
            COUNT(*) as count
        FROM system_logs
        WHERE timestamp BETWEEN start_date AND end_date
        AND duration_ms IS NOT NULL
        AND operation IS NOT NULL
        GROUP BY operation
        ORDER BY avg_duration DESC
        LIMIT 10
    ) t;
    
    -- بناء النتيجة
    result := json_build_object(
        'total_logs', total_count,
        'error_count', error_count,
        'error_rate', CASE WHEN total_count > 0 THEN error_count::FLOAT / total_count * 100 ELSE 0 END,
        'avg_response_time', COALESCE(avg_duration, 0),
        'logs_by_level', COALESCE(level_stats, '{}'),
        'logs_by_event_type', COALESCE(event_stats, '{}'),
        'recent_errors', COALESCE(recent_errors, '[]'),
        'slowest_operations', COALESCE(slow_ops, '[]')
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- دالة لتنظيف السجلات القديمة
CREATE OR REPLACE FUNCTION cleanup_old_logs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM system_logs
    WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- تسجيل عملية التنظيف
    INSERT INTO system_logs (
        level, event_type, message, details, operation, component
    ) VALUES (
        'info', 'system_operation', 'Cleaned up old logs',
        json_build_object(
            'deleted_count', deleted_count,
            'retention_days', retention_days
        ),
        'cleanup_logs', 'system'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- إنشاء سياسات الأمان (RLS)
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_alert_history ENABLE ROW LEVEL SECURITY;

-- سياسة للمشرفين (يمكنهم رؤية جميع السجلات)
CREATE POLICY "Admins can view all logs" ON system_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- سياسة للمستخدمين العاديين (يمكنهم رؤية سجلاتهم الشخصية فقط)
CREATE POLICY "Users can view their own logs" ON system_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- سياسة للإدراج (يمكن لأي مستخدم مصدق إدراج السجلات)
CREATE POLICY "Authenticated users can insert logs" ON system_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- سياسة للتنبيهات (المشرفون فقط)
CREATE POLICY "Admins can manage alerts" ON log_alerts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- سياسة تاريخ التنبيهات (المشرفون فقط)
CREATE POLICY "Admins can view alert history" ON log_alert_history
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- إنشاء view للإحصائيات السريعة
CREATE OR REPLACE VIEW log_stats_hourly AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    level,
    event_type,
    COUNT(*) as log_count,
    AVG(duration_ms) as avg_duration,
    COUNT(CASE WHEN level IN ('error', 'critical') THEN 1 END) as error_count
FROM system_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), level, event_type
ORDER BY hour DESC;

-- إنشاء view للأخطاء الأكثر تكراراً
CREATE OR REPLACE VIEW top_errors AS
SELECT 
    message,
    COUNT(*) as error_count,
    MAX(timestamp) as last_occurrence,
    error_code,
    component,
    operation
FROM system_logs
WHERE level IN ('error', 'critical')
AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY message, error_code, component, operation
ORDER BY error_count DESC
LIMIT 50;

-- إنشاء بيانات تجريبية
INSERT INTO system_logs (
    level, event_type, entity_type, message, details, component, operation
) VALUES 
    ('info', 'system_operation', 'system', 'Comprehensive logging system initialized', 
     '{"version": "1.0.0", "features": ["database_logging", "real_time_alerts", "statistics"]}', 
     'logging_service', 'initialize'),
    ('info', 'database_operation', 'system', 'Database tables created successfully', 
     '{"tables": ["system_logs", "log_alerts", "log_alert_history"]}', 
     'database_migration', 'create_tables'),
    ('info', 'system_operation', 'system', 'Logging service ready for production', 
     '{"status": "ready", "environment": "production"}', 
     'logging_service', 'ready');

-- إنشاء تنبيهات افتراضية
INSERT INTO log_alerts (name, description, condition_level, condition_threshold, condition_timeframe_minutes, action_console) VALUES
    ('Critical Error Alert', 'تنبيه للأخطاء الحرجة', 'critical', 1, 5, true),
    ('High Error Rate Alert', 'تنبيه لمعدل أخطاء مرتفع', 'error', 10, 60, true),
    ('Database Operation Failures', 'تنبيه لفشل عمليات قاعدة البيانات', 'error', 5, 30, true);

-- تعليقات توضيحية
COMMENT ON TABLE system_logs IS 'جدول السجلات الشاملة لتتبع جميع الأحداث والأخطاء في النظام';
COMMENT ON COLUMN system_logs.level IS 'مستوى الخطورة: debug, info, warn, error, critical';
COMMENT ON COLUMN system_logs.event_type IS 'نوع الحدث: user_action, system_operation, database_operation, api_call, etc.';
COMMENT ON COLUMN system_logs.entity_type IS 'نوع الكيان المرتبط: customer, vehicle, agreement, payment, etc.';
COMMENT ON COLUMN system_logs.duration_ms IS 'مدة تنفيذ العملية بالميلي ثانية';
COMMENT ON COLUMN system_logs.details IS 'تفاصيل إضافية بصيغة JSON';
COMMENT ON COLUMN system_logs.metadata IS 'بيانات وصفية بصيغة JSON';

COMMENT ON TABLE log_alerts IS 'جدول تكوين التنبيهات لمراقبة السجلات';
COMMENT ON TABLE log_alert_history IS 'جدول تاريخ التنبيهات المُرسلة'; 