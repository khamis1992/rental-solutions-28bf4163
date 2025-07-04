-- ===================================================================
-- نظام تحسين شامل لإدارة إيجار السيارات
-- تاريخ الإنشاء: 2025-01-31
-- الهدف: تحسين الأمان والأداء والتكامل
-- ===================================================================

-- 1. إنشاء جداول إدارة الأمان
-- ===================================================================

-- جدول سجلات الأمان
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'data_access', 'data_modification', 'suspicious_activity')),
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول تنبيهات الإدارة
CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('security', 'financial', 'operational', 'maintenance', 'legal')),
    level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء جداول إدارة المبيعات
-- ===================================================================

-- جدول العملاء المحتملين
CREATE TABLE IF NOT EXISTS sales_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT NOT NULL CHECK (source IN ('website', 'referral', 'marketing', 'walk_in', 'call')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost')),
    interested_vehicle_type TEXT,
    budget_range TEXT,
    rental_duration TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    follow_up_date TIMESTAMPTZ,
    conversion_probability INTEGER DEFAULT 20 CHECK (conversion_probability >= 0 AND conversion_probability <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الفرص التجارية
CREATE TABLE IF NOT EXISTS sales_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES sales_leads(id),
    vehicle_id UUID REFERENCES vehicles(id),
    customer_id UUID REFERENCES profiles(id),
    estimated_value DECIMAL(12,2) NOT NULL,
    probability INTEGER DEFAULT 20 CHECK (probability >= 0 AND probability <= 100),
    stage TEXT NOT NULL DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closing', 'won', 'lost')),
    expected_close_date DATE,
    actual_close_date DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول أهداف المبيعات
CREATE TABLE IF NOT EXISTS sales_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period TEXT NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
    target_amount DECIMAL(12,2) NOT NULL,
    achieved_amount DECIMAL(12,2) DEFAULT 0,
    target_count INTEGER NOT NULL,
    achieved_count INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    assigned_to UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'missed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المهام
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    due_date TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    type TEXT CHECK (type IN ('follow_up', 'maintenance', 'legal', 'administrative')),
    reference_id UUID,
    reference_type TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تحسين جدول المعاملات المالية
-- ===================================================================

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'QAR',
    date TIMESTAMPTZ NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type TEXT CHECK (reference_type IN ('agreement', 'vehicle', 'customer', 'maintenance')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'check', 'system')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الميزانيات
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    allocated_amount DECIMAL(12,2) NOT NULL,
    spent_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) NOT NULL,
    period TEXT NOT NULL,
    status TEXT DEFAULT 'within_budget' CHECK (status IN ('within_budget', 'warning', 'exceeded')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الفواتير
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    agreement_id UUID REFERENCES leases(id),
    customer_id UUID REFERENCES profiles(id),
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. تحسين إدارة الوثائق القانونية
-- ===================================================================

-- إضافة أعمدة جديدة للقضايا القانونية إذا لم تكن موجودة
ALTER TABLE legal_cases 
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 5. إنشاء الفهارس لتحسين الأداء
-- ===================================================================

-- فهارس سجلات الأمان
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_risk_level ON security_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);

-- فهارس المبيعات
CREATE INDEX IF NOT EXISTS idx_sales_leads_assigned_to ON sales_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_created_at ON sales_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_stage ON sales_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_created_by ON sales_opportunities(created_by);

-- فهارس المعاملات المالية
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON financial_transactions(reference_id, reference_type);

-- فهارس التنبيهات
CREATE INDEX IF NOT EXISTS idx_admin_alerts_type ON admin_alerts(type);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_level ON admin_alerts(level);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_resolved ON admin_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_created_at ON admin_alerts(created_at);

-- فهارس المهام
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);

-- 6. تحديث سياسات الأمان (RLS)
-- ===================================================================

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمستخدمين المصرح لهم
CREATE POLICY "Allow authenticated users to view security events" ON security_events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage admin alerts" ON admin_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Allow sales team to manage leads" ON sales_leads
    FOR ALL USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager', 'sales')
        )
    );

CREATE POLICY "Allow users to view their opportunities" ON sales_opportunities
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Allow managers to view financial transactions" ON financial_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager', 'accountant')
        )
    );

