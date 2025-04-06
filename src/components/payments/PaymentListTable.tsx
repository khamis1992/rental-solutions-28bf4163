
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Payment } from '@/types/payment';
import { useTranslation } from 'react-i18next';
import { useTranslation as useAppTranslation } from '@/contexts/TranslationContext';
import { formatDate, ensureDate } from '@/lib/date-utils';

interface PaymentListTableProps {
  payments: Payment[];
  onPaymentClick?: (payment: Payment) => void;
  onDelete?: (id: string) => void;
}

export const PaymentListTable: React.FC<PaymentListTableProps> = ({ payments, onPaymentClick, onDelete }) => {
  const { t } = useTranslation();
  const { isRTL } = useAppTranslation();
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">{t('payments.status.paid')}</Badge>;
      case 'pending':
        return <Badge variant="outline">{t('payments.status.pending')}</Badge>;
      case 'overdue':
        return <Badge variant="destructive">{t('payments.status.overdue')}</Badge>;
      case 'partial':
        return <Badge className="bg-blue-500 hover:bg-blue-600">{t('payments.status.partial')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('payments.ref')}</TableHead>
            <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('common.date')}</TableHead>
            <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('common.amount')}</TableHead>
            <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('payments.method')}</TableHead>
            <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('common.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length > 0 ? (
            payments.map((payment) => (
              <TableRow 
                key={payment.id} 
                className="cursor-pointer" 
                onClick={() => onPaymentClick?.(payment)}
              >
                <TableCell className="font-medium">
                  {payment.reference || payment.payment_number || t('common.notProvided')}
                </TableCell>
                <TableCell>
                  {ensureDate(payment.payment_date) && formatDate(ensureDate(payment.payment_date)!)}
                </TableCell>
                <TableCell>
                  QAR {payment.amount?.toLocaleString() || '0'}
                </TableCell>
                <TableCell>
                  {payment.payment_method || t('common.notProvided')}
                </TableCell>
                <TableCell>
                  {getStatusBadge(payment.status || 'paid')}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {t('payments.noRecords')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
