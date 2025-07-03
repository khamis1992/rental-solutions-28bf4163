# دليل نظام معالجة الأخطاء الموحد

## نظرة عامة

يوفر هذا الدليل شرحاً شاملاً لنظام معالجة الأخطاء الموحد في تطبيق إدارة تأجير المركبات. تم تطوير هذا النظام لضمان التعامل المتسق مع الأخطاء عبر جميع أجزاء التطبيق.

## المكونات الرئيسية

### 1. Hooks للمعالجة

#### `useErrorHandler`
```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { handleError, clearError, error } = useErrorHandler();

  const handleAsyncOperation = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { component: 'MyComponent' }
      });
    }
  };

  return (
    <div>
      {error.hasError && (
        <div className="error-message">
          {error.errorMessage}
        </div>
      )}
      <button onClick={handleAsyncOperation}>
        تشغيل العملية
      </button>
    </div>
  );
}
```

#### `useAsyncErrorHandler`
```typescript
import { useAsyncErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { executeAsync, error } = useAsyncErrorHandler();

  const handleOperation = async () => {
    const result = await executeAsync(
      async () => {
        return await fetchData();
      },
      {
        showToast: true,
        customHandler: (error) => {
          // معالجة مخصصة
        }
      }
    );
    
    if (result) {
      // معالجة النتيجة
    }
  };

  return <button onClick={handleOperation}>تحميل البيانات</button>;
}
```

### 2. Error Boundary

#### الاستخدام الأساسي
```typescript
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      showRetry={true}
      showHome={true}
      context={{ section: 'main-app' }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

#### استخدام HOC
```typescript
import { withErrorBoundary } from '@/components/common/ErrorBoundary';

const MyComponentWithErrorBoundary = withErrorBoundary(MyComponent, {
  showRetry: true,
  context: { component: 'MyComponent' }
});
```

### 3. عرض الأخطاء

#### `ErrorDisplay`
```typescript
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

function MyComponent() {
  const [error, setError] = useState(null);

  return (
    <div>
      <ErrorDisplay
        error={error}
        variant="alert"
        showRetry={true}
        onRetry={() => setError(null)}
      />
    </div>
  );
}
```

#### `ErrorList`
```typescript
import { ErrorList } from '@/components/common/ErrorDisplay';

function MyComponent() {
  const [errors, setErrors] = useState([]);

  return (
    <ErrorList 
      errors={errors}
      className="my-4"
    />
  );
}
```

### 4. المعالج الموحد

#### الاستخدام الأساسي
```typescript
import { unifiedErrorHandler, ErrorPattern } from '@/utils/unified-error-handler';

// معالجة أخطاء API
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error('فشل في تحميل البيانات');
  }
} catch (error) {
  await unifiedErrorHandler(error, {
    pattern: ErrorPattern.FULL,
    context: { operation: 'fetch-data' },
    severity: 'medium'
  });
}
```

#### المعالجات المخصصة
```typescript
import { errorHandlers } from '@/utils/unified-error-handler';

// معالجة أخطاء الشبكة
try {
  await networkOperation();
} catch (error) {
  await errorHandlers.network(error, {
    customMessage: 'فشل في الاتصال بالخادم'
  });
}

// معالجة أخطاء المصادقة
try {
  await authenticateUser();
} catch (error) {
  await errorHandlers.auth(error);
}

// معالجة أخطاء الصلاحيات
try {
  await accessProtectedResource();
} catch (error) {
  await errorHandlers.permission(error);
}
```

## أنماط معالجة الأخطاء

### 1. النمط الصامت (Silent)
```typescript
await unifiedErrorHandler(error, {
  pattern: ErrorPattern.SILENT
});
```

### 2. Toast فقط
```typescript
await unifiedErrorHandler(error, {
  pattern: ErrorPattern.TOAST_ONLY,
  customMessage: 'حدث خطأ في العملية'
});
```

### 3. Console فقط
```typescript
await unifiedErrorHandler(error, {
  pattern: ErrorPattern.CONSOLE_ONLY
});
```

### 4. معالجة كاملة (افتراضي)
```typescript
await unifiedErrorHandler(error, {
  pattern: ErrorPattern.FULL,
  severity: 'high',
  context: { operation: 'user-action' }
});
```

## معالجة أخطاء النماذج

### استخدام `useFormErrorHandler`
```typescript
import { useFormErrorHandler } from '@/hooks/useErrorHandler';

function MyForm() {
  const { handleFormError, fieldErrors, getFieldError } = useFormErrorHandler();

  const handleSubmit = async (data) => {
    try {
      await submitForm(data);
    } catch (error) {
      handleFormError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {getFieldError('email') && (
        <span className="error">{getFieldError('email')}</span>
      )}
    </form>
  );
}
```

### معالجة أخطاء Zod
```typescript
import { z } from 'zod';
import { handleFormError } from '@/utils/unified-error-handler';

const schema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور قصيرة جداً')
});

