# 🧪 دليل نظام الاختبارات الشامل

## نظرة عامة
تم تطوير نظام اختبارات شامل ومحترف للنظام باستخدام **Vitest** و **React Testing Library** مع دعم كامل للغة العربية و RTL.

---

## 🛠️ الأدوات المستخدمة

### أدوات الاختبار الرئيسية
- **Vitest** `v2.1.5` - إطار عمل الاختبارات السريع
- **@testing-library/react** `v14.3.1` - اختبار مكونات React
- **@testing-library/jest-dom** `v6.4.8` - Matchers إضافية للـ DOM
- **@testing-library/user-event** `v14.5.2` - محاكاة تفاعل المستخدم
- **jsdom** `v25.0.1` - بيئة DOM للاختبارات
- **@vitest/ui** `v2.1.5` - واجهة مستخدم للاختبارات
- **@vitest/coverage-v8** `v2.1.5` - تقارير التغطية

### أدوات المحاكاة
- **MSW** `v2.4.9` - محاكاة API calls
- **Vitest Mocks** - محاكاة الوحدات والدوال

---

## 📁 هيكل ملفات الاختبار

```
src/
├── __tests__/
│   ├── setup.ts                     # إعداد شامل للاختبارات
│   └── integration/
│       └── app-integration.test.tsx # اختبارات التكامل
├── components/
│   └── __tests__/
│       ├── Button.test.tsx          # اختبار مكون الأزرار
│       └── CustomerCard.test.tsx    # اختبار بطاقة العميل
├── hooks/
│   └── __tests__/
│       └── use-customer-query.test.ts # اختبار hooks العملاء
├── services/
│   └── __tests__/
│       └── CustomerService.test.ts   # اختبار خدمات العملاء
└── utils/
    └── __tests__/
        └── arabic-text-utils.test.ts # اختبار أدوات النصوص العربية
```

---

## 🚀 أوامر التشغيل

### الأوامر الأساسية
```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل الاختبارات مرة واحدة
npm run test:run

# تشغيل الاختبارات مع المراقبة التلقائية
npm run test:watch

# تشغيل واجهة المستخدم للاختبارات
npm run test:ui

# تشغيل تقرير التغطية
npm run test:coverage
```

### أوامر متخصصة
```bash
# اختبار المكونات فقط
npm run test:components

# اختبار الخدمات فقط
npm run test:services

# اختبار الـ hooks فقط
npm run test:hooks

# اختبارات التكامل فقط
npm run test:integration
```

---

## 🔧 إعدادات الاختبار

### ملف الإعداد الرئيسي (`src/__tests__/setup.ts`)
يحتوي على:
- **Mock للـ Browser APIs**: `localStorage`, `sessionStorage`, `fetch`
- **Mock للـ Observer APIs**: `ResizeObserver`, `IntersectionObserver`
- **Mock لـ Supabase Client**: محاكاة كاملة لعمليات قاعدة البيانات
- **مولدات البيانات التجريبية**: `createMockCustomer`, `createMockVehicle`, إلخ
- **Custom Matchers للعربية**: `toBeValidArabicText`, `toHaveRTLDirection`

### إعدادات Vitest (`vite.config.ts`)
```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/__tests__/setup.ts'],
  css: true,
  reporters: ['verbose'],
  coverage: {
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/__tests__/',
      '**/*.d.ts',
      '**/*.config.*'
    ]
  }
}
```

---

## 📝 أنواع الاختبارات

