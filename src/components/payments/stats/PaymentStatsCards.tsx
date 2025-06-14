
import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface PaymentStatsCardsProps {
  totalAmount: number;
  amountPaid: number;
  balance: number;
  lateFees: number;
}

export function PaymentStatsCards({
  totalAmount,
  amountPaid,
  balance,
  lateFees
}: PaymentStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
        <p className="text-xl font-bold text-gray-800">QAR {formatCurrency(totalAmount)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
        <p className="text-xl font-bold text-green-600">QAR {formatCurrency(amountPaid)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Balance</p>
        <p className="text-xl font-bold text-amber-600">QAR {formatCurrency(balance)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Late Fees</p>
        <p className="text-xl font-bold text-red-600">QAR {formatCurrency(lateFees)}</p>
      </div>
    </div>
  );
}
