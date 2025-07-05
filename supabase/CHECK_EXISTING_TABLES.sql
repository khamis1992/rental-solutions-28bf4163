-- استعلام لفحص الجداول الموجودة في قاعدة البيانات
-- قم بتشغيل هذا الاستعلام أولاً لمعرفة الجداول المتاحة

SELECT 
    table_name as "اسم الجدول",
    CASE 
        WHEN table_name IN ('customers', 'vehicles', 'leases', 'unified_payments') THEN '✅ أساسي'
        WHEN table_name IN ('documents', 'whatsapp_messages', 'maintenance', 'traffic_fines', 'error_logs') THEN '🔧 إضافي'
        ELSE '📋 آخر'
    END as "النوع",
    CASE 
        WHEN table_name = 'customers' THEN 'جدول العملاء'
        WHEN table_name = 'vehicles' THEN 'جدول المركبات'
        WHEN table_name = 'leases' THEN 'جدول العقود'
        WHEN table_name = 'unified_payments' THEN 'جدول الدفعات'
        WHEN table_name = 'documents' THEN 'جدول الوثائق'
        WHEN table_name = 'whatsapp_messages' THEN 'جدول رسائل الواتساب'
        WHEN table_name = 'maintenance' THEN 'جدول الصيانة'
        WHEN table_name = 'traffic_fines' THEN 'جدول المخالفات المرورية'
        WHEN table_name = 'error_logs' THEN 'جدول سجل الأخطاء'
        ELSE 'جدول نظام'
    END as "الوصف"
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY 
    CASE 
        WHEN table_name IN ('customers', 'vehicles', 'leases', 'unified_payments') THEN 1
        WHEN table_name IN ('documents', 'whatsapp_messages', 'maintenance', 'traffic_fines', 'error_logs') THEN 2
        ELSE 3
    END,
    table_name;

-- التحقق من RLS الحالي
SELECT 
    t.table_name as "الجدول",
    CASE 
        WHEN t.row_security = 'YES' THEN '✅ مفعل'
        ELSE '❌ غير مفعل'
    END as "Row Level Security"
FROM information_schema.tables t
WHERE t.table_schema = 'public'
ORDER BY t.table_name;

-- عدد السياسات الأمنية لكل جدول
SELECT 
    p.tablename as "الجدول",
    COUNT(*) as "عدد السياسات",
    STRING_AGG(p.policyname, ', ') as "أسماء السياسات"
FROM pg_policies p
WHERE p.schemaname = 'public'
GROUP BY p.tablename
ORDER BY p.tablename; 