
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Payment } from '@/hooks/use-payments';
import { formatCurrency } from '@/lib/utils';

interface PaymentRowProps {
  payment: Payment;
  onDeletePayment: (id: string) => void;
}

export const PaymentRow = ({ payment, onDeletePayment }: PaymentRowProps) => {
  return (
    <TableRow>
      <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
      <TableCell>{formatCurrency(payment.amount)}</TableCell>
      <TableCell>
        <Badge 
          variant={payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'outline' : 'secondary'}
        >
          {payment.status}
        </Badge>
      </TableCell>
      <TableCell>{payment.payment_method || 'N/A'}</TableCell>
      <TableCell className="max-w-[200px] truncate">{payment.description || 'Payment'}</TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDeletePayment(payment.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
};
