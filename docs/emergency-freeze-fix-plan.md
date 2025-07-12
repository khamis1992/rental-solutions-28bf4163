# خطة الحل الطارئ لمشكلة تجمد النظام

## المشكلة
النظام يتجمد عند تفعيل الدارك مود أو عند استخدام بعض الإعدادات، مما يؤدي إلى `RESULT_CODE_HUNG` ويتطلب إعادة تشغيل التطبيق.

## التشخيص
المشكلة ناتجة عن:
1. **Infinite Loops** في Context providers
2. **Excessive Re-renders** بسبب state updates متكررة
3. **Memory Leaks** من عدم cleanup الـ subscriptions
4. **Race Conditions** في async operations
5. **Blocking Operations** بدون timeouts

## الحلول المطبقة

### 1. نظام إعادة التعيين الطارئ (Emergency Reset)
**الملف**: `src/utils/emergency-reset.ts`

**المميزات**:
- مسح localStorage و sessionStorage
- إيقاف Service Workers
- مسح Cache
- كشف التجمد التلقائي
- زر طوارئ في Development mode

**الاستخدام**:
```javascript
// في console المتصفح
emergencyReset()

// برمجياً
import { EmergencyReset } from '@/utils/emergency-reset';
EmergencyReset.performEmergencyReset();
```

### 2. كاشف الحلقات اللانهائية (Loop Detector)
**الملف**: `src/utils/loop-detector.ts`

**المميزات**:
- مراقبة عدد استدعاءات الدوال
- منع الحلقات اللانهائية
- إعادة تعيين تلقائية للدوال الحرجة
- إحصائيات مفصلة للتشخيص

**الاستخدام**:
```javascript
// في React Hook
const loopDetector = useLoopDetector('functionName', 50, 3000);

// في function عادية
const safeFunction = withLoopDetection(originalFunction, 'functionName');
```

### 3. نسخة آمنة من SettingsContext
**الملف**: `src/contexts/SafeSettingsContext.tsx`

**التحسينات**:
- Loop detection مدمج
- Debouncing للمنع من التحديثات المتكررة
- Timeout protection
- Safe fallbacks
- معالجة أفضل للأخطاء

### 4. نسخة آمنة من AuthContext
**الملف**: `src/contexts/SafeAuthContext.tsx`

**التحسينات**:
- Debounced user state
- Timeout protection لـ auth checks
- منع الاستدعاءات المتكررة
- Safe fallbacks

### 5. نسخة آمنة من App.tsx
**الملف**: `src/App-Safe.tsx`

**التحسينات**:
- Lazy loading للصفحات
- Emergency reset trigger
- Safe initialization
- Error boundaries شاملة

### 6. صفحة إعدادات آمنة
**الملف**: `src/pages/SafeSystemSettings.tsx`

**التحسينات**:
- منع التغييرات المتكررة
- معالجة خاصة للثيم
- زر إعادة تعيين طارئة
- تحذيرات أمان

## خطوات التطبيق

### الخطوة 1: استبدال الملفات الحالية
```bash
# نسخ احتياطي
cp src/App.tsx src/App-backup.tsx
cp src/contexts/SettingsContext.tsx src/contexts/SettingsContext-backup.tsx
cp src/contexts/AuthContext.tsx src/contexts/AuthContext-backup.tsx
cp src/pages/SystemSettings.tsx src/pages/SystemSettings-backup.tsx

# استبدال بالنسخ الآمنة
cp src/App-Safe.tsx src/App.tsx
cp src/contexts/SafeSettingsContext.tsx src/contexts/SettingsContext.tsx
cp src/contexts/SafeAuthContext.tsx src/contexts/AuthContext.tsx
cp src/pages/SafeSystemSettings.tsx src/pages/SystemSettings.tsx
```

### الخطوة 2: تحديث الـ imports
في جميع الملفات التي تستخدم:
- `useSettings` → `useSafeSettings`
- `useAuth` → `useSafeAuth`
- `SettingsProvider` → `SafeSettingsProvider`
- `AuthProvider` → `SafeAuthProvider`

### الخطوة 3: إضافة Emergency Reset للتطبيق
في `src/main.tsx` أو `src/index.tsx`:
```typescript
import '@/utils/emergency-reset';
import '@/utils/loop-detector';
```

### الخطوة 4: تفعيل الدارك مود بأمان
```typescript
// استخدم هذا بدلاً من التغيير المباشر
const handleThemeChange = async (newTheme: string) => {
  try {
    // Apply immediately for visual feedback
    document.documentElement.classList.remove('light', 'dark');
    if (newTheme !== 'system') {
      document.documentElement.classList.add(newTheme);
    }
    
    // Save with timeout protection
    await Promise.race([
      updateSetting('theme', newTheme),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]);
  } catch (error) {
    console.error('Theme change failed:', error);
    // Revert on failure
  }
};
```

## اختبار الحلول

### 1. اختبار Emergency Reset
```javascript
// في console
emergencyReset()
```

### 2. اختبار Loop Detection
```javascript
// في console
loopDetector.getStats()
```

### 3. اختبار الدارك مود
1. اذهب لصفحة الإعدادات
2. غير الثيم إلى "داكن"
3. راقب console للتحذيرات
4. تأكد أن النظام لا يتجمد

## في حالة الطوارئ

### إذا تجمد النظام:
1. **افتح Developer Tools** (F12)
2. **اذهب لـ Console tab**
3. **اكتب**: `emergencyReset()`
4. **اضغط Enter**

### إذا لم يعمل Console:
1. **اضغط على الزر الأحمر** في أعلى الصفحة
2. أو **أعد تحميل الصفحة** (Ctrl+F5)
3. أو **امسح localStorage يدوياً**:
   - اذهب لـ Application tab
   - اختر Local Storage
   - احذف جميع البيانات

### إذا استمرت المشكلة:
1. **أغلق المتصفح** تماماً
2. **احذف cache المتصفح**
3. **افتح التطبيق في incognito mode**

## المراقبة والتشخيص

### أدوات التشخيص المتاحة:
```javascript
// في console
window.emergencyReset()          // إعادة تعيين طارئة
window.loopDetector.getStats()   // إحصائيات الحلقات
window.loopDetector.clearAll()   // مسح جميع الكاشفات
```

### علامات التحذير في Console:
- `🚨 INFINITE LOOP DETECTED` - حلقة لانهائية
- `⚠️ fetchSettings debounced` - منع استدعاء متكرر
- `🚫 Blocked execution` - منع تنفيذ بسبب loop
- `⚠️ Performance warning` - تأخير في الأداء

## الصيانة الدورية

### أسبوعياً:
1. راجع logs في console
2. تحقق من إحصائيات loop detector
3. راقب الأداء العام

### شهرياً:
1. احذف localStorage القديم
2. أعد تشغيل Service Workers
3. راجع التحديثات الأمنية

## التحديثات المستقبلية

### المخطط لها:
1. **Automated Health Checks** - فحص صحة النظام تلقائياً
2. **Performance Monitoring** - مراقبة الأداء المتقدمة
3. **Safe Mode** - وضع آمن عند اكتشاف مشاكل
4. **Smart Recovery** - استرداد ذكي من الأخطاء

---

**ملاحظة مهمة**: هذه الحلول مصممة لمنع تجمد النظام وتوفير طرق استرداد سريعة. يُنصح بتطبيقها تدريجياً واختبارها في بيئة التطوير أولاً. 