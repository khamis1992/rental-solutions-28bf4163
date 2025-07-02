import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface MaintenanceCostFieldsProps {
  form: any;
}

export const MaintenanceCostFields: React.FC<MaintenanceCostFieldsProps> = ({ form }) => {
  return (
    <div dir="rtl" className="space-y-4">
      <FormField
        control={form.control}
        name="cost"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">
              التكلفة المقدرة
            </FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                {...field}
                className="text-right"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="service_provider"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">
              مقدم الخدمة
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="مقدم الخدمة" 
                {...field}
                className="text-right"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="invoice_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">
              رقم الفاتورة
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="رقم الفاتورة" 
                {...field}
                className="text-right"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="odometer_reading"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">
              قراءة العداد
            </FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="قراءة العداد"
                {...field}
                className="text-right"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
