
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface PendingPaymentRowProps {
  dueDate: Date;
  amount: number;
  onAddPayment: () => void;
}

export const PendingPaymentRow = ({ dueDate, amount, onAddPayment }: PendingPaymentRowProps) => {
  return (
    <TableRow className="bg-muted/30">
      <TableCell>{format(dueDate, 'dd/MM/yyyy')}</TableCell>
      <TableCell>{amount}</TableCell>
      <TableCell>
        <Badge variant="destructive">Unpaid</Badge>
      </TableCell>
      <TableCell>-</TableCell>
      <TableCell>Pending Monthly Payment</TableCell>
      <TableCell className="text-right">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddPayment}
        >
          Record Payment
        </Button>
      </TableCell>
    </TableRow>
  );
};
