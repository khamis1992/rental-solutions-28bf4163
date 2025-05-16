
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Payment } from '@/types/payment-types.unified';

interface PaymentEntryFormProps {
  leaseId: string;
  onSuccess?: (payment: Payment) => void;
  onCancel?: () => void;
}

export function PaymentEntryForm({ leaseId, onSuccess, onCancel }: PaymentEntryFormProps) {
  const [amount, setAmount] = React.useState<number | ''>('');
  const [paymentDate, setPaymentDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = React.useState<string>('');
  const [paymentMethod, setPaymentMethod] = React.useState<string>('cash');
  const [transactionId, setTransactionId] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount) {
      toast({ 
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);

      // Record the payment in the unified_payments table
      const paymentData = {
        lease_id: leaseId as string,
        amount: amount,
        payment_date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        description: description || 'Manual payment entry',
        payment_method: paymentMethod || 'cash',
        transaction_id: transactionId || undefined,
        status: 'paid',
        amount_paid: amount,
        balance: 0,
        type: 'Income'
      };

      const { data, error } = await supabase
        .from('unified_payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        toast({
          title: 'Success',
          description: 'Payment recorded successfully',
        });

        if (onSuccess) {
          onSuccess(data as Payment);
        }
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value !== '' ? parseFloat(e.target.value) : '')}
          min={0}
          step={0.01}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="paymentDate">Payment Date</Label>
        <Input
          id="paymentDate"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger id="paymentMethod">
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
        <Input
          id="transactionId"
          placeholder="Enter transaction ID"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Record Payment'}
        </Button>
      </div>
    </form>
  );
}
