
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
    console.log("PaymentList: Fetching payments for agreement", agreementId);
    if (agreementId) {
      fetchPayments()
        .then(() => console.log("PaymentList: Successfully fetched payments"))
        .catch(error => console.error("PaymentList: Error fetching payments:", error));
    }
  }, [agreementId, fetchPayments, refreshTrigger]);

  const handleDeletePayment = async (id: string) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this payment?");
      if (!confirmed) return;
      
      console.log("PaymentList: Deleting payment", id);
      await deletePayment(id);
      
      if (onDeletePayment) {
        onDeletePayment(id);
      }
      
      // Refresh payments
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("PaymentList: Error deleting payment:", error);
    }
  };

  const pendingPayments = calculatePendingPayments(agreementId);
  
  if (isLoading) {
    return <div className="p-4 text-center">Loading payments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Payments</h3>
          <p className="text-sm text-muted-foreground">
            {payments.length} payments recorded
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {onAddPayment && (
            <Button size="sm" onClick={onAddPayment}>
              <Plus className="h-4 w-4 mr-1" />
              Record Payment
            </Button>
          )}
        </div>
      </div>
      
      {payments.length === 0 && pendingPayments.length === 0 ? (
        <EmptyPaymentState onAddPayment={onAddPayment} />
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

// This is a temporary placeholder function until a proper implementation is developed
function calculatePendingPayments(agreementId: string): Array<{ due_date: Date; amount: number }> {
  // For now, return an empty array. This will be implemented properly in a future update.
  return [];
}
