
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Agreement } from '@/types/agreement';
import { Payment } from '@/types/payment.types';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import { AgreementPaymentAnalytics } from '../../analytics/AgreementPaymentAnalytics';
import { CreditCard } from 'lucide-react';

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
      {/* Payment Analytics Summary */}
      <AgreementPaymentAnalytics
        totalAmount={paymentMetrics.totalAmount}
        amountPaid={paymentMetrics.amountPaid}
        balance={paymentMetrics.balance}
        lateFees={paymentMetrics.lateFees}
        paidOnTime={paymentMetrics.paidOnTime}
        paidLate={paymentMetrics.paidLate}
        unpaid={paymentMetrics.unpaid}
      />

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History & Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentHistory
            payments={payments}
            isLoading={isLoading}
            rentAmount={rentAmount}
            contractAmount={contractAmount}
            onPaymentDeleted={onPaymentDeleted}
            onPaymentUpdated={onPaymentUpdated}
            onRecordPayment={onRecordPayment}
            leaseStartDate={getDateString(agreement.start_date)}
            leaseEndDate={getDateString(agreement.end_date)}
            leaseId={agreement.id}
            agreement={agreement}
            fetchPayments={fetchPayments}
          />
        </CardContent>
      </Card>
    </div>
  );
}
