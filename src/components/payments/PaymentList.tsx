
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Payment } from '@/types/agreement-types';

interface PaymentListProps {
  payments: Payment[];
  onDeletePayment?: (paymentId: string) => void;
}

export function PaymentList({ payments, onDeletePayment }: PaymentListProps) {
  const getStatusBadge = (status: string | undefined) => {
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
  };

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
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
            <TableCell>{formatCurrency(payment.amount)}</TableCell>
            <TableCell>
              {getStatusBadge(payment.status)}
            </TableCell>
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
        ))}
      </TableBody>
    </Table>
  );
}

export default PaymentList;
