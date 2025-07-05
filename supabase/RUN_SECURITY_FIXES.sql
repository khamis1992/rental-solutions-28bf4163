-- =====================================================
-- تشغيل جميع إصلاحات Security Advisor
-- =====================================================
-- هذا الملف يحتوي على جميع الإصلاحات مجمعة في مكان واحد
-- يمكن تشغيله في SQL Editor في Supabase Dashboard

-- ملاحظة مهمة: تأكد من عمل نسخة احتياطية قبل التشغيل!

-- =====================================================
-- STEP 1: إصلاحات RLS الأساسية
-- =====================================================

BEGIN;

-- تفعيل RLS على الجداول الأساسية
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_payments ENABLE ROW LEVEL SECURITY;

-- إنشاء دوال auth محسنة
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT (SELECT auth.jwt()) ->> 'role';
$$;

CREATE OR REPLACE FUNCTION auth.get_current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT (SELECT auth.uid());
$$;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Admins can manage all leases" ON public.leases;
DROP POLICY IF EXISTS "Portal users can view their agreements" ON public.leases;

-- إنشاء سياسات آمنة للجداول الأساسية
CREATE POLICY "customers_secure_access" ON public.customers
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND 
  auth.get_user_role() IN ('admin', 'manager', 'employee')
);

CREATE POLICY "vehicles_secure_access" ON public.vehicles
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND 
  auth.get_user_role() IN ('admin', 'manager', 'employee')
);

CREATE POLICY "leases_secure_access" ON public.leases
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager', 'employee') OR
    (auth.get_user_role() = 'customer' AND customer_id = auth.get_current_user_id())
  )
);

CREATE POLICY "payments_secure_access" ON public.unified_payments
FOR ALL USING (
  auth.get_current_user_id() IS NOT NULL AND (
    auth.get_user_role() IN ('admin', 'manager', 'employee') OR
    (auth.get_user_role() = 'customer' AND 
     lease_id IN (SELECT id FROM public.leases WHERE customer_id = auth.get_current_user_id()))
  )
);

COMMIT;

-- =====================================================
-- STEP 2: إصلاحات الجداول الإضافية
-- =====================================================

BEGIN;

-- تفعيل RLS على الجداول الإضافية
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.traffic_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.error_logs ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة المشكلة
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.documents;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.maintenance;

-- إنشاء سياسات آمنة
CREATE POLICY "documents_secure" ON public.documents
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "whatsapp_secure" ON public.whatsapp_messages  
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "maintenance_secure" ON public.maintenance
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "traffic_fines_secure" ON public.traffic_fines
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "error_logs_admin" ON public.error_logs
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')
);

COMMIT;

-- =====================================================
-- STEP 3: إصلاحات النظام والقوالب
-- =====================================================

BEGIN;

-- تفعيل RLS على جداول النظام
ALTER TABLE IF EXISTS public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.word_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_templates ENABLE ROW LEVEL SECURITY;

-- سياسات للجداول الشخصية
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions
FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "api_keys_own" ON public.api_keys  
FOR ALL USING (user_id = (SELECT auth.uid()));

-- سياسات القوالب لمستخدمي الأعمال
CREATE POLICY "templates_business_users" ON public.word_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "email_templates_business" ON public.email_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "invoice_templates_business" ON public.invoice_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

COMMIT;

-- =====================================================
-- STEP 4: إزالة الفهارس المكررة
-- =====================================================

BEGIN;

-- إزالة الفهارس المكررة حسب تقرير Linting
DROP INDEX IF EXISTS public.idx_automation_rules_trigger_type;
DROP INDEX IF EXISTS public.leases_agreement_number_key;
DROP INDEX IF EXISTS public.idx_master_sheet_agreement;

-- إزالة فهارس مكررة أخرى محتملة
DROP INDEX IF EXISTS public.idx_vehicles_license_plate_dup;
DROP INDEX IF EXISTS public.idx_customers_email_dup;
DROP INDEX IF EXISTS public.idx_payments_reference_dup;

-- إنشاء فهارس محسنة للاستعلامات الأمنية
CREATE INDEX IF NOT EXISTS idx_leases_auth_optimized ON public.leases(customer_id, id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_auth_optimized ON public.unified_payments(lease_id, id) WHERE lease_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_auth_optimized ON public.documents(uploaded_by, id) WHERE uploaded_by IS NOT NULL;

COMMIT;

-- =====================================================
-- STEP 5: دمج السياسات المتعددة
-- =====================================================

BEGIN;

-- دمج سياسات الصيانة المتعددة
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

-- دمج سياسات المخالفات المرورية
DROP POLICY IF EXISTS "traffic_fines_auth_policy" ON public.traffic_fines;
DROP POLICY IF EXISTS "traffic_fines_policy" ON public.traffic_fines;
DROP POLICY IF EXISTS "traffic_fines_unified_policy" ON public.traffic_fines;

CREATE POLICY "traffic_fines_consolidated" ON public.traffic_fines
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

COMMIT;

-- =====================================================
-- STEP 6: الأمان النهائي والصلاحيات
-- =====================================================

BEGIN;

-- منح الصلاحيات للمستخدمين المصرح لهم
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- إزالة الوصول العام لضمان الأمان
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

-- تحديث إحصائيات الجداول لتحسين الأداء
ANALYZE public.customers;
ANALYZE public.vehicles;
ANALYZE public.leases;
ANALYZE public.unified_payments;
ANALYZE public.maintenance;
ANALYZE public.traffic_fines;
ANALYZE public.documents;

COMMIT;

-- =====================================================
-- تم الانتهاء من جميع الإصلاحات الأمنية!
-- =====================================================

-- للتحقق من النتائج، قم بتشغيل هذه الاستعلامات:

-- 1. فحص RLS
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = false;

-- 2. فحص السياسات
-- SELECT schemaname, tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname; 