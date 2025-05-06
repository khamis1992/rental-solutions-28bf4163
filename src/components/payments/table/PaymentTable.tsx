
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { PaymentHistoryItem } from '@/types/payment-history.types';

interface PaymentTableProps {
  payments: PaymentHistoryItem[];
  onEditPayment: (payment: PaymentHistoryItem) => void;
  onDeletePayment?: () => void;
}

export function PaymentTable({ 
  payments, 
  onEditPayment, 
  onDeletePayment 
}: PaymentTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Paid</span>;
      case 'overdue':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Overdue</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'paid late':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Paid Late</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Due Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Late Fee</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const isDueDate = payment.due_date && new Date(payment.due_date);
            const isPaymentDate = payment.payment_date && new Date(payment.payment_date);
            
            return (
              <TableRow key={payment.id}>
                <TableCell>
                  {isDueDate ? format(new Date(payment.due_date), 'MM/dd/yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  {payment.description || `Monthly Rent - ${isDueDate ? format(new Date(payment.due_date), 'MMMM yyyy') : 'N/A'}`}
                </TableCell>
                <TableCell>QAR {formatCurrency(payment.amount)}</TableCell>
                <TableCell>
                  {isPaymentDate ? format(new Date(payment.payment_date), 'MM/dd/yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  {payment.days_overdue && payment.days_overdue > 0 && payment.status === 'completed'
                    ? getStatusBadge('paid late')
                    : getStatusBadge(payment.status)}
                </TableCell>
                <TableCell>
                  {payment.late_fine_amount ? `QAR ${formatCurrency(payment.late_fine_amount)}` : '-'}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEditPayment(payment)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {onDeletePayment && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500" 
                      onClick={onDeletePayment}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
