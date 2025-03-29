
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Check, X } from 'lucide-react';
import { usePayments } from '@/hooks/use-payments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentListProps {
  agreementId: string;
  onPaymentDeleted: () => void;
}

export function PaymentList({ agreementId, onPaymentDeleted }: PaymentListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const { payments, isLoadingPayments, fetchPayments } = usePayments(agreementId, null);

  useEffect(() => {
    if (agreementId) {
      fetchPayments();
    }
  }, [agreementId, fetchPayments]);

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

  if (!payments.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <AlertCircle className="mb-2 h-10 w-10" />
        <h3 className="text-lg font-medium">No payments found</h3>
        <p className="mt-1">No payment records exist for this agreement.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{format(new Date(payment.payment_date), 'PP')}</TableCell>
                <TableCell>
                  <span className="capitalize">{payment.type || 'Regular'}</span>
                </TableCell>
                <TableCell className="font-medium">QAR {payment.amount}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {payment.status === 'completed' ? (
                      <Check className="mr-1 h-4 w-4 text-green-500" />
                    ) : (
                      <X className="mr-1 h-4 w-4 text-red-500" />
                    )}
                    <span className="capitalize">{payment.status}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{payment.payment_method}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => confirmDeletePayment(payment.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
