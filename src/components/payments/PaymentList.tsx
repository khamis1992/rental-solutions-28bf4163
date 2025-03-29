
import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EditIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { usePayments } from '@/hooks/use-payments';
import { formatDate } from '@/lib/date-utils';
import { Payment } from '@/components/agreements/PaymentHistory';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentListProps {
  agreementId?: string;
  onPaymentDeleted: () => void;
}

export function PaymentList({ agreementId, onPaymentDeleted }: PaymentListProps) {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  
  // Get rent amount for this agreement
  const { rentAmount } = useRentAmount(null, agreementId);
  
  // Get payments data
  const { payments, isLoadingPayments, fetchPayments } = usePayments(agreementId, rentAmount);

  // Handle deleting a payment
  const handleDeletePayment = async (paymentId: string) => {
    if (!agreementId || !paymentId) return;
    
    try {
      setIsDeleteLoading(true);
      
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
      
      toast.success('Payment deleted successfully');
      onPaymentDeleted(); // Refresh the parent component
      fetchPayments(); // Refresh the payments list
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // Handle opening the edit modal
  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowPaymentModal(true);
  };

  // Handle adding a new payment
  const handleAddPayment = () => {
    setEditingPayment(null);
    setShowPaymentModal(true);
  };

  if (isLoadingPayments) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={handleAddPayment}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No payments recorded for this agreement.</p>
        </div>
      ) : (
        <Table>
          <TableCaption>Payment history for this agreement</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell>{payment.notes || payment.description || 'Payment'}</TableCell>
                <TableCell className="capitalize">{payment.status}</TableCell>
                <TableCell className="text-right">QAR {payment.amount.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditPayment(payment)}
                    >
                      <EditIcon className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeletePayment(payment.id)}
                      disabled={isDeleteLoading}
                    >
                      <Trash2Icon className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Payment Modal - Uncomment when integrating the payment edit/add functionality
      {showPaymentModal && (
        <PaymentEditDialog
          payment={editingPayment}
          agreementId={agreementId}
          rentAmount={rentAmount || 0}
          onClose={() => setShowPaymentModal(false)}
          onSave={() => {
            setShowPaymentModal(false);
            fetchPayments();
            onPaymentDeleted();
          }}
        />
      )}
      */}
    </div>
  );
}
