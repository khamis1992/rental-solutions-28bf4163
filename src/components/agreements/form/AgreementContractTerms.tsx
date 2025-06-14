import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AgreementContractTermsProps {
  form: UseFormReturn<any>;
  termsAccepted: boolean;
  setTermsAccepted: (accepted: boolean) => void;
}

export const AgreementContractTerms: React.FC<AgreementContractTermsProps> = ({
  form,
  termsAccepted,
  setTermsAccepted
}) => {
  // Get payment frequency labels in Arabic
  const getPaymentFrequencyLabel = (frequency: string) => {
    const translations: { [key: string]: string } = {
      'weekly': 'أسبوعي',
      'monthly': 'شهري',
      'quarterly': 'ربع سنوي'
    };
    return translations[frequency] || frequency;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">شروط العقد والدفع</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="rent_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">مبلغ الإيجار الشهري</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    className="text-right"
                    dir="rtl"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    className="text-right"
                    dir="rtl"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
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
                    placeholder="0.00"
                    {...field}
                    className="text-right"
                    dir="rtl"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="daily_late_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">رسوم التأخير اليومية</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    className="text-right"
                    dir="rtl"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">تكرار الدفع</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                  <FormControl>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر تكرار الدفع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly" className="text-right">أسبوعي</SelectItem>
                    <SelectItem value="monthly" className="text-right">شهري</SelectItem>
                    <SelectItem value="quarterly" className="text-right">ربع سنوي</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_day"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">يوم الدفع من الشهر</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1"
                    {...field}
                    className="text-right"
                    dir="rtl"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right">ملاحظات إضافية</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="أي ملاحظات أو شروط إضافية..."
                  className="min-h-[100px] text-right"
                  dir="rtl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            أوافق على جميع الشروط والأحكام المذكورة في هذه الاتفاقية
          </label>
        </div>
      </CardContent>
    </Card>
  );
};
