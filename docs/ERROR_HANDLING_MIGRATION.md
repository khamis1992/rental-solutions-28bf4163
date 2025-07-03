# دليل الانتقال إلى نظام معالجة الأخطاء الموحد

## نظرة عامة

هذا الدليل يوضح كيفية تحويل أنماط معالجة الأخطاء الموجودة في التطبيق إلى النظام الموحد الجديد.

## الأنماط القديمة والحلول الجديدة

### 1. معالجة الأخطاء في React Components

#### النمط القديم:
```typescript
// مثال من صفحة Vehicles
function VehiclesPage() {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/vehicles');
      if (!response.ok) {
        throw new Error('فشل في تحميل المركبات');
      }
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('حدث خطأ غير متوقع'));
      console.error('خطأ في تحميل المركبات:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}
      {/* باقي المحتوى */}
    </div>
  );
}
```

#### النمط الجديد:
```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { handleError, error, clearError } = useErrorHandler();

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      clearError();
      const response = await fetch('/api/vehicles');
      if (!response.ok) {
        throw new Error('فشل في تحميل المركبات');
      }
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      handleError(err, {
        context: { component: 'VehiclesPage', operation: 'fetchVehicles' },
        severity: 'medium'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ErrorDisplay
        error={error.error}
        showRetry={true}
        onRetry={fetchVehicles}
      />
      {/* باقي المحتوى */}
    </div>
  );
}
```

### 2. معالجة الأخطاء في Services

#### النمط القديم:
```typescript
// مثال من vehicle-api.ts
const handleApiError = (operation: string, error: any): never => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`Failed to ${operation}: ${errorMessage}`);
};

export async function getVehicles() {
  try {
    const response = await fetch('/api/vehicles');
    if (!response.ok) {
      handleApiError('fetch vehicles', new Error('Network error'));
    }
    return await response.json();
  } catch (error) {
    handleApiError('fetch vehicles', error);
  }
}
```

#### النمط الجديد:
```typescript
import { handleApiError } from '@/utils/unified-error-handler';
import { ApiResponse } from '@/types/api.types';

export async function getVehicles(): Promise<ApiResponse<Vehicle[]>> {
  try {
    const response = await fetch('/api/vehicles');
    if (!response.ok) {
      throw new Error('فشل في الاتصال بالخادم');
    }
    const data = await response.json();
    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    return await handleApiError(error, {
      context: { api: 'vehicles', operation: 'getVehicles' },
      customMessage: 'فشل في تحميل قائمة المركبات'
    });
  }
}
```

### 3. معالجة الأخطاء في Forms

#### النمط القديم:
```typescript
// مثال من نموذج إضافة مركبة
function AddVehicleForm() {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      setErrors({});
      
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          throw new Error('فشل في إضافة المركبة');
        }
        return;
      }
      
      // نجح الإرسال
      toast.success('تم إضافة المركبة بنجاح');
      
    } catch (error) {
      console.error('خطأ في إضافة المركبة:', error);
      toast.error(error.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      {errors.name && <span className="error">{errors.name}</span>}
      {/* باقي الحقول */}
    </form>
  );
}
```

#### النمط الجديد:
```typescript
import { useFormErrorHandler } from '@/hooks/useErrorHandler';
import { FormErrorDisplay } from '@/components/common/ErrorDisplay';

function AddVehicleForm() {
  const [loading, setLoading] = useState(false);
  const { handleFormError, fieldErrors, getFieldError, clearFieldErrors } = useFormErrorHandler();

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      clearFieldErrors();
      
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          // معالجة أخطاء الحقول
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            fieldErrors[field] = Array.isArray(messages) ? messages : [messages];
          });
        } else {
          throw new Error('فشل في إضافة المركبة');
        }
        return;
      }
      
      // نجح الإرسال
      toast.success('تم إضافة المركبة بنجاح');
      
    } catch (error) {
      handleFormError(error, {
        context: { form: 'AddVehicleForm' },
        customMessage: 'فشل في إضافة المركبة'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      {getFieldError('name') && (
        <span className="error">{getFieldError('name')}</span>
      )}
      
      <FormErrorDisplay fieldErrors={fieldErrors} />
      {/* باقي الحقول */}
    </form>
  );
}
```

