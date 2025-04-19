import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UUID } from '@/utils/database-type-helpers';

// Update any payment deletion methods to use UUID type
export const deletePayment = async (paymentId: string) => {
  try {
    const { error } = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', paymentId as UUID);
      
    if (error) {
      console.error("Error deleting payment:", error);
      throw new Error(error.message || 'An error occurred while deleting payment');
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};

interface Payment {
  id: string;
  lease_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
  onPaymentDeleted: (paymentId: string) => void;
  isLoadingPayments: boolean;
  onRefreshPayments: () => void;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments, onPaymentDeleted, isLoadingPayments, onRefreshPayments }) => {
  const handleDeletePayment = async (paymentId: string) => {
    try {
      await deletePayment(paymentId);
      toast.success('Payment deleted successfully');
      onRefreshPayments();
    } catch (error) {
      toast.error('Failed to delete payment');
    }
  };

  if (isLoadingPayments) {
    return <p>Loading payments...</p>;
  }

  if (!payments || payments.length === 0) {
    return <p>No payments recorded.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Method
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Notes
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                ${payment.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(payment.payment_date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {payment.payment_method}
              </td>
              <td className="px-6 py-4">
                {payment.notes}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePayment(payment.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
