
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import { CarInstallmentPayment } from '@/types/car-installment';
import { formatCurrency } from '@/lib/utils';

interface ContractPaymentsTableProps {
  payments: CarInstallmentPayment[];
  onRecordPayment: (payment: CarInstallmentPayment) => void;
}

export const ContractPaymentsTable: React.FC<ContractPaymentsTableProps> = ({ 
  payments, 
  onRecordPayment 
}) => {
  // Format date to local date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get status icon based on payment status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Get status text with appropriate color
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="text-green-500 font-medium">Paid</span>;
      case 'pending':
        return <span className="text-amber-500 font-medium">Pending</span>;
      case 'overdue':
        return <span className="text-red-500 font-medium">Overdue</span>;
      case 'cancelled':
        return <span className="text-gray-500 font-medium">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-md border">
      {payments.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No payments found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add a payment to get started
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Date</TableHead>
              <TableHead>Cheque #</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Paid Amount</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell>{payment.cheque_number}</TableCell>
                <TableCell>{payment.drawee_bank}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{formatCurrency(payment.paid_amount || 0)}</TableCell>
                <TableCell>{formatCurrency(payment.remaining_amount || 0)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(payment.status)}
                    {getStatusText(payment.status)}
                    {payment.days_overdue && payment.days_overdue > 0 && (
                      <span className="text-xs text-red-500 ml-1">
                        ({payment.days_overdue} days)
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {payment.status !== 'paid' && payment.status !== 'cancelled' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onRecordPayment(payment)}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Record Payment
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