### 4. معالجة الأخطاء في Async Operations

#### النمط القديم:
```typescript
// مثال من عملية حفظ البيانات
async function saveData(data) {
  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('فشل في الحفظ');
    }
    
    return await response.json();
  } catch (error) {
    console.error('خطأ في الحفظ:', error);
    throw error;
  }
}

// الاستخدام
function handleSave() {
  saveData(formData)
    .then(result => {
      toast.success('تم الحفظ بنجاح');
    })
    .catch(error => {
      toast.error(error.message || 'حدث خطأ في الحفظ');
    });
}
```

#### النمط الجديد:
```typescript
import { useAsyncErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { executeAsync } = useAsyncErrorHandler();

  const saveData = async (data) => {
    const response = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('فشل في الحفظ');
    }
    
    return await response.json();
  };

  const handleSave = async () => {
    const result = await executeAsync(
      () => saveData(formData),
      {
        context: { operation: 'saveData' },
        customMessage: 'فشل في حفظ البيانات'
      }
    );
    
    if (result) {
      toast.success('تم الحفظ بنجاح');
    }
  };

  return <button onClick={handleSave}>حفظ</button>;
}
```

## خطوات الانتقال

### المرحلة 1: تحديث المكونات الأساسية

1. **تحديث App.tsx**:
```typescript
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary context={{ level: 'app' }}>
      <Router>
        <Routes>
          {/* Routes */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

2. **تحديث الصفحات الرئيسية**:
```typescript
// تحديث كل صفحة لاستخدام ErrorBoundary
function VehiclesPage() {
  return (
    <ErrorBoundary context={{ page: 'vehicles' }}>
      <VehiclesList />
    </ErrorBoundary>
  );
}
```

### المرحلة 2: تحديث المكونات

1. **استبدال useState للأخطاء**:
```typescript
// قديم
const [error, setError] = useState(null);

// جديد
const { handleError, error } = useErrorHandler();
```

2. **استبدال try/catch blocks**:
```typescript
// قديم
try {
  await operation();
} catch (error) {
  setError(error);
}

// جديد
try {
  await operation();
} catch (error) {
  handleError(error, { context: { operation: 'operationName' } });
}
```

### المرحلة 3: تحديث Services

1. **تحديث BaseService**:
```typescript
// تأكد من أن جميع Services تستخدم BaseService
class MyService extends BaseService {
  async myMethod() {
    try {
      const result = await this.client.get('/api/data');
      return this.handleSuccess(result.data);
    } catch (error) {
      return this.handleError(error, 'فشل في العملية');
    }
  }
}
```

2. **تحديث API calls**:
```typescript
// استخدام handleApiError للـ API calls المستقلة
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

### المرحلة 4: تحديث Forms

1. **استخدام useFormErrorHandler**:
```typescript
import { useFormErrorHandler } from '@/hooks/useErrorHandler';

function MyForm() {
  const { handleFormError, fieldErrors, getFieldError } = useFormErrorHandler();
  
  // باقي الكود
}
```

2. **معالجة أخطاء التحقق**:
```typescript
// لأخطاء Zod
import { handleFormError } from '@/utils/unified-error-handler';

const validateForm = (data) => {
  try {
    schema.parse(data);
    return null;
  } catch (error) {
    return handleFormError(error);
  }
};
```

## قائمة التحقق للانتقال

### ✅ المكونات الأساسية
- [ ] تحديث App.tsx ليستخدم ErrorBoundary
- [ ] تحديث الصفحات الرئيسية
- [ ] إضافة ErrorDisplay للمكونات المهمة

### ✅ المكونات الفرعية
- [ ] استبدال useState للأخطاء بـ useErrorHandler
- [ ] تحديث جميع try/catch blocks
- [ ] إضافة context للأخطاء