CREATE POLICY "Allow users to view their tasks" ON tasks
    FOR SELECT USING (
        assigned_to = auth.uid() OR 
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- 7. إنشاء الدوال المساعدة
-- ===================================================================

-- دالة لحساب النمو المئوي
CREATE OR REPLACE FUNCTION calculate_percentage_growth(previous_value DECIMAL, current_value DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF previous_value = 0 THEN
        RETURN CASE WHEN current_value > 0 THEN 100 ELSE 0 END;
    END IF;
    RETURN ((current_value - previous_value) / previous_value) * 100;
END;
$$ LANGUAGE plpgsql;

-- دالة لتنظيف البيانات القديمة
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_events 
    WHERE timestamp < NOW() - INTERVAL '365 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب معدل استغلال المركبات
CREATE OR REPLACE FUNCTION calculate_vehicle_utilization()
RETURNS DECIMAL AS $$
DECLARE
    total_vehicles INTEGER;
    active_agreements INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_vehicles FROM vehicles;
    SELECT COUNT(*) INTO active_agreements FROM leases WHERE status = 'active';
    
    IF total_vehicles = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN (active_agreements::DECIMAL / total_vehicles::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب كفاءة الدفع
CREATE OR REPLACE FUNCTION calculate_payment_efficiency()
RETURNS DECIMAL AS $$
DECLARE
    total_payments INTEGER;
    overdue_payments INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_payments FROM unified_payments;
    SELECT COUNT(*) INTO overdue_payments 
    FROM unified_payments 
    WHERE status = 'pending' AND due_date < NOW();
    
    IF total_payments = 0 THEN
        RETURN 100;
    END IF;
    
    RETURN 100 - ((overdue_payments::DECIMAL / total_payments::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql;

-- 8. إنشاء المشاهد (Views) للتقارير
-- ===================================================================

-- مشهد لملخص الأداء المالي
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_profit,
    COUNT(*) as transaction_count
FROM financial_transactions 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- مشهد لملخص المبيعات
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_leads,
    COUNT(CASE WHEN status = 'closed_won' THEN 1 END) as won_leads,
    COUNT(CASE WHEN status = 'closed_lost' THEN 1 END) as lost_leads,
    ROUND(
        (COUNT(CASE WHEN status = 'qualified' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
        2
    ) as conversion_rate
FROM sales_leads
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- مشهد لملخص المركبات
CREATE OR REPLACE VIEW vehicle_summary AS
SELECT 
    status,
    COUNT(*) as count,
    ROUND(
        (COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM vehicles)::DECIMAL) * 100, 
        2
    ) as percentage
FROM vehicles
GROUP BY status;

-- 9. إنشاء المحفزات (Triggers) للتحديث التلقائي
-- ===================================================================

-- محفز لتحديث وقت التعديل
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق المحفز على الجداول المناسبة
CREATE TRIGGER update_sales_leads_updated_at 
    BEFORE UPDATE ON sales_leads
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sales_opportunities_updated_at 
    BEFORE UPDATE ON sales_opportunities
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at 
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 10. إدراج البيانات التجريبية (اختياري)
-- ===================================================================

-- إدراج فئات المعاملات المالية الافتراضية
INSERT INTO financial_transactions (type, category, amount, currency, date, description, payment_method, status, created_by)
SELECT 'income', 'Initial Setup', 0, 'QAR', NOW(), 'System initialization', 'system', 'completed', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM financial_transactions WHERE description = 'System initialization')
AND auth.uid() IS NOT NULL;

-- 11. منح الصلاحيات
-- ===================================================================

-- منح صلاحيات القراءة والكتابة للمستخدمين المصرح لهم
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 12. تحليل الجداول لتحسين الأداء
-- ===================================================================

ANALYZE security_events;
ANALYZE admin_alerts;
ANALYZE sales_leads;
ANALYZE sales_opportunities;
ANALYZE sales_targets;
ANALYZE tasks;
ANALYZE financial_transactions;
ANALYZE budgets;
ANALYZE invoices;

-- 13. إنشاء تنبيه نجاح التطبيق
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE 'تم تطبيق تحسينات النظام بنجاح! جميع الجداول والفهارس والدوال تم إنشاؤها.';
    RAISE NOTICE 'النظام الآن محسن للأمان والأداء والتكامل الشامل.';
END $$;