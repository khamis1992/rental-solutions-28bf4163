// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Calendar, CreditCard } from 'lucide-react';

interface AgreementContractTermsProps {
  form: UseFormReturn<any>;
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
}

export const AgreementContractTerms: React.FC<AgreementContractTermsProps> = ({
  form,
  termsAccepted,
  setTermsAccepted
}) => {
  const [expectedPayments, setExpectedPayments] = useState<number>(0);
  const [totalScheduledAmount, setTotalScheduledAmount] = useState<number>(0);
  
  // تعيين القيم الافتراضية للحقول المخفية
  useEffect(() => {
    form.setValue('payment_frequency', 'monthly'); // دائماً شهري
    form.setValue('payment_day', 1); // دائماً يوم 1
    form.setValue('daily_late_fee', 120); // دائماً 120 ريال يومياً
  }, [form]);

  // Watch form values to calculate payment schedule preview - with safe defaults
  const rentAmount = form.watch('rent_amount') ?? 0;
  const depositAmount = form.watch('deposit_amount') ?? 0;
  const startDate = form.watch('start_date') ?? '';
  const endDate = form.watch('end_date') ?? '';
  const paymentFrequency = form.watch('payment_frequency') ?? 'monthly';

  // Calculate payment schedule preview
  useEffect(() => {
    if (startDate && endDate && rentAmount > 0) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
      
      let paymentsCount = 0;
      let totalAmount = 0;

      switch (paymentFrequency) {
        case 'weekly':
          paymentsCount = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
          totalAmount = paymentsCount * (rentAmount / 4); // Assuming monthly rent divided by 4
          break;
        case 'biweekly':
          paymentsCount = Math.ceil((end.getTime() - start.getTime()) / (14 * 24 * 60 * 60 * 1000));
          totalAmount = paymentsCount * (rentAmount / 2); // Assuming monthly rent divided by 2
          break;
        case 'quarterly':
          paymentsCount = Math.ceil(monthsDiff / 3);
          totalAmount = paymentsCount * (rentAmount * 3);
          break;
        default: // monthly
          paymentsCount = monthsDiff;
          totalAmount = paymentsCount * rentAmount;
      }

      // Add deposit if specified
      if (depositAmount > 0) {
        paymentsCount += 1;
        totalAmount += depositAmount;
      }

      setExpectedPayments(paymentsCount);
      setTotalScheduledAmount(totalAmount);
      
      // Update total amount in form only if it has changed to prevent controlled/uncontrolled issues
      const currentTotal = form.getValues('total_amount');
      if (currentTotal !== totalAmount) {
        form.setValue('total_amount', totalAmount);
      }
    }
  }, [rentAmount, depositAmount, startDate, endDate, paymentFrequency, form]);

  // Get payment frequency labels in Arabic
  const getPaymentFrequencyLabel = (frequency: string) => {
    const translations: { [key: string]: string } = {
      'weekly': 'أسبوعي',
      'biweekly': 'كل أسبوعين',
      'monthly': 'شهري',
      'quarterly': 'ربع سنوي'
    };
    return translations[frequency] || frequency;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          شروط العقد والدفع
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" dir="rtl">
        {/* Payment Schedule Preview */}
        {expectedPayments > 0 && (
          <Alert>
            <Calculator className="h-4 w-4" />
            <AlertDescription className="text-right">
              <div className="space-y-1">
                <div className="font-medium">معاينة جدولة الدفعات:</div>
                <div>عدد الدفعات المتوقعة: <span className="font-bold text-blue-600">{expectedPayments}</span> دفعة</div>
                <div>إجمالي المبلغ: <span className="font-bold text-green-600">{formatCurrency(totalScheduledAmount)}</span></div>
                <div className="text-sm text-muted-foreground">
                  سيتم توليد جدولة الدفعات تلقائياً عند حفظ الاتفاقية
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="rent_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right flex items-center gap-2">
                  مبلغ الإيجار الشهري
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1250.00"
                    {...field}
                    value={field.value ?? ''}
                    className="text-right"
                    dir="rtl"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground text-right">
                  القيمة بالريال القطري
                </div>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deposit_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">مبلغ الضمان</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="2500.00"
                    {...field}
                    value={field.value ?? ''}
                    className="text-right"
                    dir="rtl"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground text-right">
                  إدخال يدوي - مبلغ التأمين المطلوب من العميل
                </div>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          {/* تكرار الدفع ويوم الدفع محددين تلقائياً: شهري في يوم 1 */}
          {/* تم إخفاء هذه الحقول وتعيينها تلقائياً */}

          <FormField
            control={form.control}
            name="total_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">المبلغ الإجمالي</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    className="text-right bg-gray-50"
                    dir="rtl"
                    readOnly
                    disabled
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground text-right">
                  يتم حساب هذا المبلغ تلقائياً
                </div>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          {/* رسوم التأخير محددة تلقائياً بـ 120 ريال يومياً */}
          {/* تم إخفاء هذا الحقل وتعيينه تلقائياً */}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right">ملاحظات إضافية</FormLabel>
                              <FormControl>
                <Textarea
                  placeholder="أي ملاحظات أو شروط إضافية للاتفاقية..."
                  className="min-h-[100px] text-right"
                  dir="rtl"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />

        {/* تم حذف بطاقة معلومات الدفعات كما طُلب */}

        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={setTermsAccepted}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-right"
          >
            أوافق على جميع الشروط والأحكام المذكورة في هذه الاتفاقية وأؤكد صحة البيانات المدخلة
          </label>
        </div>
      </CardContent>
    </Card>
  );
};
