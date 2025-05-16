
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Payment } from '@/types/payment-types.unified';
import { toast } from 'sonner';
import { asUUID } from '@/lib/uuid-helpers';

interface PaymentEntryFormProps {
  leaseId: string;
  onPaymentAdded: () => void;
  onCancel: () => void;
}

const PaymentEntryForm: React.FC<PaymentEntryFormProps> = ({
  leaseId,
  onPaymentAdded,
  onCancel
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a payment record
      const paymentData = {
        lease_id: leaseId,
        amount: amount,
        payment_date: paymentDate,
        description: description,
        payment_method: paymentMethod,
        transaction_id: transactionId || undefined,
        status: 'completed',
        amount_paid: amount,
        balance: 0,
        type: 'Income'
      };

      // Insert the payment
      const { data, error } = await supabase
        .from('unified_payments')
        .insert([paymentData as any])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Payment recorded successfully');
      
      // Call the onPaymentAdded callback with the new payment
      onPaymentAdded();
      onCancel(); // Close the form

    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Date
        </label>
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="check">Check</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Transaction ID (Optional)
        </label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Record Payment'}
        </button>
      </div>
    </form>
  );
};

export default PaymentEntryForm;
