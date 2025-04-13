import React, { useState } from 'react';
import { format } from 'date-fns';
import { DollarSign, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Payment } from './PaymentHistory.types';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  leaseEndDate
}: PaymentHistoryProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  const handleDeleteClick = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (!selectedPaymentId) return;
    
    try {
      setIsDeletingPayment(true);
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', selectedPaymentId);
      
      if (error) {
        toast.error(`Failed to delete payment: ${error.message}`);
      } else {
        toast.success('Payment deleted successfully');
        onPaymentDeleted();
      }
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast.error('An unexpected error occurred while deleting the payment');
    } finally {
      setIsDeletingPayment(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-500">Partially Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-primary" />
          Payment History
        </CardTitle>
        <CardDescription>Record of all payments for this rental agreement</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : payments.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Reference</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.payment_date ? format(new Date(payment.payment_date), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {payment.type === 'LATE_PAYMENT_FEE' ? 'Late Fee' : 
                       payment.type === 'rent' ? 'Rent' : payment.type || 'Payment'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(payment.amount_paid || payment.amount || 0)}
                      </div>
                      {payment.status === 'partially_paid' && payment.balance ? (
                        <div className="text-xs text-muted-foreground">
                          Balance: {formatCurrency(payment.balance)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {payment.reference_number || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {payment.payment_method || 'Cash'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No payment records found.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeletingPayment}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeletePayment} disabled={isDeletingPayment}>
              {isDeletingPayment ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
