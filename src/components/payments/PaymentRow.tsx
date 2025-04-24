
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { format } from 'date-fns';
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { Badge } from '@/components/ui/badge';

interface PaymentRowProps {
  payment: Payment;
  onDeletePayment: (id: string) => void;
}

export const PaymentRow = ({ payment, onDeletePayment }: PaymentRowProps) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date", error);
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch(status.toLowerCase()) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'partially_paid':
        return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const amountToDisplay = payment.amount_paid || payment.amount || 0;
  const displayAmount = typeof amountToDisplay === 'number' 
    ? `QAR ${amountToDisplay.toLocaleString()}`
    : `QAR ${amountToDisplay}`;

  return (
    <TableRow>
      <TableCell>{formatDate(payment.payment_date || payment.due_date)}</TableCell>
      <TableCell>{displayAmount}</TableCell>
      <TableCell>{getStatusBadge(payment.status)}</TableCell>
      <TableCell>{payment.payment_method || 'N/A'}</TableCell>
      <TableCell>{payment.description || 'N/A'}</TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onDeletePayment(payment.id)}
        >
          <Trash className="h-4 w-4 text-red-500" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
