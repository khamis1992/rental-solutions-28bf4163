
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LegalCaseFormValues } from './LegalCaseForm';

interface LegalCaseBasicInfoProps {
  form: UseFormReturn<LegalCaseFormValues>;
}

export const LegalCaseBasicInfo: React.FC<LegalCaseBasicInfoProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="customer_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Customer ID</FormLabel>
            <FormControl>
              <Input placeholder="Customer ID" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="amount_owed"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount Owed</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="0.00" 
                {...field} 
                onChange={event => field.onChange(parseFloat(event.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="assigned_to"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assigned To (User ID)</FormLabel>
            <FormControl>
              <Input placeholder="User ID of assignee" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
