
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentEditDialog } from './PaymentEditDialog';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { asTableId } from '@/lib/database-helpers';
import type { PaymentHistoryProps, Payment } from './PaymentHistory.types';

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ agreementId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!agreementId) {
          setPayments([]);
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', agreementId)
          .order('payment_date', { ascending: false });

        if (error) throw error;
        setPayments(data || []);
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Unknown error'));
        toast.error("Failed to fetch payments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [agreementId]);

  const handleDelete = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', asTableId('unified_payments', paymentId));

      if (error) throw error;
      
      setPayments(payments => payments.filter(payment => payment.id !== paymentId));
      toast.success("Payment deleted successfully");
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  };

  const handleEdit = (payment) => {
    setEditPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditPayment(null);
  };

  const handlePaymentSaved = () => {
    handleDialogClose();
    // Refresh payments after saving
    supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreementId)
      .order('payment_date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching payments:", error);
          toast.error("Failed to refresh payments");
        } else {
          setPayments(data || []);
        }
      });
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading payments...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">Error: {error.message}</div>;
  }

  if (!payments || payments.length === 0) {
    return <div className="text-center py-4">No payments found for this agreement.</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>{payment.payment_method}</TableCell>
              <TableCell>{payment.transaction_id}</TableCell>
              <TableCell>{payment.status}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(payment)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(payment.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PaymentEditDialog
        payment={editPayment}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSaved={handlePaymentSaved}
      />
    </div>
  );
};
