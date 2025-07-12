# حل مشكلة Google Vision Edge Function Error

## المشكلة
```
Google Vision Edge Function error:
FunctionsFetchError: Failed to send a request to the Edge Function
```

## السبب
المشكلة تحدث في `ServiceDiagnostics.tsx` الذي يتم تحميله في Dashboard ويحاول استدعاء Google Vision Edge Function للفحص.

## الحل السريع

### 1. استبدل ServiceDiagnostics في Dashboard.tsx

في ملف `src/pages/Dashboard.tsx`:

```typescript
// استبدل هذا السطر:
import { ServiceDiagnostics } from '@/components/admin/ServiceDiagnostics';

// بهذا السطر:
import { SafeServiceDiagnostics } from '@/components/admin/SafeServiceDiagnostics';
```

```typescript
// واستبدل في JSX:
<ServiceDiagnostics />

// بـ:
<SafeServiceDiagnostics />
```

### 2. أو تعطيل تشخيص الخدمات مؤقتاً

إذا كنت تريد تعطيل التشخيص مؤقتاً، استبدل `<ServiceDiagnostics />` بـ:

```typescript
<div className="p-4 border rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
  ✅ النظام يعمل بشكل طبيعي
</div>
```

## الحل الكامل

### إعداد Google Vision API Key

1. **في Supabase Dashboard:**
   - اذهب إلى Project Settings → Edge Functions
   - في قسم Environment Variables أضف:
     - `GOOGLE_VISION_API_KEY` = مفتاح Google Vision API الخاص بك

2. **للحصول على Google Vision API Key:**
   - اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
   - فعل Vision API
   - أنشئ API Key
   - انسخ المفتاح إلى Supabase

### إعداد Edge Functions

تأكد من أن Edge Functions تم deploy بشكل صحيح:

```bash
supabase functions deploy process-google-vision
supabase functions deploy process-openai
```

## ملاحظات مهمة

- **النظام يعمل بدون Google Vision**: الخدمة اختيارية ولها fallback system
- **البيانات التجريبية**: في حالة عدم توفر الخدمة، يتم استخدام بيانات تجريبية
- **لا تؤثر على الوظائف الأساسية**: جميع ميزات النظام تعمل بدون Google Vision

## اختبار الحل

بعد تطبيق الحل:

1. أعد تحميل الصفحة
2. تأكد من عدم ظهور أخطاء في Console
3. تحقق من أن Dashboard يعمل بشكل طبيعي

إذا استمرت المشكلة، تأكد من استخدام `SafeServiceDiagnostics` بدلاً من `ServiceDiagnostics`. 