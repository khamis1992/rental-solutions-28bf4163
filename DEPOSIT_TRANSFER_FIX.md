# إصلاح نقل مبلغ الضمان من معالج العقود إلى نموذج الاتفاقية

## المشكلة
مبلغ الضمان المدخل في معالج العقود لا ينتقل إلى نموذج الاتفاقية، ويظهر فارغاً.

## التشخيص
1. **معالج العقود** يرسل البيانات بشكل صحيح:
   ```typescript
   contractData: {
     contract: {
       depositAmount: editableData.contract.depositAmount
     }
   }
   ```

2. **AgreementWithCustomerSteps** كان لا يحفظ `depositAmount` في `formattedContractData`

## الحل المطبق

### 1. إضافة deposit_amount إلى formattedContractData
```typescript
const formattedContractData = {
  // بيانات التاريخ والمبالغ من العقد المستخرج
  start_date: startDate,
  monthly_rent: contractData.contract?.monthlyRent || 0,
  contract_duration_months: contractData.contract?.contractDuration || 12,
  deposit_amount: contractData.contract?.depositAmount || 0, // ← إضافة جديدة
  
  // ... باقي البيانات
};
```

### 2. إضافة تتبع البيانات
```typescript
console.log('💰 مبلغ الضمان المستخرج:', formattedContractData.deposit_amount);
```

### 3. التأكد من تمرير البيانات لنموذج الاتفاقية
```typescript
// في initialData
deposit_amount: contractData.deposit_amount || 0,
```

## الملفات المحدثة
- `src/components/agreements/AgreementWithCustomerSteps.tsx`
  - إضافة `deposit_amount` إلى `formattedContractData`
  - إضافة console.log للتتبع

## النتيجة المتوقعة
✅ مبلغ الضمان المدخل في معالج العقود سينتقل الآن بشكل صحيح إلى نموذج الاتفاقية

## طريقة التحقق
1. اذهب إلى `/agreements/add`
2. اختر "معالجة عقد إيجار سيارة"
3. ارفع أي صورة واستخرج البيانات
4. أدخل مبلغ الضمان يدوياً (مثل 5000)
5. اضغط "متابعة إلى نموذج الاتفاقية"
6. يجب أن يظهر مبلغ الضمان 5000 في نموذج الاتفاقية

## المسار الكامل للبيانات
```
معالج العقود (CarRentalContractProcessor)
  ↓ depositAmount
handleContractDataExtracted (AgreementWithCustomerSteps)  
  ↓ deposit_amount
AgreementForm (initialData)
  ↓ deposit_amount
نموذج الاتفاقية النهائي
``` 