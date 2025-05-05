
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from 'react-hook-form';
import { Agreement } from '@/types/agreement';

interface AgreementContractTermsProps {
  form: UseFormReturn<Agreement>;
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
}

export const AgreementContractTerms: React.FC<AgreementContractTermsProps> = ({ 
  form, 
  termsAccepted, 
  setTermsAccepted 
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Contract Terms & Dates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <DatePicker
                date={field.value instanceof Date ? field.value : new Date(field.value)}
                setDate={(date) => {
                  if (date) {
                    field.onChange(date);
                  }
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date</FormLabel>
              <DatePicker
                date={field.value instanceof Date ? field.value : new Date(field.value)}
                setDate={(date) => {
                  if (date) {
                    field.onChange(date);
                  }
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rent_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Rent (QAR)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
              <FormLabel>Security Deposit (QAR)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
              <FormLabel>Total Contract Value (QAR)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
              <FormLabel>Daily Late Fee (QAR)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes or comments" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex items-center space-x-2 mt-4">
        <Switch 
          id="terms" 
          checked={termsAccepted}
          onCheckedChange={setTermsAccepted}
        />
        <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          I confirm that all agreement terms have been explained to the customer
        </label>
      </div>
    </div>
  );
};
