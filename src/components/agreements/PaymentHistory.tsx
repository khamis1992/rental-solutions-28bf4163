
import React from 'react';
import { Payment } from '@/types/payment-types.unified';
import { PaymentHistorySection } from '@/components/payments/PaymentHistorySection';

interface PaymentHistoryProps {
  payments?: Payment[];
  isLoading?: boolean;
  rentAmount?: number | null;
  contractAmount?: number | null;
  onPaymentDeleted?: (paymentId: string) => void;
  onPaymentUpdated?: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment?: (payment: Partial<Payment>) => void;
  leaseStartDate?: string | Date | null;
  leaseEndDate?: string | Date | null;
  leaseId?: string;
  onPaymentAdded?: () => void;
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
  onPaymentAdded
}: PaymentHistoryProps) {
  // Convert payments to the expected format if needed
  const formattedPayments = payments || [];

  return (
    <PaymentHistorySection 
      payments={formattedPayments} 
      isLoading={isLoading || false} 
      rentAmount={rentAmount || 0}
      contractAmount={contractAmount || 0}
      leaseId={leaseId}
      onPaymentDeleted={onPaymentDeleted || (() => {})}
      onRecordPayment={onRecordPayment || (() => {})}
      onPaymentUpdated={onPaymentUpdated || (async () => false)}
      showAnalytics={true}
      leaseStartDate={leaseStartDate}
      leaseEndDate={leaseEndDate}
    />
  );
}
