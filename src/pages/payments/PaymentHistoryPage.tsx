
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import PageContainer from '@/components/layout/PageContainer';
import { usePayments } from '@/hooks/use-payments';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';

const PaymentHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const { payments, isLoading, onPaymentDeleted, fetchPayments } = usePayments(id || '');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const handlePaymentSubmit = async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    targetPaymentId?: string
  ) => {
    await fetchPayments();
    setIsPaymentDialogOpen(false);
  };

  return (
    <PageContainer
      title="Payment History"
      description="View and manage payment records"
      backLink={`/agreements/${id}`}
    >
      <div className="mb-6">
        <Button 
          onClick={() => setIsPaymentDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </Button>
      </div>

      <PaymentHistory
        payments={payments || []}
        onPaymentDeleted={onPaymentDeleted}
        isLoadingPayments={isLoading}
        onRefreshPayments={fetchPayments}
      />

      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={handlePaymentSubmit}
        title="Record Payment"
        description="Enter payment details to record a payment"
      />
    </PageContainer>
  );
};

export default PaymentHistoryPage;
