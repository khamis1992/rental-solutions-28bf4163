
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentScheduleSectionProps {
  control: Control<any>;
}

export const PaymentScheduleSection: React.FC<PaymentScheduleSectionProps> = ({ control }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">جدولة الدفعات</CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
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
            control={control}
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
      </CardContent>
    </Card>
  );
};
