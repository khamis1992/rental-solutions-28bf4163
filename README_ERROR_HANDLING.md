# نظام معالجة الأخطاء الموحد

## الملفات المضافة

### 1. Hooks للمعالجة
- `src/hooks/useErrorHandler.ts` - Hook موحد لمعالجة الأخطاء
- `src/hooks/useAsyncErrorHandler.ts` - معالجة العمليات غير المتزامنة  
- `src/hooks/useFormErrorHandler.ts` - معالجة أخطاء النماذج

### 2. مكونات العرض
- `src/components/common/ErrorBoundary.tsx` - التقاط أخطاء React
- `src/components/common/ErrorDisplay.tsx` - عرض الأخطاء بأشكال مختلفة

### 3. أدوات مساعدة
- `src/utils/unified-error-handler.ts` - معالج الأخطاء الموحد
- `src/utils/error-utils.ts` - أدوات مساعدة للأخطاء

### 4. التوثيق
- `docs/ERROR_HANDLING_GUIDE.md` - دليل شامل للاستخدام
- `docs/ERROR_HANDLING_MIGRATION.md` - دليل الانتقال

## الاستخدام السريع

### في المكونات
```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

function MyComponent() {
  const { handleError, error } = useErrorHandler();
  
  const handleAction = async () => {
    try {
      await someOperation();
    } catch (error) {
      handleError(error, { context: { component: 'MyComponent' } });
    }
  };

  return (
    <div>
      <ErrorDisplay error={error.error} showRetry onRetry={handleAction} />
    </div>
  );
}
```

### في Services
```typescript
import { handleApiError } from '@/utils/unified-error-handler';

async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (error) {
    return await handleApiError(error, {
      context: { api: 'data' }
    });
  }
}
```

### Error Boundary
```typescript
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary showRetry showHome>
      <MyApp />
    </ErrorBoundary>
  );
}
```

## الفوائد

1. **التسق**: نفس الطريقة في جميع أجزاء التطبيق
2. **سهولة الاستخدام**: Hooks جاهزة للاستعمال
3. **التتبع**: تسجيل شامل للأخطاء
4. **المرونة**: أنماط مختلفة للمعالجة
5. **تجربة المستخدم**: رسائل واضحة ومتسقة

## الخطوات التالية

1. مراجعة الدليل الشامل في `docs/ERROR_HANDLING_GUIDE.md`
2. استخدام دليل الانتقال في `docs/ERROR_HANDLING_MIGRATION.md`
3. تطبيق النظام تدريجياً في المكونات الموجودة
4. اختبار النظام في بيئة التطوير 