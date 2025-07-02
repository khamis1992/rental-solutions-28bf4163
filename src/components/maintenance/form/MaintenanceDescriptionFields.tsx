
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';

interface MaintenanceDescriptionFieldsProps {
  form: UseFormReturn<any>;
}

export const MaintenanceDescriptionFields: React.FC<MaintenanceDescriptionFieldsProps> = ({ form }) => {
  return (
    <div dir="rtl">
      <div className="md:col-span-2">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right">
                الوصف
              </FormLabel>
              <FormControl>
                <Textarea 
                  rows={3} 
                  placeholder="وصف الصيانة" 
                  {...field}
                  className="text-right"
                  dir="rtl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="md:col-span-2">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right">
                ملاحظات
              </FormLabel>
              <FormControl>
                <Textarea 
                  rows={2} 
                  placeholder="ملاحظات إضافية" 
                  {...field}
                  className="text-right"
                  dir="rtl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
