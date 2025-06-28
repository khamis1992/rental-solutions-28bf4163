# 💰 تحديث حقل مبلغ الضمان في تعديل العقود

تم تحديث واجهة تعديل العقود لتوضيح أن **مبلغ الضمان اختياري التغيير** وليس إجبارياً عند تعديل العقد.

## 🎯 المشكلة الأصلية

- عند تعديل العقد، لم يكن واضحاً للمستخدم أن مبلغ الضمان يمكن الاحتفاظ به كما هو
- عدم وجود نص توضيحي يوضح أن تغيير مبلغ الضمان اختياري
- قد يعتقد المستخدم أنه يجب تغيير المبلغ في كل مرة

## ✅ الحل المطبق

### 1. تحديث محرر الاتفاقيات (`AgreementEditor.tsx`)

```tsx
<FormField
  control={form.control}
  name="deposit_amount"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-right">مبلغ الضمان</FormLabel>
      <FormControl>
        <Input 
          type="number" 
          placeholder="0.00" 
          {...field}
          className="text-right"
          dir="rtl"
          onChange={(e) => {
            field.onChange(parseFloat(e.target.value) || 0);
          }}
        />
      </FormControl>
      {/* ✨ النص التوضيحي الجديد */}
      <div className="text-xs text-muted-foreground text-right">
        اختياري - يمكن الاحتفاظ بالقيمة الحالية دون تغيير
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 2. تحديث شروط العقد (`AgreementContractTerms.tsx`)

```tsx
<div className="text-xs text-muted-foreground text-right">
  اختياري - عادة ضعف قيمة الإيجار الشهري أو حسب التفاوض
</div>
```

## 🔧 كيف يعمل النظام

### عند تحميل العقد للتعديل:
1. **تحميل البيانات الأصلية:** يتم تحميل مبلغ الضمان من العقد الموجود
```typescript
deposit_amount: agreement.deposit_amount || 0,
```

2. **الاحتفاظ بالقيمة:** القيمة تظهر في الحقل ويمكن للمستخدم الاحتفاظ بها
3. **التحديث الاختياري:** المستخدم يمكنه تغيير القيمة فقط عند الحاجة

### حساب المبلغ الإجمالي:
```typescript
const calculateTotalAmount = useCallback((): void => {
  const startDate = form.getValues('start_date');
  const endDate = form.getValues('end_date');
  const rentAmount = form.getValues('rent_amount') || 0;
  const depositAmount = form.getValues('deposit_amount') || 0;
  
  if (!startDate || !endDate || rentAmount <= 0) return;
  
  const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const totalAmount = (months * rentAmount) + depositAmount;
  
  form.setValue('total_amount', parseFloat(totalAmount.toFixed(2)));
}, [form]);
```

### مراقبة التغييرات:
```typescript
// Update total when relevant values change
useEffect(() => {
  calculateTotalAmount();
}, [startDate, endDate, rentAmount, form.watch('deposit_amount'), calculateTotalAmount]);
```

## 📱 تجربة المستخدم

### قبل التحديث:
- ❌ غير واضح أن مبلغ الضمان اختياري
- ❌ قد يعتقد المستخدم أنه يجب تغييره
- ❌ عدم وجود إرشادات واضحة

### بعد التحديث:
- ✅ نص واضح يوضح أن التغيير اختياري
- ✅ يمكن الاحتفاظ بالقيمة الحالية
- ✅ إرشادات واضحة للمستخدم
- ✅ تحديث تلقائي للمبلغ الإجمالي عند التغيير

## 🎯 الفوائد

1. **وضوح أكبر:** المستخدم يعرف أن التغيير اختياري
2. **سهولة الاستخدام:** لا حاجة لتغيير القيمة إذا كانت صحيحة
3. **تجنب الأخطاء:** تقليل احتمالية تغيير القيمة بالخطأ
4. **مرونة:** يمكن تغيير القيمة عند الحاجة

## 🔍 الملفات المحدثة

1. **`src/components/agreements/edit/AgreementEditor.tsx`**
   - إضافة نص توضيحي تحت حقل مبلغ الضمان

2. **`src/components/agreements/form/AgreementContractTerms.tsx`**
   - تحديث النص التوضيحي ليكون أكثر شمولية

## 📝 ملاحظات مهمة

- ✅ النظام يحافظ على الوظائف الحالية بنسبة 100%
- ✅ لا تأثير على حساب المبلغ الإجمالي
- ✅ يعمل مع جميع أنواع العقود
- ✅ متوافق مع النظام المحاسبي
- ✅ يدعم العربية بشكل كامل

## 🚀 الاستخدام

عند تعديل العقد:
1. افتح العقد للتعديل
2. انتقل إلى قسم "التفاصيل المالية"
3. احتفظ بمبلغ الضمان كما هو أو غيره حسب الحاجة
4. النص التوضيحي سيرشدك أن التغيير اختياري

هذا التحديث يحسن تجربة المستخدم ويوضح أن **مبلغ الضمان يبقى كما هو ولا يتطلب تغيير إجباري** عند تعديل العقد. 