### 1. اختبارات المكونات (Components)
**الهدف**: التأكد من عرض المكونات بشكل صحيح والتفاعل معها
```typescript
// مثال: اختبار مكون الأزرار
describe('Button Component', () => {
  it('should render button with Arabic text', () => {
    render(<Button>إضافة عميل جديد</Button>);
    expect(screen.getByText('إضافة عميل جديد')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>انقر هنا</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. اختبارات الخدمات (Services)
**الهدف**: اختبار منطق الأعمال وتفاعل API
```typescript
// مثال: اختبار خدمة العملاء
describe('CustomerService', () => {
  it('should fetch customers successfully', async () => {
    const mockCustomers = [createMockCustomer()];
    mockSupabaseClient.from().select().mockResolvedValue({
      data: mockCustomers,
      error: null
    });

    const result = await CustomerService.fetchCustomers();
    expect(result.data).toEqual(mockCustomers);
  });
});
```

### 3. اختبارات الـ Hooks
**الهدف**: اختبار حالة التطبيق وإدارة البيانات
```typescript
// مثال: اختبار hook العملاء
describe('useCustomerQuery Hook', () => {
  it('should fetch customers successfully', async () => {
    const { result } = renderHook(() => useCustomerQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### 4. اختبارات الأدوات (Utils)
**الهدف**: اختبار الدوال المساعدة والمعالجات
```typescript
// مثال: اختبار أدوات النصوص العربية
describe('Arabic Text Utils', () => {
  it('should format QAR currency correctly', () => {
    const formatted = formatCurrency(1500);
    expect(formatted).toContain('1,500');
    expect(formatted).toContain('ريال');
  });
});
```

### 5. اختبارات التكامل (Integration)
**الهدف**: اختبار تفاعل المكونات مع بعضها البعض
```typescript
// مثال: اختبار بنية التطبيق
describe('App Integration Tests', () => {
  it('should render app structure without crashing', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    expect(screen.getByTestId('test-app')).toBeInTheDocument();
  });
});
```

---

## 🎯 معايير جودة الاختبارات

### معايير التغطية المطلوبة
- **الخطوط (Lines)**: 80%+
- **الدوال (Functions)**: 85%+
- **الفروع (Branches)**: 75%+
- **العبارات (Statements)**: 80%+

### قواعد كتابة الاختبارات
1. **وصف واضح**: كل اختبار يجب أن يوضح ما يفعله
2. **الترتيب**: Arrange → Act → Assert
3. **استقلالية**: كل اختبار مستقل عن الآخرين
4. **السرعة**: الاختبارات يجب أن تكون سريعة (<100ms)
5. **موثوقية**: نتائج ثابتة في كل تشغيل

### اختبار دعم العربية والـ RTL
```typescript
// اختبار النصوص العربية
expect(screen.getByText('مرحباً بك')).toBeInTheDocument();

// اختبار اتجاه RTL
expect(element).toHaveRTLDirection();

// اختبار الأرقام العربية
expect(convertToArabicNumerals('123')).toBe('١٢٣');
```

---

## 🔍 المراقبة والتحليل

### تقارير التغطية
```bash
# إنشاء تقرير HTML للتغطية
npm run test:coverage

# عرض التقرير في المتصفح
open coverage/index.html
```

### واجهة المستخدم للاختبارات
```bash
# تشغيل واجهة Vitest UI
npm run test:ui

# الوصول للواجهة
http://localhost:51204/__vitest__/
```

---

## 🐛 تشخيص المشاكل

### مشاكل شائعة وحلولها

#### 1. خطأ "Module not found"
```bash
# التأكد من تثبيت المكتبات
npm install

# فحص مسارات الاستيراد
# استخدام @ للمسارات المطلقة
```

#### 2. مشاكل Mock
```typescript
// التأكد من Mock قبل الاستيراد
vi.mock('@/lib/supabase', () => ({ ... }));

// استخدام dynamic imports عند الحاجة
const { useCustomerQuery } = await import('@/hooks/customers/use-customer-query');
```

#### 3. مشاكل async/await
```typescript
// استخدام waitFor للعمليات غير المتزامنة
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});
```

#### 4. مشاكل DOM
```typescript
// التأكد من تنظيف DOM بعد كل اختبار
afterEach(() => {
  cleanup();
});
```

---

## 📊 إحصائيات النظام

### الاختبارات المُنجزة
- ✅ **اختبارات المكونات**: 2 ملف
- ✅ **اختبارات الخدمات**: 1 ملف
- ✅ **اختبارات الـ Hooks**: 1 ملف
- ✅ **اختبارات الأدوات**: 1 ملف
- ✅ **اختبارات التكامل**: 1 ملف

### المكتبات المُعدة
- ✅ **Vitest + React Testing Library**
- ✅ **إعدادات شاملة للمحاكاة**
- ✅ **دعم العربية والـ RTL**
- ✅ **أوامر npm متخصصة**
- ✅ **تقارير التغطية**

---

## 🚀 الخطوات التالية

### توسعات مقترحة
1. **اختبارات E2E** باستخدام Playwright
2. **اختبارات الأداء** للمكونات الثقيلة
3. **اختبارات الأمان** للبيانات الحساسة
4. **اختبارات الوصولية** (Accessibility)
5. **اختبارات التوافق** مع المتصفحات

### أتمتة CI/CD
```yaml
# مثال GitHub Actions
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
```

---

## 📞 الدعم

للحصول على المساعدة:
1. **فحص الوثائق**: هذا الدليل
2. **مراجعة الأخطاء**: تحقق من console logs
3. **اختبار بسيط**: ابدأ بـ `npm test`
4. **مراجعة الإعدادات**: تأكد من `vite.config.ts`

---

**💡 نصيحة**: ابدأ بتشغيل `npm run test:ui` للحصول على واجهة تفاعلية جميلة للاختبارات!

---
*تم إنشاء هذا الدليل كجزء من نظام الاختبارات الشامل للمشروع* 🎯 