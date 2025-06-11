
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';

interface PaymentScheduleSectionProps {
  control: Control<any>;
}

export function PaymentScheduleSection({ control }: PaymentScheduleSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Schedule</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="payment_frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || 'monthly'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
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
              <FormLabel>Payment Day of Month</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1} 
                  max={31} 
                  placeholder="1"
                  value={field.value || 1}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
