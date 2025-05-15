
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { handleSupabaseResponse } from '@/types/database-types';

interface PaymentEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  onPaymentComplete?: () => void;
}

const PaymentEntryForm: React.FC<PaymentEntryFormProps> = ({
  open,
  onOpenChange,
  agreementId,
  onPaymentComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastPayment, setLastPayment] = useState<{
    id: string;
    payment_date: string;
    amount: number;
  } | null>(null);
  
  const form = useForm({
    defaultValues: {
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
      method: 'cash',
      reference: ''
    }
  });

  // Fetch last payment for this agreement
  useEffect(() => {
    if (!open || !agreementId) return;

    const fetchLastPayment = async () => {
      try {
        const response = await supabase
          .from('unified_payments')
          .select('id, payment_date, amount')
          .eq('lease_id', agreementId)
          .order('payment_date', { ascending: false })
          .limit(1)
          .single();

        const data = handleSupabaseResponse(response);
        
        if (data) {
          setLastPayment({
            id: data.id,
            payment_date: data.payment_date,
            amount: data.amount
          });
        }
      } catch (error) {
        console.error('Error fetching last payment:', error);
      }
    };

    fetchLastPayment();
  }, [open, agreementId]);

  const handleSubmit = async (values: any) => {
    if (!agreementId) return;
    
    setIsLoading(true);
    
    try {
      // Record payment in the database
      const { error } = await supabase
        .from('unified_payments')
        .insert({
          lease_id: agreementId,
          amount: values.amount,
          payment_date: values.paymentDate,
          description: values.notes || 'Payment',
          payment_method: values.method,
          transaction_id: values.reference,
          status: 'completed',
          amount_paid: values.amount,
          balance: 0,
          type: 'regular_payment'
        });

      if (error) throw error;
      
      // Close dialog and refresh data
      onOpenChange(false);
      if (onPaymentComplete) onPaymentComplete();
      
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record New Payment</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {lastPayment && (
              <div className="p-3 bg-slate-50 rounded-md text-sm">
                <p className="font-medium">Last payment:</p>
                <p>
                  {formatCurrency(lastPayment.amount)} on {new Date(lastPayment.payment_date).toLocaleDateString()}
                </p>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (QAR)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number (Optional)</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentEntryForm;
