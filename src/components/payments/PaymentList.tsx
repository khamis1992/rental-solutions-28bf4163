
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { usePayments } from '@/hooks/use-payments';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { PaymentListTable } from './PaymentListTable';
import { EmptyPaymentState } from './EmptyPaymentState';
import { DeletePaymentDialog } from './DeletePaymentDialog';
import { MissingPaymentsAlert } from './MissingPaymentsAlert';
import { useMissingPayments } from '@/hooks/use-missing-payments';

interface PaymentListProps {
  agreementId: string;
  onPaymentDeleted: () => void;
}

export function PaymentList({ agreementId, onPaymentDeleted }: PaymentListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const initialFetchDone = useRef(false);
  const isDeleting = useRef(false);
  const isMounted = useRef(true);
  
  const { payments, isLoadingPayments, fetchPayments } = usePayments(agreementId, null);
  const { missingPayments } = useMissingPayments(agreementId, isMounted);
  
  // Debounced refresh to prevent multiple rapid refreshes
  const debouncedRefresh = useDebouncedCallback(() => {
    console.log("Running debounced payment refresh in PaymentList");
    if (isMounted.current) {
      fetchPayments(true);
      onPaymentDeleted();
    }
  }, 1000);
  
  // Ensure we mark component as mounted/unmounted
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (agreementId && !initialFetchDone.current) {
      console.log("Initial payment fetch in PaymentList for:", agreementId);
      fetchPayments(true);
      initialFetchDone.current = true;
    }
  }, [agreementId, fetchPayments]);

  const confirmDeletePayment = (id: string) => {
    setPaymentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete || isDeleting.current || !isMounted.current) return;

    try {
      isDeleting.current = true;
      
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
      
      // Use debounced refresh to prevent multiple refreshes
      debouncedRefresh();
      
    } catch (error) {
      console.error("Error in payment deletion:", error);
      toast.error("An unexpected error occurred");
    } finally {
      isDeleting.current = false;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View and manage payment records</CardDescription>
        </div>
        {missingPayments.length > 0 && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              Missing {missingPayments.length} payment{missingPayments.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoadingPayments ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <MissingPaymentsAlert missingPayments={missingPayments} />

            {payments.length > 0 ? (
              <PaymentListTable 
                payments={payments} 
                onDelete={confirmDeletePayment} 
              />
            ) : (
              <EmptyPaymentState />
            )}
          </>
        )}
      </CardContent>

      <DeletePaymentDialog 
        isOpen={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen} 
        onConfirm={handleDeletePayment} 
      />
    </Card>
  );
}
