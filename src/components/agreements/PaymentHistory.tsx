
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface Payment {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  payment_date: string | null;
  due_date: string | null;
  status: string;
  payment_method: string | null;
  description: string | null;
  type: string;
  created_at: string;
  updated_at: string;
  late_fine_amount: number;
  days_overdue: number;
  original_due_date: string | null;
  transaction_id: string | null;
  import_reference: string | null;
  is_recurring: boolean;
  recurring_interval: string | null;
  next_payment_date: string | null;
}

interface PaymentHistoryProps {
  agreementId: string;
  payments?: Payment[];
  isLoading?: boolean;
  fetchPayments: () => Promise<void>;
}

export function PaymentHistory({ agreementId, payments = [], isLoading = false, fetchPayments }: PaymentHistoryProps) {

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(parseISO(date), 'MMM d, yyyy');
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      // Delete the payment
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentId);
        
      if (error) throw error;
      
      toast.success('Payment deleted successfully');
      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment History</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading payments...
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No payments found for this agreement.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell>{payment.amount}</TableCell>
                  <TableCell>{payment.payment_method}</TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(payment.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
