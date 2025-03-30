
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Edit, Trash2 } from 'lucide-react';
import { usePayments } from '@/hooks/use-payments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';

export interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  type: string;
  status: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id: string;
}

interface PaymentListProps {
  agreementId: string;
  onPaymentDeleted: () => void;
}

export function PaymentList({ agreementId, onPaymentDeleted }: PaymentListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const { payments, isLoadingPayments, fetchPayments } = usePayments(agreementId, null);
  const [missingPayments, setMissingPayments] = useState<any[]>([]);

  useEffect(() => {
    if (agreementId) {
      fetchPayments();
    }
  }, [agreementId, fetchPayments]);

  useEffect(() => {
    setMissingPayments([
      {
        month: "March 2025",
        amount: 1200,
        daysOverdue: 21,
        lateFee: 2520,
        totalDue: 3720
      }
    ]);
  }, []);

  const confirmDeletePayment = (id: string) => {
    setPaymentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentToDelete);

      if (error) {
        console.error("Error deleting payment:", error);
        toast.error("Failed to delete payment");
        return;
      }

      toast.success("Payment deleted successfully");
      setIsDeleteDialogOpen(false);
      onPaymentDeleted();
    } catch (error) {
      console.error("Error in payment deletion:", error);
      toast.error("An unexpected error occurred");
    }
  };

  if (isLoadingPayments) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const renderPaymentMethodBadge = (method: string) => {
    switch(method.toLowerCase()) {
      case 'cash':
        return <Badge className="bg-green-50 text-green-700 border-green-100">Cash</Badge>;
      case 'credit_card':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100">Credit Card</Badge>;
      case 'bank_transfer':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-100">Bank Transfer</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-100">{method}</Badge>;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      {missingPayments.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Missing Payments
          </h3>
          <div className="grid gap-4">
            {missingPayments.map((payment, index) => (
              <div key={index} className="bg-white p-3 border border-red-100 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{payment.month}</div>
                    <div className="text-sm">QAR {payment.amount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-600 text-xs">{payment.daysOverdue} days overdue</div>
                    <div className="text-red-600 text-xs">+ QAR {payment.lateFee.toLocaleString()} fine</div>
                    <div className="font-bold text-red-700 mt-1 text-sm">Total: QAR {payment.totalDue.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {payments.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-sm">{formatDate(payment.payment_date)}</TableCell>
                  <TableCell className="font-medium text-sm">QAR {payment.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">
                    <span className="capitalize">{payment.type === 'rent' ? 'Income' : payment.type}</span>
                  </TableCell>
                  <TableCell className="text-sm">{renderPaymentMethodBadge(payment.payment_method)}</TableCell>
                  <TableCell className="text-sm">{renderStatusBadge(payment.status)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{payment.notes || 'Monthly rent payment'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => confirmDeletePayment(payment.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <AlertCircle className="mb-2 h-10 w-10" />
          <h3 className="text-lg font-medium">No payments found</h3>
          <p className="mt-1 text-sm">No payment records exist for this agreement.</p>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePayment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
