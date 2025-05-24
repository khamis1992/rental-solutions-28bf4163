
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, Eye } from 'lucide-react';
import { ScheduledPayment } from '@/utils/payment-schedule-generator';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

interface UnifiedPaymentTableProps {
  payments: ScheduledPayment[];
  onRecordPayment?: (payment: ScheduledPayment) => void;
  onViewPayment?: (payment: ScheduledPayment) => void;
  isLoading?: boolean;
  showProjectedPayments?: boolean;
}

export function UnifiedPaymentTable({
  payments,
  onRecordPayment,
  onViewPayment,
  isLoading = false,
  showProjectedPayments = true
}: UnifiedPaymentTableProps) {
  
  const getStatusBadge = (payment: ScheduledPayment) => {
    const { status, isProjected } = payment;
    
    if (isProjected && showProjectedPayments) {
      return <Badge variant="outline" className="text-blue-600">Projected</Badge>;
    }
    
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredPayments = showProjectedPayments 
    ? payments 
    : payments.filter(p => !p.isProjected);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-8 h-8 border-t-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  if (filteredPayments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No payment schedule available</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Due Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPayments.map((payment) => (
            <TableRow key={payment.id} className={payment.isProjected ? 'bg-blue-50/50' : ''}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(payment.dueDate)}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{payment.description}</p>
                  {payment.monthNumber && (
                    <p className="text-sm text-muted-foreground">
                      Month {payment.monthNumber}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  {formatCurrency(payment.amount)}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(payment)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {payment.isProjected && onRecordPayment && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRecordPayment(payment)}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Record
                    </Button>
                  )}
                  {!payment.isProjected && onViewPayment && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewPayment(payment)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
