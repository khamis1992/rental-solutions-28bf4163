-- Create Legal Management System Tables
-- Author: AI Assistant
-- Date: 2025-06-14
-- Purpose: Support automatic detection of unpaid obligations and legal case management

-- Legal Cases Table
CREATE TABLE IF NOT EXISTS legal_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    case_number TEXT UNIQUE NOT NULL,
    case_type TEXT NOT NULL CHECK (case_type IN ('payment_collection', 'traffic_fine_collection', 'contract_breach', 'other')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_payment', 'resolved', 'closed')),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    documents TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Legal Templates Table
CREATE TABLE IF NOT EXISTS legal_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('demand_letter', 'court_notice', 'settlement_offer', 'payment_reminder', 'legal_notice')),
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Legal Documents Table
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES legal_templates(id) ON DELETE RESTRICT,
    document_type TEXT NOT NULL,
    content TEXT NOT NULL,
    file_path TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_via TEXT CHECK (sent_via IN ('email', 'post', 'hand_delivery')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_legal_cases_customer_id ON legal_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON legal_cases(status);
CREATE INDEX IF NOT EXISTS idx_legal_cases_priority ON legal_cases(priority);
CREATE INDEX IF NOT EXISTS idx_legal_cases_case_type ON legal_cases(case_type);
CREATE INDEX IF NOT EXISTS idx_legal_cases_created_at ON legal_cases(created_at);

CREATE INDEX IF NOT EXISTS idx_legal_templates_type ON legal_templates(type);
CREATE INDEX IF NOT EXISTS idx_legal_templates_is_active ON legal_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_legal_documents_case_id ON legal_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_template_id ON legal_documents(template_id);

-- Row Level Security (RLS)
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legal_cases
CREATE POLICY "legal_cases_select_policy" ON legal_cases
    FOR SELECT USING (true);

CREATE POLICY "legal_cases_insert_policy" ON legal_cases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "legal_cases_update_policy" ON legal_cases
    FOR UPDATE USING (true);

CREATE POLICY "legal_cases_delete_policy" ON legal_cases
    FOR DELETE USING (true);

-- RLS Policies for legal_templates
CREATE POLICY "legal_templates_select_policy" ON legal_templates
    FOR SELECT USING (true);

CREATE POLICY "legal_templates_insert_policy" ON legal_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "legal_templates_update_policy" ON legal_templates
    FOR UPDATE USING (true);

CREATE POLICY "legal_templates_delete_policy" ON legal_templates
    FOR DELETE USING (true);

-- RLS Policies for legal_documents
CREATE POLICY "legal_documents_select_policy" ON legal_documents
    FOR SELECT USING (true);

CREATE POLICY "legal_documents_insert_policy" ON legal_documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "legal_documents_update_policy" ON legal_documents
    FOR UPDATE USING (true);

CREATE POLICY "legal_documents_delete_policy" ON legal_documents
    FOR DELETE USING (true);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_legal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_legal_cases_updated_at
    BEFORE UPDATE ON legal_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_legal_updated_at();

CREATE TRIGGER update_legal_templates_updated_at
    BEFORE UPDATE ON legal_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_legal_updated_at();

-- Insert default legal templates
INSERT INTO legal_templates (name, type, content, variables) VALUES
(
    'Payment Demand Letter',
    'demand_letter',
    'السيد/ة {{customer_name}} المحترم/ة،

نحيطكم علماً بأن لديكم مبلغ مستحق قدره {{amount_owed}} ريال قطري عن عقد الإيجار رقم {{agreement_number}}.

تاريخ الاستحقاق: {{due_date}}
عدد الأيام المتأخرة: {{days_overdue}} يوم

يرجى سداد المبلغ في أقرب وقت ممكن لتجنب اتخاذ الإجراءات القانونية اللازمة.

مع التقدير،
إدارة الشركة',
    ARRAY['customer_name', 'amount_owed', 'agreement_number', 'due_date', 'days_overdue']
),
(
    'Traffic Fine Notice',
    'payment_reminder',
    'السيد/ة {{customer_name}} المحترم/ة،

نحيطكم علماً بوجود مخالفة مرورية مستحقة السداد:

رقم المخالفة: {{violation_number}}
رقم اللوحة: {{license_plate}}
تاريخ المخالفة: {{violation_date}}
مبلغ الغرامة: {{fine_amount}} ريال قطري
عدد الأيام المتأخرة: {{days_overdue}} يوم

يرجى سداد الغرامة في أقرب وقت ممكن.

مع التقدير،
إدارة الشركة',
    ARRAY['customer_name', 'violation_number', 'license_plate', 'violation_date', 'fine_amount', 'days_overdue']
),
(
    'Final Legal Notice',
    'legal_notice',
    'السيد/ة {{customer_name}} المحترم/ة،

هذا إنذار نهائي بخصوص المبلغ المستحق قدره {{total_amount}} ريال قطري.

في حالة عدم السداد خلال 7 أيام من تاريخ هذا الإنذار، سيتم اتخاذ الإجراءات القانونية اللازمة ضدكم.

مع التقدير،
الإدارة القانونية
{{company_name}}',
    ARRAY['customer_name', 'total_amount', 'company_name']
);

-- Grant permissions
GRANT ALL ON legal_cases TO authenticated;
GRANT ALL ON legal_templates TO authenticated;
GRANT ALL ON legal_documents TO authenticated; 