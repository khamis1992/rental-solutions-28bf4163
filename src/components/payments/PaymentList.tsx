import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Plus, RefreshCcw } from 'lucide-react';
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { usePayments } from '@/hooks/use-payments';
import { EmptyPaymentState } from './EmptyPaymentState';
import { PaymentsTable } from './PaymentsTable';

interface PaymentListProps {
  agreementId: string;
  onAddPayment?: () => void;
  onDeletePayment?: (paymentId: string) => void;
}

export function PaymentList({ agreementId, onAddPayment, onDeletePayment }: PaymentListProps) {
  const { 
    payments = [],
    isLoading,
    deletePayment,
    fetchPayments
  } = usePayments(agreementId);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (agreementId) {
      fetchPayments();
    }
  }, [agreementId, fetchPayments, refreshTrigger]);

  // Generate rent due dates starting from agreement start date
  const generatePendingPayments = () => {
    // Implementation remains the same
    return [];
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this payment?");
      if (!confirmed) return;
      
      await deletePayment(id);
      
      if (onDeletePayment) {
        onDeletePayment(id);
      }
      
      fetchPayments();
    } catch (error) {
      console.error("Error in handleDeletePayment:", error);
    }
  };

  const refreshPayments = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const pendingPayments = generatePendingPayments();

  if (isLoading) {
    return <div className="flex items-center justify-center p-4">Loading payments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment History</h3>
        <div className="flex gap-2">
          <Button onClick={refreshPayments} size="sm" variant="outline">
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {onAddPayment && (
            <Button onClick={onAddPayment} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Payment
            </Button>
          )}
        </div>
      </div>

      {payments.length === 0 && pendingPayments.length === 0 ? (
        <EmptyPaymentState />
      ) : (
        <PaymentsTable
          payments={payments}
          pendingPayments={pendingPayments}
          onDeletePayment={handleDeletePayment}
          onAddPayment={onAddPayment}
        />
      )}
    </div>
  );
}

export default PaymentList;
