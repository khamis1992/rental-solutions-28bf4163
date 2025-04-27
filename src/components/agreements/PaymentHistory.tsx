
import React from 'react';
import { asPaymentId } from '@/utils/database-type-helpers';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePayments } from '@/hooks/use-payments';
import { ExtendedPayment } from './PaymentHistory.types';
import { formatCurrency } from '@/lib/utils';

interface PaymentHistoryProps {
  payments: ExtendedPayment[] | null | undefined;
  isLoading: boolean;
  onPaymentDeleted: () => void;
  onPaymentUpdated: (payment: Partial<ExtendedPayment>) => Promise<void>;
  rentAmount?: number | null;
  contractAmount?: number | null;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
  onRecordPayment?: (payment: Partial<ExtendedPayment>) => void;
  onEdit?: (payment: ExtendedPayment) => void;
  onDelete?: (payment: ExtendedPayment) => void;
}

export const PaymentHistory = ({ payments, isLoading, onPaymentDeleted, onPaymentUpdated, rentAmount, contractAmount, leaseStartDate, leaseEndDate, onRecordPayment, onEdit, onDelete }: PaymentHistoryProps) => {
  const { deletePayment } = usePayments();

  const handleDelete = async (paymentId: string) => {
    try {
      const typedPaymentId = asPaymentId(paymentId);
      await deletePayment(typedPaymentId);
      onPaymentDeleted();
      toast.success('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Payment History</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading payments...</TableCell>
              </TableRow>
            ) : payments && payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(payment.amount_paid || payment.amount || 0)}</TableCell>
                  <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                  <TableCell>{payment.reference_number || 'N/A'}</TableCell>
                  <TableCell>{payment.notes || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (onEdit) {
                          onEdit(payment);
                        } else {
                          onPaymentUpdated({
                            id: payment.id,
                            amount_paid: payment.amount,
                            payment_date: payment.payment_date,
                            payment_method: payment.payment_method,
                            reference_number: payment.reference_number,
                            notes: payment.notes
                          });
                        }
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (onDelete) {
                          onDelete(payment);
                        } else {
                          handleDelete(payment.id);
                        }
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No payments found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
