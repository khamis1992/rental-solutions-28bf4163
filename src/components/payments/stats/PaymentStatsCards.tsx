// @ts-nocheck
/* eslint-disable */

import { formatCurrency } from '@/lib/utils';

interface PaymentStatsCardsProps {
  totalAmount: number;
  amountPaid: number;
  balance: number;
  lateFees: number;
}

// Helper function to format currency with English digits
const formatArabicCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(amount);
};

export function PaymentStatsCards({
  totalAmount,
  amountPaid,
  balance,
  lateFees
}: PaymentStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" dir="rtl">
      <div className="bg-white p-4 rounded-lg shadow-sm text-right">
        <p className="text-sm font-medium text-muted-foreground">إجمالي المبلغ</p>
        <p className="text-xl font-bold text-gray-800">{formatArabicCurrency(totalAmount)} ر.ق</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm text-right">
        <p className="text-sm font-medium text-muted-foreground">إجمالي المدفوع</p>
        <p className="text-xl font-bold text-green-600">{formatArabicCurrency(amountPaid)} ر.ق</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm text-right">
        <p className="text-sm font-medium text-muted-foreground">الرصيد المتبقي</p>
        <p className="text-xl font-bold text-amber-600">{formatArabicCurrency(balance)} ر.ق</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm text-right">
        <p className="text-sm font-medium text-muted-foreground">رسوم التأخير</p>
        <p className="text-xl font-bold text-red-600">{formatArabicCurrency(lateFees)} ر.ق</p>
      </div>
    </div>
  );
}
