# دليل حل مشكلة رفع المستندات

## المشكلة
عند محاولة رفع مستند، قد تحصل على الخطأ التالي:
```
Failed to upload document: Failed to ensure documents bucket exists. Please contact an administrator.
```

## الحل السريع 

### 1. استخدام الزر المدمج
- اذهب إلى صفحة إدارة المستندات للمركبة
- سترى تنبيه أزرق في الأعلى مع زر "إعداد نظام المستندات"
- اضغط على الزر وانتظر حتى يكتمل الإعداد
- ستحصل على رسالة نجاح: "✅ تم إعداد نظام المستندات بنجاح!"

### 2. إعداد يدوي في Supabase (إذا فشل الحل الأول)

#### الطريقة 1: من لوحة تحكم Supabase
1. اذهب إلى [supabase.com](https://supabase.com)
2. سجل دخول لمشروعك
3. اذهب إلى Storage > Buckets
4. اضغط "Create a new bucket"
5. اسم البucket: `documents`
6. اجعل البucket **Public**
7. حدد File size limit: **50MB**
8. اضغط Save

#### الطريقة 2: من SQL Editor
```sql
-- إنشاء bucket المستندات
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', true, 52428800);
```

## التحقق من النجاح
- جرب رفع مستند جديد
- يجب أن يعمل بدون أخطاء
- ستحصل على رسالة "تم رفع المستند بنجاح!"

## ملاحظات مهمة
- البucket يجب أن يكون **public** لضمان إمكانية الوصول للملفات
- الحد الأقصى لحجم الملف: **50 ميجابايت**
- الملفات المدعومة: PDF, DOC, DOCX, XLS, XLSX, الصور

## إذا استمرت المشكلة
تحقق من:
1. إعدادات `.env` للـ Supabase URL و Anon Key
2. صلاحيات المستخدم في Supabase
3. حالة خدمة Supabase Storage

---
*هذا الدليل يحل مشكلة رفع المستندات بشكل نهائي 🎉* 