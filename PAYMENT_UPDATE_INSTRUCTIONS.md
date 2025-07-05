# تحديث المدفوعات قبل 9 يناير 2024
# Update Payments Before January 9, 2024

## 📋 نظرة عامة / Overview

هذا التحديث سيقوم بتعديل جميع المدفوعات الموجودة في النظام والتي تاريخ استحقاقها قبل **9 يناير 2024** لتصبح مدفوعة ومكتملة.

This update will modify all payments in the system with due dates before **January 9, 2024** to be marked as paid and completed.

## 📁 الملفات المطلوبة / Required Files

1. **`CHECK_PAYMENTS_BEFORE_2024_PREVIEW.sql`** - للمعاينة فقط
2. **`supabase/migrations/20250128_update_payments_before_2024.sql`** - للتنفيذ الفعلي
3. **`UPDATE_PAYMENTS_BEFORE_2024_01_09.sql`** - نسخة احتياطية للتنفيذ اليدوي

## ⚠️ تحذيرات مهمة / Important Warnings

- **عمل نسخة احتياطية من قاعدة البيانات قبل التنفيذ**
- **اختبار التحديث في بيئة تطوير أولاً**
- **التأكد من أن جميع المستخدمين خارج النظام أثناء التحديث**

## 🔍 خطوة 1: المعاينة والتحقق

قم بتشغيل ملف المعاينة أولاً للتحقق من البيانات التي ستتأثر:

```sql
-- في محرر SQL في Supabase Dashboard أو أي أداة SQL
-- تشغيل ملف CHECK_PAYMENTS_BEFORE_2024_PREVIEW.sql
```

هذا الملف سيعرض:
- عدد المدفوعات التي ستتأثر
- عينة من السجلات
- المبالغ المالية الإجمالية
- إحصائيات مفصلة

## 🚀 خطوة 2: التنفيذ

### الطريقة الأولى: استخدام Supabase CLI (الموصى بها)

```bash
# 1. التأكد من تسجيل الدخول لـ Supabase
supabase login

# 2. ربط المشروع المحلي بالمشروع الفعلي
supabase link --project-ref YOUR_PROJECT_ID

# 3. تطبيق الهجرة
supabase db push
```

### الطريقة الثانية: التنفيذ اليدوي

1. افتح **Supabase Dashboard**
2. اذهب إلى **SQL Editor**
3. انسخ والصق محتوى `supabase/migrations/20250128_update_payments_before_2024.sql`
4. اضغط **Run**

### الطريقة الثالثة: استخدام النص المستقل

انسخ والصق محتوى `UPDATE_PAYMENTS_BEFORE_2024_01_09.sql` في أي محرر SQL.

## 📊 ما سيحدث بالضبط / What Exactly Will Happen

### في جدول `payment_schedules`:
- ✅ تحديث `status` من `pending/overdue` إلى `completed`
- ✅ تعيين `actual_payment_date` إلى `due_date` إذا كان فارغاً
- ✅ تحديث `updated_at` إلى الوقت الحالي

### في جدول `unified_payments`:
- ✅ تحديث `status` من `pending/overdue/partial` إلى `completed`
- ✅ تعيين `payment_date` إذا كان فارغاً
- ✅ تعيين `amount_paid` إلى المبلغ الكامل
- ✅ تعيين `balance` إلى صفر
- ✅ تحديث `updated_at` إلى الوقت الحالي

## 🔄 التراجع عن التحديث / Rollback (إذا لزم الأمر)

إذا كنت بحاجة للتراجع عن التحديث، استخدم الكود المعلق في نهاية ملف `UPDATE_PAYMENTS_BEFORE_2024_01_09.sql`:

```sql
-- إزالة التعليق عن هذا الجزء وتنفيذه للتراجع
/*
BEGIN;
-- كود التراجع موجود في الملف
COMMIT;
*/
```

## ✅ التحقق من النجاح / Verify Success

بعد التنفيذ، تحقق من:

1. **عدد المدفوعات المكتملة**:
```sql
SELECT COUNT(*) FROM payment_schedules 
WHERE due_date < '2024-01-09' AND status = 'completed';
```

2. **عدم وجود مدفوعات معلقة قبل التاريخ**:
```sql
SELECT COUNT(*) FROM payment_schedules 
WHERE due_date < '2024-01-09' AND status IN ('pending', 'overdue');
-- يجب أن يكون الناتج 0
```

3. **التحقق من unified_payments**:
```sql
SELECT COUNT(*) FROM unified_payments 
WHERE original_due_date < '2024-01-09' AND status = 'completed';
```

## 📝 سجل التحديث / Update Log

سيتم إنشاء سجل تلقائي في جدول `system_logs` (إذا كان موجوداً) يحتوي على:
- تاريخ ووقت التحديث
- عدد السجلات المتأثرة
- تفاصيل العملية

## 🔧 استكشاف الأخطاء / Troubleshooting

### إذا فشل التحديث:
1. تحقق من أذونات قاعدة البيانات
2. تأكد من وجود الجداول المطلوبة
3. تحقق من أن تواريخ البيانات صحيحة
4. راجع سجلات الأخطاء في Supabase

### أخطاء شائعة:
- **جدول غير موجود**: تأكد من تطبيق جميع الهجرات السابقة
- **عمود غير موجود**: تحقق من هيكل الجداول
- **انتهاك القيود**: تأكد من صحة البيانات

## 📞 الدعم / Support

إذا واجهت أي مشاكل:
1. تحقق من سجلات Supabase
2. راجع ملف المعاينة مرة أخرى
3. اتصل بفريق التطوير

## ⏰ الوقت المتوقع / Expected Duration

- **المعاينة**: 1-2 دقيقة
- **التنفيذ**: 5-15 دقيقة (حسب حجم البيانات)
- **التحقق**: 2-3 دقائق

**إجمالي الوقت المتوقع: 10-20 دقيقة**

---

## 🚨 تذكير أخير / Final Reminder

- ✅ عمل نسخة احتياطية
- ✅ اختبار في بيئة التطوير
- ✅ تشغيل المعاينة أولاً
- ✅ التأكد من عدم وجود مستخدمين في النظام
- ✅ التحقق من النتائج بعد التنفيذ 