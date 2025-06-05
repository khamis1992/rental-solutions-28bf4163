import React from 'react';
import { Payment } from '@/types/payment.types';
import { PaymentHistorySection } from '@/components/payments/PaymentHistorySection';
import { Agreement } from '@/types/agreement';

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: (paymentId: string) => void;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment: (payment: Partial<Payment>) => Promise<void>;
  leaseStartDate: string | Date | null;
  leaseEndDate: string | Date | null;
  leaseId?: string;
  agreement?: Agreement | null;
  fetchPayments?: () => void;
}

export function PaymentHistory({
  payments,
  isLoading,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  leaseStartDate,
  leaseEndDate,
  leaseId,
  agreement,
  fetchPayments
}: PaymentHistoryProps) {
  return (
    <PaymentHistorySection 
      payments={payments} 
      isLoading={isLoading} 
      rentAmount={rentAmount}
      contractAmount={contractAmount}
      leaseId={leaseId}
      onPaymentDeleted={onPaymentDeleted}
      onRecordPayment={onRecordPayment}
      onPaymentUpdated={onPaymentUpdated}
      showAnalytics={true}
      agreement={agreement}
      fetchPayments={fetchPayments}
    />
  );
}
