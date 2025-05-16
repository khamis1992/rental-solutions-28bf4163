
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
  leaseId?: string;
  onPaymentAdded?: () => void;
  showAnalytics?: boolean;
  leaseStartDate?: string | Date | null;
  leaseEndDate?: string | Date | null;
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
  onPaymentAdded,
  showAnalytics = true
}: PaymentHistoryProps) {
  // We need to ensure we're using the correct type of Payment
  const formattedPayments = (payments || []) as any[];

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
      showAnalytics={showAnalytics}
      leaseStartDate={leaseStartDate as string | Date}
      leaseEndDate={leaseEndDate as string | Date}
    />
  );
}
