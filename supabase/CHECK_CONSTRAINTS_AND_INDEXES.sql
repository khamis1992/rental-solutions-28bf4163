-- فحص القيود والفهارس في قاعدة البيانات
-- يساعد على فهم مشكلة "cannot drop index because constraint requires it"

-- =====================================================
-- 1. فحص القيود (Constraints) الموجودة
-- =====================================================

SELECT 
    tc.table_name as "الجدول",
    tc.constraint_name as "اسم القيد", 
    tc.constraint_type as "نوع القيد",
    CASE tc.constraint_type
        WHEN 'PRIMARY KEY' THEN 'مفتاح أساسي'
        WHEN 'FOREIGN KEY' THEN 'مفتاح خارجي'
        WHEN 'UNIQUE' THEN 'قيد فريد'
        WHEN 'CHECK' THEN 'قيد فحص'
        ELSE tc.constraint_type
    END as "الوصف"
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('customers', 'vehicles', 'leases', 'unified_payments')
ORDER BY tc.table_name, tc.constraint_type;

-- =====================================================
-- 2. فحص الفهارس (Indexes) الموجودة
-- =====================================================

SELECT 
    schemaname as "المخطط",
    tablename as "الجدول",
    indexname as "اسم الفهرس",
    indexdef as "تعريف الفهرس"
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'vehicles', 'leases', 'unified_payments')
ORDER BY tablename, indexname;

-- =====================================================
-- 3. فحص الفهارس المرتبطة بالقيود
-- =====================================================

SELECT 
    i.schemaname as "المخطط",
    i.tablename as "الجدول", 
    i.indexname as "اسم الفهرس",
    tc.constraint_name as "القيد المرتبط",
    tc.constraint_type as "نوع القيد",
    CASE 
        WHEN tc.constraint_name IS NOT NULL THEN '🔗 مرتبط بقيد'
        ELSE '🆓 فهرس حر'
    END as "الحالة"
FROM pg_indexes i
LEFT JOIN information_schema.table_constraints tc 
    ON i.indexname = tc.constraint_name 
    AND i.schemaname = tc.table_schema
    AND i.tablename = tc.table_name
WHERE i.schemaname = 'public'
  AND i.tablename IN ('customers', 'vehicles', 'leases', 'unified_payments')
ORDER BY i.tablename, i.indexname;

-- =====================================================
-- 4. البحث عن الفهارس المكررة
-- =====================================================

SELECT 
    t1.indexname as "الفهرس الأول",
    t2.indexname as "الفهرس الثاني", 
    t1.tablename as "الجدول",
    '⚠️ فهرس مكرر' as "المشكلة"
FROM pg_indexes t1
JOIN pg_indexes t2 ON (
    t1.tablename = t2.tablename 
    AND t1.indexdef = t2.indexdef 
    AND t1.indexname < t2.indexname
)
WHERE t1.schemaname = 'public';

-- =====================================================
-- 5. فحص القيد المشكل تحديداً
-- =====================================================

SELECT 
    'leases_agreement_number_key' as "اسم القيد",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'leases_agreement_number_key'
            AND table_name = 'leases'
            AND table_schema = 'public'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "الحالة",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'leases_agreement_number_key'
            AND tablename = 'leases'
            AND schemaname = 'public'
        ) THEN '✅ فهرس موجود'
        ELSE '❌ فهرس غير موجود'
    END as "حالة الفهرس";

-- =====================================================
-- 6. حلول للمشكلة
-- =====================================================

SELECT 
    'لحل مشكلة cannot drop index' as "المشكلة",
    'DROP CONSTRAINT leases_agreement_number_key' as "الحل 1",
    'RENAME CONSTRAINT إلى اسم أفضل' as "الحل 2", 
    'تجاهل هذا الفهرس في Migration' as "الحل 3"; 