
import React from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { Payment } from './PaymentHistory.types';

interface AgreementTabsProps {
  agreement: Agreement | null;
  children: React.ReactNode;
  payments: Payment[];
  isLoadingPayments: boolean;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
  onRefreshPayments: () => void;
}

export function AgreementTabs({
  agreement,
  children,
  payments,
  isLoadingPayments,
  rentAmount,
  onPaymentDeleted,
  onRefreshPayments
}: AgreementTabsProps) {
  return (
    <div className="w-full mt-6">
      {children}
    </div>
  );
}
