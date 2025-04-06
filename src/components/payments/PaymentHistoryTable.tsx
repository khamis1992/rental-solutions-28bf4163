
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ContractPayment, CarInstallmentPayment } from '@/types/payment';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useDateFormatter } from '@/lib/date-utils';
import { useTranslation } from 'react-i18next';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';

// Unified type to work with both payment types
type PaymentItem = ContractPayment | CarInstallmentPayment;

interface PaymentHistoryTableProps {
  payments: PaymentItem[];
}

export function PaymentHistoryTable({ payments }: PaymentHistoryTableProps) {
  const { t } = useTranslation();
  const { isRTL } = useContextTranslation();
  const { formatDate } = useDateFormatter();

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <Table className={isRTL ? 'rtl-direction' : ''}>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6 py-3">{t('payments.paymentNumber')}</TableHead>
            <TableHead className="px-6 py-3">{t('payments.date')}</TableHead>
            <TableHead className="px-6 py-3">{t('payments.dueDate')}</TableHead>
            <TableHead className="px-6 py-3">{t('payments.amount')}</TableHead>
            <TableHead className="px-6 py-3">{t('payments.method')}</TableHead>
            <TableHead className="px-6 py-3">{t('payments.reference')}</TableHead>
            <TableHead className="px-6 py-3">{t('common.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                {t('payments.noRecords')}
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id} className="border-b dark:border-gray-700">
                <TableCell className="px-6 py-4 font-medium">
                  {payment.payment_number}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {formatDate(payment.payment_date, 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {formatDate(payment.due_date, 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="px-6 py-4">{formatCurrency(payment.amount)}</TableCell>
                <TableCell className="px-6 py-4">{payment.payment_method || 'N/A'}</TableCell>
                <TableCell className="px-6 py-4">{payment.reference || 'N/A'}</TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={getStatusBadgeClass(payment.status)}>
                    {t(`payments.status.${payment.status.toLowerCase()}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
