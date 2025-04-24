
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

interface PendingPaymentRowProps {
  dueDate: Date;
  amount: number;
  onAddPayment: () => void;
}

export const PendingPaymentRow = ({ dueDate, amount, onAddPayment }: PendingPaymentRowProps) => {
  const formatDate = (date: Date) => {
    try {
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date", error);
      return 'Invalid date';
    }
  };
  
  const displayAmount = `QAR ${amount.toLocaleString()}`;

  return (
    <TableRow className="bg-muted/20">
      <TableCell>{formatDate(dueDate)}</TableCell>
      <TableCell>{displayAmount}</TableCell>
      <TableCell><Badge variant="outline">Scheduled</Badge></TableCell>
      <TableCell>--</TableCell>
      <TableCell>Upcoming payment</TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onAddPayment}
        >
          <Plus className="h-4 w-4 text-green-500" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
