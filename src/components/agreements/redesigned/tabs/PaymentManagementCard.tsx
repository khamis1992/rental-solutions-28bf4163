
import React from 'react';
import { Agreement } from '@/types/agreement';
import { Payment } from '@/types/payment.types';
import { PaymentHistorySection } from '@/components/payments/redesigned/PaymentHistorySection';
import { PaymentAnalytics } from '@/components/payments/analytics/PaymentAnalytics';

interface PaymentManagementCardProps {
  agreement: Agreement;
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount: number | null;
  paymentMetrics: any;
  onPaymentDeleted: (paymentId: string) => Promise<void>;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment: (payment: Partial<Payment>) => Promise<void>;
  fetchPayments: () => void;
  getDateString: (date: string | Date) => string;
}

export function PaymentManagementCard({
  agreement,
  payments,
  isLoading,
  rentAmount,
  contractAmount,
  paymentMetrics,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  fetchPayments,
  getDateString
}: PaymentManagementCardProps) {
  return (
    <div className="space-y-6">
      {/* Enhanced Payment Analytics */}
      <PaymentAnalytics
        totalAmount={paymentMetrics.totalAmount}
        amountPaid={paymentMetrics.amountPaid}
        balance={paymentMetrics.balance}
        lateFees={paymentMetrics.lateFees}
        paidOnTime={paymentMetrics.paidOnTime}
        paidLate={paymentMetrics.paidLate}
        unpaid={paymentMetrics.unpaid}
      />

      {/* Redesigned Payment History */}
      <PaymentHistorySection 
        payments={payments} 
        isLoading={isLoading} 
        rentAmount={rentAmount}
        contractAmount={contractAmount}
        leaseId={agreement.id}
        onPaymentDeleted={onPaymentDeleted}
        onRecordPayment={onRecordPayment}
        onPaymentUpdated={onPaymentUpdated}
        showAnalytics={true}
        agreement={agreement}
        fetchPayments={fetchPayments}
      />
    </div>
  );
}
