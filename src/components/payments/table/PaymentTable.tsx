
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Payment } from '@/types/payment-types.unified';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentTableProps {
  payments: Payment[];
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (paymentId: string) => void;
}

export function PaymentTable({ 
  payments, 
  onEditPayment, 
  onDeletePayment 
}: PaymentTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'voided':
        return <Badge variant="secondary">Voided</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPaymentDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not paid';
    
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No payment records found
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatPaymentDate(payment.payment_date)}</TableCell>
                <TableCell>
                  {payment.description || 'Monthly Rent'}
                  {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                    <span className="ml-2 text-xs text-red-500">
                      (Late fee: {formatCurrency(payment.late_fine_amount)})
                    </span>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{payment.payment_method || 'Not specified'}</TableCell>
                <TableCell>{getStatusBadge(payment.status || '')}</TableCell>
                <TableCell className="text-right space-x-2">
                  {onEditPayment && (
                    <Button 
                      onClick={() => onEditPayment(payment)} 
                      size="sm" 
                      variant="ghost"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  )}
                  {onDeletePayment && (
                    <Button 
                      onClick={() => onDeletePayment(payment.id)} 
                      size="sm" 
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
