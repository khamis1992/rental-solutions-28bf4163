
import React from 'react';
import { useParams } from 'react-router-dom';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import PageContainer from '@/components/layout/PageContainer';
import { usePayments } from '@/hooks/use-payments';

const PaymentHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const { payments, isLoading, onPaymentDeleted, fetchPayments } = usePayments(id || '');

  return (
    <PageContainer
      title="Payment History"
      description="View and manage payment records"
      backLink={`/agreements/${id}`}
    >
      <PaymentHistory
        payments={payments || []}
        onPaymentDeleted={onPaymentDeleted}
        isLoadingPayments={isLoading}
        onRefreshPayments={fetchPayments}
      />
    </PageContainer>
  );
};

export default PaymentHistoryPage;
