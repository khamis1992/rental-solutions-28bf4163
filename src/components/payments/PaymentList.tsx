
import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import type { Payment } from '@/components/agreements/PaymentHistory.types';

interface PaymentListProps {
  payments: Payment[];
  onDeletePayment?: (paymentId: string) => void;
}

export const PaymentList: React.FC<PaymentListProps> = React.memo(({ payments, onDeletePayment }) => {
  const memoizedPayments = useMemo(() => payments, [payments]);

  const getStatusBadge = useCallback((status: string | undefined) => {
    const style = status === 'completed' 
      ? 'bg-green-100 text-green-800 hover:bg-green-200'
      : status === 'overdue'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-red-100 text-red-800';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
        {status === 'completed' ? 'completed' : status === 'overdue' ? 'overdue' : 'Unpaid'}
      </span>
    );
  }, []);

  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const payment = memoizedPayments[index];
    return (
      <TableRow style={style} key={payment.id}>
        <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
        <TableCell>{formatCurrency(payment.amount)}</TableCell>
        <TableCell>{getStatusBadge(payment.status)}</TableCell>
        <TableCell>{payment.payment_method || 'N/A'}</TableCell>
        <TableCell className="max-w-[200px] truncate">{payment.description || 'Monthly Rent'}</TableCell>
        <TableCell className="text-right">
          {onDeletePayment && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDeletePayment(payment.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  }, [memoizedPayments, getStatusBadge, onDeletePayment]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {memoizedPayments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No payments found.
            </TableCell>
          </TableRow>
        ) : (
          <TableRow>
            <TableCell colSpan={6} style={{ padding: 0, border: 0 }}>
              <List
                height={400}
                itemCount={memoizedPayments.length}
                itemSize={56}
                width={"100%"}
              >
                {Row}
              </List>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
});

export default PaymentList;
