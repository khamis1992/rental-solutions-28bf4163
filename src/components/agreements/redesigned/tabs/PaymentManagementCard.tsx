// @ts-nocheck
import { EnhancedPaymentHistorySection } from '@/components/payments/EnhancedPaymentHistorySection';
import { Payment } from '@/types/payment.types';

interface PaymentManagementCardProps {
  agreement: any;
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount: number | null;
  paymentMetrics: any;
  onPaymentDeleted: (paymentId: string) => void;
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
    <div className="space-y-6" dir="rtl">
      {/* Enhanced Payment History with Summary Cards */}
      <EnhancedPaymentHistorySection
        payments={payments}
        isLoading={isLoading}
        rentAmount={rentAmount}
        contractAmount={contractAmount}
        onPaymentDeleted={onPaymentDeleted}
        onPaymentUpdated={onPaymentUpdated}
        onRecordPayment={onRecordPayment}
        leaseId={agreement.id}
        agreement={agreement}
        fetchPayments={fetchPayments}
      />
    </div>
  );
}
