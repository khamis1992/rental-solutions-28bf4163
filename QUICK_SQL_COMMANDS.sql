-- 🚀 Quick SQL Commands لتحديث vehicle_status enum
-- انسخ والصق هذه الأوامر في Supabase SQL Editor وشغلها واحد تلو الآخر

-- ====================================
-- 1️⃣ إضافة الحالات المفقودة
-- ====================================

ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'police_station';
-- ✅ أضافة: في مركز الشرطة

ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'accident';
-- ✅ أضافة: تعرضت لحادث

ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'stolen';
-- ✅ أضافة: مركبة مسروقة

ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'retired';
-- ✅ أضافة: متقاعدة/خارج الخدمة نهائياً

-- ====================================
-- 2️⃣ تحسين الأداء
-- ====================================

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
-- ✅ إضافة index للبحث السريع

-- ====================================
-- 3️⃣ التحقق من النجاح
-- ====================================

-- عرض جميع الحالات المتاحة
SELECT 
    enumlabel as "الحالة المتاحة",
    enumsortorder as "ترتيب"
FROM pg_enum 
WHERE enumtypid = 'vehicle_status'::regtype
ORDER BY enumsortorder;

-- عدد المركبات حسب الحالة
SELECT 
    status as "الحالة",
    COUNT(*) as "عدد المركبات"
FROM vehicles 
GROUP BY status
ORDER BY status;

-- ====================================
-- 4️⃣ اختبار سريع (اختياري)
-- ====================================

-- اختبار إدراج مركبة بحالة جديدة
INSERT INTO vehicles (make, model, license_plate, status, vin) 
VALUES ('Test', 'Quick', 'QUICK-001', 'police_station', 'QUICK001');

-- التحقق من الإدراج
SELECT * FROM vehicles WHERE license_plate = 'QUICK-001';

-- حذف البيانات التجريبية
DELETE FROM vehicles WHERE license_plate = 'QUICK-001';

-- ====================================
-- ✅ تم! النظام جاهز الآن
-- ====================================

SELECT '🎉 تم تحديث vehicle_status enum بنجاح! جميع الحالات متاحة الآن.' as "النتيجة"; 