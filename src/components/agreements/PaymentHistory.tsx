
import React from 'react';
import { Payment } from '@/types/payment-history.types';
import { PaymentHistorySection } from '@/components/payments/PaymentHistorySection';

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount: number | null; // Make sure contractAmount is passed through
  onPaymentDeleted: (paymentId: string) => void;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment: (payment: Partial<Payment>) => void;
  leaseStartDate: string | Date | null;
  leaseEndDate: string | Date | null;
  leaseId?: string;
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
  leaseId
}: PaymentHistoryProps) {
  return (
    <PaymentHistorySection 
      payments={payments} 
      isLoading={isLoading} 
      rentAmount={rentAmount}
      contractAmount={contractAmount} // Pass contractAmount to the PaymentHistorySection
      leaseId={leaseId}
      onPaymentDeleted={onPaymentDeleted}
      onRecordPayment={onRecordPayment}
      onPaymentUpdated={onPaymentUpdated}
      showAnalytics={true}
    />
  );
}
