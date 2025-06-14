
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Calendar, DollarSign } from 'lucide-react';

interface PaymentItem {
  id: string;
  dueDate: Date;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  type: string;
  isProjected: boolean;
}

interface UnifiedPaymentTableProps {
  payments: PaymentItem[];
  onRecordPayment: (payment: PaymentItem) => void;
  isLoading: boolean;
  showProjectedPayments: boolean;
}

export function UnifiedPaymentTable({
  payments,
  onRecordPayment,
  isLoading,
  showProjectedPayments
}: UnifiedPaymentTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-t-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No payment records found</p>
        {showProjectedPayments && (
          <p className="text-sm mt-2">Payment schedule could not be generated</p>
        )}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 text-white">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Due Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className={payment.isProjected ? 'bg-blue-50' : ''}>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  {formatDate(payment.dueDate)}
                </div>
              </TableCell>
              <TableCell>{payment.description}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                  {formatCurrency(payment.amount)}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(payment.status)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {payment.type}
                </Badge>
              </TableCell>
              <TableCell>
                {payment.isProjected && payment.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRecordPayment(payment)}
                  >
                    Record Payment
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
