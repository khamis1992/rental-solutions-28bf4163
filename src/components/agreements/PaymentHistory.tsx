
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Edit, Trash2, CheckSquare, AlertCircle, Clock, RefreshCw, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentEditDialog } from './PaymentEditDialog';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';
import { isAfter, subMonths, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export interface Payment {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_method?: string;
  reference_number?: string | null;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
}

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
  leaseStartDate?: Date | string;
  leaseEndDate?: Date | string;
}

export function PaymentHistory({
  payments,
  isLoading,
  rentAmount,
  onPaymentDeleted,
  leaseStartDate,
  leaseEndDate,
}: PaymentHistoryProps) {
  console.log('PaymentHistory received payments:', payments);
  console.log('PaymentHistory isLoading:', isLoading);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);
  const [lateFeeDetails, setLateFeeDetails] = useState<{
    amount: number;
    daysLate: number;
  } | null>(null);

  useEffect(() => {
    const today = new Date();
    if (today.getDate() > 1) {
      const daysLate = today.getDate() - 1;
      const lateFeeAmount = Math.min(daysLate * 120, 3000);

      setLateFeeDetails({
        amount: lateFeeAmount,
        daysLate: daysLate
      });
    } else {
      setLateFeeDetails(null);
    }
  }, []);

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleRecordPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentDialogOpen(true);
  };

  const handleRecordManualPayment = () => {
    setSelectedPayment(null);
    setIsPaymentDialogOpen(true);
  };

  const handleDeletePayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      setIsDeletingPayment(true);
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', selectedPayment.id);

      if (error) {
        toast.error(`Failed to delete payment: ${error.message}`);
      } else {
        toast.success('Payment deleted successfully');
        onPaymentDeleted();
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      toast.error('Failed to delete payment');
    } finally {
      setIsDeletingPayment(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const getStatusBadge = (status?: string, daysOverdue?: number, balance?: number, amount?: number) => {
    if (!status) return <Badge className="bg-gray-500">Unknown</Badge>;

    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'partially_paid':
        return <Badge variant="partial">Partially Paid</Badge>;
      case 'pending':
        return (
          <Badge className="bg-yellow-500">
            Pending {daysOverdue && daysOverdue > 0 ? `(${daysOverdue} days overdue)` : ''}
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive">
            Overdue {daysOverdue && daysOverdue > 0 ? `(${daysOverdue} days)` : ''}
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <AlertCircle className="h-4 w-4 text-gray-500" />;

    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'partially_paid':
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Trash2 className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format displayed amount including late fee for pending payments
  const formatAmount = (payment: Payment) => {
    const baseAmount = payment.amount || 0;
    const amountPaid = payment.amount_paid || 0;
    const balance = payment.balance || 0;
    const displayAmount = baseAmount.toLocaleString();
    
    // For pending payments with overdue days, show the current late fee
    if ((payment.status === 'pending' || payment.status === 'overdue') && 
        payment.days_overdue && payment.days_overdue > 0 && 
        payment.late_fine_amount && payment.late_fine_amount > 0) {
      return (
        <>
          QAR {displayAmount}
          <div className="text-xs text-red-500 mt-1">
            +QAR {payment.late_fine_amount.toLocaleString()} late fee
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total: QAR {(baseAmount + payment.late_fine_amount).toLocaleString()}
          </div>
        </>
      );
    }
    
    // For partially paid payments
    if (payment.status === 'partially_paid' && amountPaid > 0 && balance > 0) {
      return (
        <>
          QAR {displayAmount}
          <div className="text-xs text-blue-500 mt-1">
            Paid: QAR {amountPaid.toLocaleString()}
          </div>
          <div className="text-xs text-amber-500 mt-1">
            Remaining: QAR {balance.toLocaleString()}
          </div>
        </>
      );
    }
    
    return `QAR ${displayAmount}`;
  };

  // Make sure leaseStartDate and leaseEndDate are Date objects 
  const startDate = leaseStartDate ? new Date(leaseStartDate) : null;
  const endDate = leaseEndDate ? new Date(leaseEndDate) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Track all payments for this agreement</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPaymentDeleted}
            className="h-8"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecordManualPayment}
            className="h-8"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Record Manual Payment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : payments?.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {payment.payment_date 
                      ? formatDate(new Date(payment.payment_date), 'PPP') 
                      : payment.original_due_date 
                      ? <span className="text-yellow-600">Due: {formatDate(new Date(payment.original_due_date), 'PPP')}</span>
                      : 'Pending'}
                  </TableCell>
                  <TableCell>
                    {formatAmount(payment)}
                  </TableCell>
                  <TableCell>
                    {payment.payment_method ? payment.payment_method : 'N/A'}
                    {payment.reference_number && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Ref: {payment.reference_number}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(payment.status)}
                      <span>{getStatusBadge(payment.status, payment.days_overdue, payment.balance, payment.amount)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={payment.notes || ''}>
                      {payment.notes}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {payment.status === 'partially_paid' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecordPayment(payment)}
                          title="Record Payment"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPayment(payment)}
                          title="Edit payment"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePayment(payment)}
                        title="Delete payment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Alert>
            <AlertDescription className="text-center py-4">
              No payments recorded for this agreement yet.
            </AlertDescription>
          </Alert>
        )}

        {selectedPayment && (
          <PaymentEditDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            payment={selectedPayment}
            onSaved={onPaymentDeleted}
          />
        )}

        <PaymentEntryDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          onSubmit={(amount, paymentDate, notes, paymentMethod, referenceNumber, includeLatePaymentFee, isPartialPayment) => {
            // Process the payment with the new isPartialPayment parameter
            console.log("Recording payment with partial payment:", isPartialPayment);
            setIsPaymentDialogOpen(false);
            onPaymentDeleted();
          }}
          defaultAmount={selectedPayment ? (selectedPayment.balance || 0) : (rentAmount || 0)}
          title={selectedPayment ? "Record Additional Payment" : "Record Manual Payment"}
          description={selectedPayment ? "Record an additional payment for this partially paid item." : "Record a new manual payment for this agreement."}
          lateFeeDetails={lateFeeDetails}
          selectedPayment={selectedPayment}
        />

        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this payment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeletePayment}
                disabled={isDeletingPayment}
              >
                {isDeletingPayment ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  'Delete Payment'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
