import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Plus, FileDown, Filter, Pencil, Trash } from 'lucide-react';
import { PaymentHistoryItem } from '@/types/payment-history.types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { formatDate } from '@/lib/date-utils';

interface PaymentHistoryProps {
  payments: PaymentHistoryItem[];
  isLoading: boolean;
  rentAmount: number | null;
  leaseId?: string;
  onPaymentDeleted?: () => void;
  onRecordPayment?: (payment: Partial<PaymentHistoryItem>) => void;
  showAnalytics?: boolean; // New prop to control if analytics section is shown
}

export function PaymentHistorySection({
  payments = [],
  isLoading,
  rentAmount,
  leaseId,
  onPaymentDeleted,
  onRecordPayment,
  showAnalytics = true // Default to true to maintain backward compatibility
}: PaymentHistoryProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  // Calculate payment statistics
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const amountPaid = payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
  const balance = totalAmount - amountPaid;
  const lateFees = payments.reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0);

  // Calculate payment status counts
  const paidOnTime = payments.filter(p => p.status === 'completed' && (!p.days_overdue || p.days_overdue === 0)).length;
  const paidLate = payments.filter(p => p.status === 'completed' && p.days_overdue && p.days_overdue > 0).length;
  const unpaid = payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

  const handlePaymentCreated = (payment: Partial<PaymentHistoryItem>) => {
    if (onRecordPayment) {
      onRecordPayment(payment);
      setIsPaymentDialogOpen(false);
    }
  };

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

  const renderPaymentHistory = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-t-2 border-blue-500 rounded-full"></div>
        </div>
      );
    }

    if (payments.length === 0) {
      return (
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground">No payment history available</p>
          <p className="text-sm text-muted-foreground mt-2 mb-4">Record a payment to get started</p>
          <Button onClick={() => setIsPaymentDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold text-gray-800">QAR {formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
            <p className="text-xl font-bold text-green-600">QAR {formatCurrency(amountPaid)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Balance</p>
            <p className="text-xl font-bold text-amber-600">QAR {formatCurrency(balance)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Late Fees</p>
            <p className="text-xl font-bold text-red-600">QAR {formatCurrency(lateFees)}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="text-sm font-medium mb-2">Payment Status</div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div className="flex h-2 rounded-full">
              {paidOnTime > 0 && (
                <div 
                  className="bg-green-500 h-full rounded-l-full" 
                  style={{ width: `${(paidOnTime / payments.length) * 100}%` }}
                />
              )}
              {paidLate > 0 && (
                <div 
                  className="bg-amber-500 h-full" 
                  style={{ width: `${(paidLate / payments.length) * 100}%` }}
                />
              )}
              {unpaid > 0 && (
                <div 
                  className={`bg-red-500 h-full ${paidOnTime === 0 && paidLate === 0 ? 'rounded-l-full' : ''} ${unpaid === payments.length ? 'rounded-full' : 'rounded-r-full'}`}
                  style={{ width: `${(unpaid / payments.length) * 100}%` }}
                />
              )}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 mr-1 rounded-full"></div>
              Paid on Time: {paidOnTime}
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-500 mr-1 rounded-full"></div>
              Paid Late: {paidLate}
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 mr-1 rounded-full"></div>
              Unpaid: {unpaid}
            </div>
          </div>
        </div>

        <div className="flex justify-between mb-4">
          <div className="flex items-center text-sm font-medium">
            {rentAmount && <span className="text-muted-foreground">Monthly Rent: QAR {formatCurrency(rentAmount)}</span>}
          </div>
          <Button onClick={() => setIsPaymentDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
        
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
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export History
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Track all financial transactions for this agreement</CardDescription>
        </CardHeader>
        <CardContent>
          {renderPaymentHistory()}
        </CardContent>
      </Card>
      
      {isPaymentDialogOpen && leaseId && (
        <PaymentEntryDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          onSubmit={(amount, date, notes, method, reference, includeLatePaymentFee) => {
            handlePaymentCreated({
              amount,
              payment_date: date.toISOString(),
              description: notes,
              payment_method: method,
              transaction_id: reference,
              lease_id: leaseId,
              status: 'completed'
            });
            return Promise.resolve();
          }}
          title="Record Payment"
          description="Add a new payment to this agreement"
          defaultAmount={rentAmount}
          leaseId={leaseId}
          rentAmount={rentAmount}
          selectedPayment={null}
        />
      )}
      
      {/* Only render the analytics section if showAnalytics is true */}
      {showAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Analytics</CardTitle>
            <CardDescription>Financial metrics for this agreement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">QAR {formatCurrency(amountPaid)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
                <p className="text-2xl font-bold">QAR {formatCurrency(balance)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <p className="text-sm font-medium text-muted-foreground">Late Fees</p>
                <p className="text-2xl font-bold">QAR {formatCurrency(lateFees)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