function validateForm(data) {
  try {
    schema.parse(data);
  } catch (error) {
    const fieldErrors = handleFormError(error);
    return fieldErrors;
  }
}
```

## أفضل الممارسات

### 1. استخدام السياق (Context)
```typescript
await unifiedErrorHandler(error, {
  context: {
    component: 'VehicleList',
    operation: 'fetchVehicles',
    userId: user.id,
    timestamp: new Date().toISOString()
  }
});
```

### 2. تخصيص الرسائل
```typescript
await unifiedErrorHandler(error, {
  customMessage: 'فشل في تحميل قائمة المركبات',
  severity: 'medium'
});
```

### 3. معالجة الأخطاء القابلة للإعادة
```typescript
const { handleError, retry, setRetryHandler } = useErrorHandler();

useEffect(() => {
  setRetryHandler(async () => {
    try {
      await fetchData();
    } catch (error) {
      handleError(error);
    }
  });
}, []);
```

## الهيكل الهرمي للأخطاء

### 1. مستوى التطبيق
```typescript
// App.tsx
function App() {
  return (
    <ErrorBoundary context={{ level: 'app' }}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### 2. مستوى الصفحة
```typescript
// VehiclesPage.tsx
function VehiclesPage() {
  return (
    <ErrorBoundary context={{ level: 'page', page: 'vehicles' }}>
      <VehicleList />
    </ErrorBoundary>
  );
}
```

### 3. مستوى المكون
```typescript
// VehicleCard.tsx
function VehicleCard({ vehicle }) {
  const { handleError } = useErrorHandler();

  const handleAction = async () => {
    try {
      await performAction(vehicle.id);
    } catch (error) {
      handleError(error, {
        context: { 
          component: 'VehicleCard', 
          vehicleId: vehicle.id 
        }
      });
    }
  };

  return <div>{/* محتوى المكون */}</div>;
}
```

## معالجة الأخطاء في Services

### BaseService
```typescript
import { BaseService } from '@/services/base/BaseService';

class VehicleService extends BaseService {
  async getVehicles() {
    try {
      const response = await this.client.get('/vehicles');
      return this.handleSuccess(response.data);
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل المركبات');
    }
  }
}
```

### API Calls
```typescript
import { handleApiError } from '@/utils/unified-error-handler';

async function fetchVehicles() {
  try {
    const response = await fetch('/api/vehicles');
    if (!response.ok) {
      throw new Error('فشل في تحميل المركبات');
    }
    return await response.json();
  } catch (error) {
    return await handleApiError(error, {
      context: { api: 'vehicles' }
    });
  }
}
```

## تخصيص معالجة الأخطاء

### إنشاء معالج مخصص
```typescript
import { createErrorHandler } from '@/utils/unified-error-handler';

const vehicleErrorHandler = createErrorHandler({
  pattern: ErrorPattern.FULL,
  context: { module: 'vehicles' },
  severity: 'medium'
});

// استخدام المعالج المخصص
try {
  await vehicleOperation();
} catch (error) {
  await vehicleErrorHandler.handle(error);
}
```

### معالجة متخصصة لكل نوع خطأ
```typescript
function handleVehicleError(error: unknown) {
  if (error instanceof NetworkError) {
    return errorHandlers.network(error, {
      customMessage: 'فشل في الاتصال بخادم المركبات'
    });
  }
  
  if (error instanceof AuthError) {
    return errorHandlers.auth(error, {
      customMessage: 'يرجى تسجيل الدخول للوصول إلى المركبات'
    });
  }
  
  // معالجة افتراضية
  return unifiedErrorHandler(error, {
    context: { module: 'vehicles' }
  });
}
```

## المراقبة والإحصائيات

### تتبع الأخطاء
```typescript
import { errorLogger } from '@/lib/errors/error-logger';

// تسجيل الأخطاء تلقائياً
await unifiedErrorHandler(error, {
  logError: true,
  context: {
    userId: user.id,
    action: 'vehicle-search',
    timestamp: new Date().toISOString()
  }
});
```

### تقارير الأخطاء
```typescript
// الحصول على إحصائيات الأخطاء
const errorStats = await errorLogger.getErrorStats();
console.log('أخطاء اليوم:', errorStats.today);
console.log('أخطاء الأسبوع:', errorStats.thisWeek);
```

## الاختبارات

### اختبار معالجة الأخطاء
```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

test('should display error message when component throws', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText('حدث خطأ في التطبيق')).toBeInTheDocument();
});
```

## خلاصة

نظام معالجة الأخطاء الموحد يوفر:

1. **التسق**: نفس الطريقة لمعالجة الأخطاء في جميع أجزاء التطبيق
2. **المرونة**: إمكانية تخصيص المعالجة حسب الحاجة
3. **الشمولية**: تغطية جميع أنواع الأخطاء
4. **سهولة الاستخدام**: Hooks وComponents جاهزة للاستخدام
5. **المراقبة**: تسجيل وتتبع الأخطاء تلقائياً

استخدم هذا النظام في جميع أجزاء التطبيق لضمان تجربة مستخدم متسقة وموثوقة. 