### ✅ Services
- [ ] تحديث جميع Services لاستخدام BaseService
- [ ] تحديث API calls المستقلة
- [ ] إضافة معالجة أخطاء متخصصة

### ✅ Forms
- [ ] استخدام useFormErrorHandler
- [ ] معالجة أخطاء التحقق (Zod)
- [ ] عرض أخطاء الحقول

### ✅ الاختبار
- [ ] اختبار معالجة الأخطاء في كل مكون
- [ ] اختبار Error Boundaries
- [ ] اختبار عرض الأخطاء

## أمثلة على الملفات المحدثة

### مثال: تحديث صفحة المركبات

**الملف: `src/pages/Vehicles.tsx`**
```typescript
import React, { useState, useEffect } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { VehicleService } from '@/services/VehicleService';

function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { handleError, error, clearError, setRetryHandler } = useErrorHandler();
  const vehicleService = new VehicleService();

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      clearError();
      const result = await vehicleService.getAll();
      
      if (result.success) {
        setVehicles(result.data);
      } else {
        handleError(result.error, {
          context: { operation: 'fetchVehicles' }
        });
      }
    } catch (error) {
      handleError(error, {
        context: { 
          component: 'VehiclesPage', 
          operation: 'fetchVehicles' 
        },
        severity: 'medium'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    setRetryHandler(fetchVehicles);
  }, []);

  return (
    <ErrorBoundary context={{ page: 'vehicles' }}>
      <div className="vehicles-page">
        <h1>قائمة المركبات</h1>
        
        <ErrorDisplay
          error={error.error}
          showRetry={true}
          onRetry={fetchVehicles}
        />
        
        {loading && <div>جاري التحميل...</div>}
        
        <div className="vehicles-grid">
          {vehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default VehiclesPage;
```

### مثال: تحديث نموذج إضافة مركبة

**الملف: `src/components/vehicles/AddVehicleForm.tsx`**
```typescript
import React, { useState } from 'react';
import { useFormErrorHandler } from '@/hooks/useErrorHandler';
import { FormErrorDisplay } from '@/components/common/ErrorDisplay';
import { VehicleService } from '@/services/VehicleService';
import { vehicleSchema } from '@/schemas/vehicle.schema';

function AddVehicleForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const { handleFormError, fieldErrors, getFieldError, clearFieldErrors } = useFormErrorHandler();
  const vehicleService = new VehicleService();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      clearFieldErrors();
      
      // التحقق من صحة البيانات
      const validationResult = vehicleSchema.safeParse(formData);
      if (!validationResult.success) {
        handleFormError(validationResult.error);
        return;
      }
      
      // إرسال البيانات
      const result = await vehicleService.create(formData);
      
      if (result.success) {
        onSuccess(result.data);
        toast.success('تم إضافة المركبة بنجاح');
      } else {
        handleFormError(result.error, {
          context: { form: 'AddVehicleForm' }
        });
      }
      
    } catch (error) {
      handleFormError(error, {
        context: { form: 'AddVehicleForm', operation: 'create' },
        customMessage: 'فشل في إضافة المركبة'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormErrorDisplay fieldErrors={fieldErrors} />
      
      <div className="form-group">
        <label>اسم المركبة</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        {getFieldError('name') && (
          <span className="error">{getFieldError('name')}</span>
        )}
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'جاري الإضافة...' : 'إضافة المركبة'}
      </button>
    </form>
  );
}

export default AddVehicleForm;
```

## الخلاصة

الانتقال إلى نظام معالجة الأخطاء الموحد يوفر:

1. **التسق**: نفس الطريقة في جميع أجزاء التطبيق
2. **سهولة الصيانة**: تحديث واحد يؤثر على كل التطبيق
3. **تحسين تجربة المستخدم**: رسائل خطأ واضحة ومتسقة
4. **تتبع أفضل**: تسجيل شامل للأخطاء
5. **اختبار أسهل**: أنماط موحدة للاختبار

اتبع هذا الدليل خطوة بخطوة لضمان انتقال سلس وآمن إلى النظام الجديد. 