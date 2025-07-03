# خطة تطبيق Row-Level Security (RLS) الشاملة

## 📋 نظرة عامة

تم تطوير نظام أمان متقدم باستخدام Row-Level Security في Supabase لضمان حماية البيانات وتقييد الوصول حسب أدوار المستخدمين.

## 🎯 الأهداف الرئيسية

1. **حماية شاملة للبيانات**: تأمين جميع الجداول بسياسات RLS
2. **إدارة الأدوار**: نظام أدوار متدرج للمستخدمين
3. **تحسين الأداء**: فهرسة محسنة للاستعلامات الآمنة
4. **مراقبة الأمان**: تسجيل ومراقبة العمليات الحساسة
5. **توثيق شامل**: دليل كامل للمطورين والمشرفين

## 🏗️ هيكل النظام

### 1. نظام الأدوار (User Roles)

```typescript
// الأدوار المتاحة في النظام
const USER_ROLES = {
  ADMIN: 'admin',         // مدير النظام - وصول كامل
  MANAGER: 'manager',     // مدير الفرع - وصول إداري
  EMPLOYEE: 'employee',   // موظف - وصول تشغيلي
  ACCOUNTANT: 'accountant', // محاسب - وصول مالي
  MAINTENANCE: 'maintenance', // صيانة - وصول للمركبات والصيانة
  LEGAL: 'legal',         // قانوني - وصول للقضايا القانونية
  VIEWER: 'viewer'        // عارض - وصول للقراءة فقط
}
```

### 2. مصفوفة الصلاحيات

| الدور | العملاء | المركبات | العقود | المدفوعات | الصيانة | القانوني | التقارير | الإعدادات | المستخدمين |
|--------|---------|----------|---------|-----------|----------|-----------|-----------|------------|------------|
| **Admin** | ✅ الكل | ✅ الكل | ✅ الكل | ✅ الكل | ✅ الكل | ✅ الكل | ✅ الكل | ✅ الكل | ✅ الكل |
| **Manager** | ✅ قراءة/كتابة | ✅ قراءة/كتابة | ✅ قراءة/كتابة | ✅ قراءة/كتابة | ✅ قراءة/كتابة | ✅ قراءة/كتابة | ✅ قراءة/كتابة | 📖 قراءة | 📖 قراءة |
| **Employee** | ✅ قراءة/كتابة | ✅ قراءة/كتابة | ✅ قراءة/كتابة | 📖 قراءة | ✅ قراءة/كتابة | 📖 قراءة | 📖 قراءة | ❌ | ❌ |
| **Accountant** | 📖 قراءة | 📖 قراءة | 📖 قراءة | ✅ قراءة/كتابة | 📖 قراءة | 📖 قراءة | ✅ قراءة/كتابة | ❌ | ❌ |
| **Maintenance** | 📖 قراءة | ✅ قراءة/كتابة | 📖 قراءة | ❌ | ✅ قراءة/كتابة | ❌ | 📖 قراءة | ❌ | ❌ |
| **Legal** | 📖 قراءة | 📖 قراءة | 📖 قراءة | 📖 قراءة | ❌ | ✅ قراءة/كتابة | 📖 قراءة | ❌ | ❌ |
| **Viewer** | 📖 قراءة | 📖 قراءة | 📖 قراءة | 📖 قراءة | 📖 قراءة | 📖 قراءة | 📖 قراءة | ❌ | ❌ |

## 🔧 التطبيق التقني

### Migration 1: النظام الأساسي

```sql
-- إنشاء جدول أدوار المستخدمين
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'accountant', 'maintenance', 'legal', 'viewer')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

-- دوال مساعدة للتحقق من الأدوار
CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Migration 2: حماية شاملة للجداول

```sql
-- تفعيل RLS على جميع الجداول
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_payments ENABLE ROW LEVEL SECURITY;
-- ... جميع الجداول الأخرى

-- سياسات أمان محسنة
CREATE POLICY "customers_role_based_access" ON public.customers
FOR ALL USING (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'manager', 'employee'])
);
```

## 🛡️ ميزات الأمان المتقدمة

### 1. تسجيل الأحداث الأمنية

```sql
-- جدول تسجيل الأحداث الأمنية
CREATE TABLE public.security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. مراقبة انتهاكات الأمان

```sql
-- فحص حالة الأمان للجداول
CREATE OR REPLACE FUNCTION public.check_security_violations()
RETURNS TABLE (
    table_name TEXT,
    policy_count INTEGER,
    has_rls BOOLEAN,
    security_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        COALESCE(p.policy_count, 0)::INTEGER,
        t.rowsecurity,
        CASE 
            WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) > 0 THEN 'SECURE'
            WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) = 0 THEN 'RLS_ENABLED_NO_POLICIES'
            WHEN NOT t.rowsecurity THEN 'NO_RLS'
            ELSE 'UNKNOWN'
        END::TEXT
    FROM pg_tables t
    LEFT JOIN (
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY tablename
    ) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. فهرسة محسنة للأداء

```sql
-- فهارس للأداء المحسن
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_user_role ON public.user_roles(user_id, role);

