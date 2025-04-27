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
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentEditDialog } from './PaymentEditDialog';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { asTableId, asLeaseId } from '@/utils/type-casting';
import { formatDate } from '@/lib/date-utils';
import type { PaymentHistoryProps, Payment } from './PaymentHistory.types';
import { PaymentEntryDialog } from './PaymentEntryDialog';

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ 
  agreementId,
  payments = [],
  isLoading = false,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  leaseStartDate,
  leaseEndDate
}) => {
  const [localPayments, setLocalPayments] = useState<Payment[]>([]);
  const [localIsLoading, setLocalIsLoading] = useState(true);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  useEffect(() => {
    if (Array.isArray(payments)) {
      setLocalPayments(payments);
      setLocalIsLoading(isLoading);
    } else {
      const fetchPayments = async () => {
        setLocalIsLoading(true);
        try {
          if (!agreementId) {
            console.log('No agreement ID provided');
            setLocalPayments([]);
            setLocalIsLoading(false);
            return;
          }
          
          console.log('Fetching payments for agreement:', agreementId);
          
          const { data, error } = await supabase
            .from('unified_payments')
            .select('*')
            .eq('lease_id', asLeaseId(agreementId))
            .order('payment_date', { ascending: false });

          if (error) {
            console.error('Error fetching payments:', error);
            throw error;
          }
          
          console.log('Fetched payments:', data);
          setLocalPayments(data || []);
        } catch (error) {
          console.error('Error in fetchPayments:', error);
          toast.error("Failed to fetch payments");
        } finally {
          setLocalIsLoading(false);
        }
      };

      fetchPayments();
    }
  }, [agreementId, payments, isLoading]);

  const handleDelete = async (paymentId: string) => {
    try {
      if (onPaymentDeleted) {
        await supabase
          .from('unified_payments')
          .delete()
          .eq('id', asTableId('unified_payments', paymentId));
        
        onPaymentDeleted();
        toast.success("Payment deleted successfully");
      } else {
        const { error } = await supabase
          .from('unified_payments')
          .delete()
          .eq('id', asTableId('unified_payments', paymentId));

        if (error) throw error;
        
        setLocalPayments(payments => payments.filter(payment => payment.id !== paymentId));
        toast.success("Payment deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditPayment(null);
  };

  const handlePaymentSaved = async (updatedPayment: Partial<Payment>) => {
    handleDialogClose();

    try {
      if (onPaymentUpdated && updatedPayment.id) {
        await onPaymentUpdated(updatedPayment);
      } else {
        const { error } = await supabase
          .from('unified_payments')
          .update(updatedPayment)
          .eq('id', updatedPayment.id!);
        
        if (error) throw error;
        
        const { data, error: fetchError } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', asLeaseId(agreementId))
          .order('payment_date', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        setLocalPayments(data || []);
      }

      toast.success("Payment updated successfully");
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    }
  };

  const handleAddPayment = () => {
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentDialogClose = () => {
    setIsPaymentDialogOpen(false);
  };

  const handlePaymentSubmit = async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string
  ) => {
    try {
      if (onRecordPayment) {
        onRecordPayment({
          lease_id: agreementId,
          amount,
          payment_date: paymentDate.toISOString(),
          status: 'completed',
          payment_method: paymentMethod,
          transaction_id: referenceNumber,
          notes
        });
      } else {
        const newPayment = {
          lease_id: agreementId,
          amount,
          payment_date: paymentDate.toISOString(),
          status: 'completed',
          payment_method: paymentMethod,
          transaction_id: referenceNumber,
          notes
        };
        
        const { data, error } = await supabase
          .from('unified_payments')
          .insert([newPayment])
          .select();
        
        if (error) throw error;
        
        setLocalPayments(prev => [data[0], ...prev]);
      }
      
      handlePaymentDialogClose();
      toast.success("Payment recorded successfully");
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    }
  };

  if (localIsLoading) {
    return <div className="text-center py-4">Loading payments...</div>;
  }

  if (!localPayments || localPayments.length === 0) {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <Button onClick={handleAddPayment}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
        <div className="text-center py-4 border rounded-lg bg-gray-50">No payments found for this agreement.</div>
        
        <PaymentEntryDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          onSubmit={handlePaymentSubmit}
          defaultAmount={rentAmount || 0}
          title="Record Payment"
          description="Enter payment details to record a new payment"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddPayment}>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

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
          {localPayments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                {payment.payment_date ? formatDate(payment.payment_date) : 'N/A'}
              </TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>{payment.payment_method || 'N/A'}</TableCell>
              <TableCell>{payment.transaction_id || 'N/A'}</TableCell>
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

      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={handlePaymentSubmit}
        defaultAmount={rentAmount || 0}
        title="Record Payment"
        description="Enter payment details to record a new payment"
      />
    </div>
  );
};
