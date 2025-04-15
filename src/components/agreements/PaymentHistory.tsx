
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { asPaymentId } from '@/utils/database-type-helpers';
import type { Payment, PaymentHistoryProps } from './PaymentHistory.types';

export function PaymentHistory({ 
  agreementId, 
  onAddPayment, 
  payments: providedPayments, 
  isLoading: providedIsLoading,
  rentAmount,
  onPaymentDeleted,
  leaseStartDate,
  leaseEndDate
}: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (providedPayments) {
      setPayments(providedPayments);
      setIsLoading(false);
    } else if (agreementId) {
      const fetchPayments = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('unified_payments')
            .select('*')
            .eq('lease_id', agreementId)
            .order('payment_date', { ascending: false });

          if (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load payment history');
            setPayments([]);
          } else if (data) {
            setPayments(data as Payment[]);
          }
        } catch (err) {
          console.error('Unexpected error:', err);
          toast.error('An unexpected error occurred');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPayments();
    }
  }, [agreementId, providedPayments]);

  useEffect(() => {
    if (providedIsLoading !== undefined) {
      setIsLoading(providedIsLoading);
    }
  }, [providedIsLoading]);

  const handleDeletePayment = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this payment?');
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', asPaymentId(id));
      
      if (error) {
        console.error('Error deleting payment:', error);
        toast.error('Failed to delete payment');
      } else {
        setPayments(payments.filter(payment => payment.id !== id));
        toast.success('Payment deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['agreements', agreementId] });
        if (onPaymentDeleted) {
          onPaymentDeleted();
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    }
  };

  const isLoadingState = providedIsLoading !== undefined ? providedIsLoading : isLoading;

  if (isLoadingState) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading payment history...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment History</h3>
        {onAddPayment && (
          <Button size="sm" onClick={onAddPayment}>
            Add Payment
          </Button>
        )}
      </div>
      {payments.length === 0 ? (
        <p>No payment history available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                    {payment.payment_date ? format(new Date(payment.payment_date), 'PPP') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.payment_method || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePayment(payment.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