-- فهارس للجداول الرئيسية
CREATE INDEX idx_customers_rls ON public.customers(id) WHERE id IS NOT NULL;
CREATE INDEX idx_vehicles_rls ON public.vehicles(id) WHERE id IS NOT NULL;
CREATE INDEX idx_leases_rls ON public.leases(id) WHERE id IS NOT NULL;
```

## 💻 استخدام النظام في الكود

### 1. التحقق من الصلاحيات

```typescript
import { usePermissions } from '@/utils/rls-management';

function CustomerManagement() {
  const { canWrite, canDelete, isAdmin, loading } = usePermissions();
  
  if (loading) return <Loading />;
  
  return (
    <div>
      {canWrite('customers') && <AddCustomerButton />}
      {canDelete('customers') && <DeleteCustomerButton />}
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### 2. إدارة الأدوار

```typescript
import { assignUserRole, USER_ROLES } from '@/utils/rls-management';

// تعيين دور للمستخدم
await assignUserRole(userId, USER_ROLES.EMPLOYEE);

// التحقق من الدور
const isManager = await hasRole(USER_ROLES.MANAGER);
```

### 3. تسجيل الأحداث الأمنية

```typescript
import { logSecurityEvent } from '@/utils/rls-management';

// تسجيل حدث أمني
await logSecurityEvent(
  'DELETE_CUSTOMER',
  'customers',
  customerId,
  { reason: 'Data cleanup', requestedBy: userId }
);
```

## 📊 مراقبة وتقارير الأمان

### 1. تقرير حالة الأمان

```sql
-- عرض حالة الأمان لجميع الجداول
SELECT * FROM public.check_security_violations()
ORDER BY security_status, table_name;
```

### 2. تقرير الأحداث الأمنية

```sql
-- آخر الأحداث الأمنية
SELECT 
    sal.action,
    sal.table_name,
    p.first_name || ' ' || p.last_name as user_name,
    sal.created_at
FROM public.security_audit_log sal
JOIN public.profiles p ON sal.user_id = p.user_id
ORDER BY sal.created_at DESC
LIMIT 50;
```

### 3. تقرير المستخدمين والأدوار

```sql
-- جميع المستخدمين وأدوارهم
SELECT 
    p.first_name || ' ' || p.last_name as user_name,
    p.email,
    STRING_AGG(ur.role, ', ') as roles,
    COUNT(ur.role) as role_count
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
GROUP BY p.user_id, p.first_name, p.last_name, p.email
ORDER BY role_count DESC, user_name;
```

## 🚀 خطة التطبيق

### المرحلة الأولى: الإعداد الأساسي ✅
- [x] إنشاء جدول user_roles
- [x] إنشاء دوال التحقق من الأدوار
- [x] تفعيل RLS على الجداول الرئيسية
- [x] إنشاء السياسات الأساسية

### المرحلة الثانية: التطبيق الشامل
- [ ] تطبيق migrations على قاعدة البيانات
- [ ] اختبار السياسات والصلاحيات
- [ ] تعيين الأدوار للمستخدمين الحاليين
- [ ] تحديث واجهة المستخدم

### المرحلة الثالثة: المراقبة والتحسين
- [ ] تفعيل نظام مراقبة الأمان
- [ ] إنشاء تقارير دورية
- [ ] تحسين الأداء
- [ ] تدريب المستخدمين

## ⚠️ تحذيرات مهمة

1. **النسخ الاحتياطية**: تأكد من وجود نسخة احتياطية كاملة قبل تطبيق المigrations
2. **الاختبار**: اختبر النظام في بيئة التطوير قبل الإنتاج
3. **المستخدم الأساسي**: تأكد من وجود مستخدم admin قبل تطبيق القيود
4. **الصلاحيات**: راجع جميع الصلاحيات قبل التطبيق النهائي

## 🔧 استكمال التطبيق

### 1. تطبيق المigrations

```bash
# في Supabase Dashboard أو CLI
-- تطبيق Migration 1
\i supabase/migrations/20250131_enhanced_rls_system.sql

-- تطبيق Migration 2  
\i supabase/migrations/20250131_complete_rls_coverage.sql
```

### 2. تعيين أول مدير

```sql
-- تعيين أول مستخدم كمدير
INSERT INTO public.user_roles (user_id, role, permissions, created_by)
VALUES (
    'your-user-id-here',
    'admin', 
    '{"all": true}',
    'your-user-id-here'
);
```

### 3. اختبار النظام

```typescript
// اختبار الصلاحيات في الكونسول
import { checkSecurityStatus } from '@/utils/rls-management';

const securityStatus = await checkSecurityStatus();
console.table(securityStatus);
```

## 📞 الدعم والمساعدة

في حالة وجود مشاكل أو استفسارات:
1. راجع سجل الأخطاء في Supabase Dashboard
2. تحقق من حالة الأمان باستخدام `check_security_violations()`
3. راجع سجل الأحداث الأمنية
4. تواصل مع فريق التطوير

---

تم إعداد هذه الوثيقة من قبل فريق التطوير لضمان تطبيق آمن وفعال لنظام Row-Level Security في نظام إدارة تأجير المركبات. 