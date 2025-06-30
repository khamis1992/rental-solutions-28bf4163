# دليل إصلاح مشاكل Security Migration

## المشكلة الشائعة: "relation does not exist"

إذا واجهت خطأ مثل:
```
ERROR: 42P01: relation "public.documents" does not exist
ERROR: 42P01: relation "public.whatsapp_messages" does not exist
```

هذا يعني أن بعض الجداول المذكورة في migration الأمان غير موجودة في قاعدة البيانات.

## الحلول المتاحة

### الحل السريع: Migration الأساسي
استخدم `20250130_minimal_security_fix.sql` الذي يطبق الأمان على الجداول الأساسية فقط:

```sql
-- يطبق RLS على الجداول الأساسية المؤكد وجودها
- customers
- vehicles  
- leases
- unified_payments
```

### الحل الآمن: Migration ذكي
استخدم `20250130_safe_security_migration.sql` الذي يتحقق من وجود الجداول أولاً:

```sql
-- يتحقق من وجود كل جدول قبل تطبيق السياسات
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    -- تطبيق السياسات
ELSE
    -- تخطي الجدول
END IF;
```

## خطوات التطبيق

### الخطوة 1: تحديد الجداول الموجودة
```sql
-- قم بتشغيل هذا الاستعلام في SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### الخطوة 2: اختيار Migration المناسب

#### إذا كانت الجداول الأساسية موجودة فقط:
- استخدم `20250130_minimal_security_fix.sql`
- سيطبق الأمان على: customers, vehicles, leases, unified_payments

#### إذا كانت معظم الجداول موجودة:
- استخدم `20250130_safe_security_migration.sql`
- سيتحقق من وجود كل جدول ويطبق السياسات فقط على الموجود

### الخطوة 3: التشغيل
1. اذهب إلى Supabase Dashboard → SQL Editor
2. انسخ محتوى الملف المناسب
3. اضغط Run
4. راقب الرسائل في النتائج

## الجداول المدعومة في كل Migration

### Minimal Security Fix
✅ **الجداول الأساسية:**
- public.customers
- public.vehicles
- public.leases
- public.unified_payments

### Safe Security Migration
✅ **جميع الجداول مع التحقق:**
- public.customers *(أساسي)*
- public.vehicles *(أساسي)*
- public.leases *(أساسي)*
- public.unified_payments *(أساسي)*
- public.documents *(اختياري)*
- public.whatsapp_messages *(اختياري)*
- public.maintenance *(اختياري)*
- public.traffic_fines *(اختياري)*
- public.error_logs *(اختياري)*
- public.damages *(اختياري)*

## إنشاء الجداول المفقودة

إذا كنت تريد إنشاء الجداول المفقودة:

### جدول Documents
```sql
-- تشغيل migration إنشاء جدول documents
-- استخدم محتوى: supabase/migrations/20250520_create_documents_table.sql
```

### جدول WhatsApp Messages
```sql
-- تشغيل migration إنشاء جدول whatsapp_messages
-- استخدم محتوى: supabase/migrations/20250623191950_create_whatsapp_messages_table.sql
```

## التحقق من النتائج

بعد تطبيق Migration بنجاح:

### فحص RLS
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### فحص السياسات
```sql
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## المشاكل الشائعة والحلول

### 1. "permission denied for schema public"
```sql
-- تأكد من أن المستخدم له صلاحيات
GRANT ALL ON SCHEMA public TO authenticated;
```

### 2. "must be owner of table"
```sql
-- استخدم مستخدم admin في SQL Editor
-- أو استخدم service role key بدلاً من anon key
```

### 3. "policy already exists"
```sql
-- Migration يتضمن DROP POLICY IF EXISTS
-- لا داعي للقلق من هذا الخطأ
```

## الأمان بعد التطبيق

بعد تطبيق أي من migrations الأمان:

✅ **تم تفعيل Row Level Security**
✅ **تم إنشاء سياسات أمان محكمة**
✅ **تم إزالة الوصول العام**
✅ **تم تحسين الفهارس**

## الدعم الفني

إذا واجهت مشاكل:
1. تحقق من سجلات الأخطاء في Supabase Dashboard
2. تأكد من استخدام service role key للعمليات الإدارية
3. راجع قائمة الجداول الموجودة فعلاً في قاعدة البيانات 