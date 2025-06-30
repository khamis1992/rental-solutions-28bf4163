# 🔧 حل سريع لخطأ "relation does not exist"

## المشكلة
```
ERROR: 42P01: relation "public.documents" does not exist
```

## الحل السريع (3 خطوات)

### 1️⃣ تحديد الجداول الموجودة
```sql
-- نسخ والصق في SQL Editor واضغط Run
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

### 2️⃣ اختيار Migration المناسب

#### إذا ظهرت الجداول الأساسية فقط:
- `customers`
- `vehicles` 
- `leases`
- `unified_payments`

**👈 استخدم:** `20250130_minimal_security_fix.sql`

#### إذا ظهرت جداول إضافية:
**👈 استخدم:** `20250130_safe_security_migration.sql`

### 3️⃣ تطبيق Migration
1. افتح Supabase Dashboard → SQL Editor
2. انسخ محتوى الملف المناسب
3. اضغط **Run**

## الملفات المتاحة

| الملف | الاستخدام | الجداول المدعومة |
|-------|-----------|-------------------|
| `20250130_minimal_security_fix.sql` | ✅ آمن - أساسي | 4 جداول أساسية |
| `20250130_safe_security_migration.sql` | ✅ ذكي - شامل | جميع الجداول مع التحقق |
| `CHECK_EXISTING_TABLES.sql` | 🔍 فحص | لمعرفة الجداول الموجودة |

## بعد التطبيق

✅ **تم حل مشاكل Security Advisor**
✅ **تم تفعيل Row Level Security**  
✅ **تم إنشاء سياسات أمان**
✅ **تم تحسين الأداء**

## في حالة استمرار المشاكل

1. تأكد من استخدام **service role key** وليس anon key
2. تحقق من الصلاحيات في Supabase Dashboard
3. راجع دليل `SECURITY_MIGRATION_GUIDE.md` للتفاصيل 