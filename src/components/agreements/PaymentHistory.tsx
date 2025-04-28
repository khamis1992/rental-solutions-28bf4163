
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import PaymentEditDialog from './PaymentEditDialog';
import { ExtendedPayment, PaymentHistoryProps } from './PaymentHistory.types';
import { updateUnifiedPayment, fetchUnifiedPayments } from '@/utils/database-operations';

export function PaymentHistory({ 
  agreementId,
  payments = [],
  isLoading = false,
  onPaymentDeleted,
  onPaymentUpdated,
  onEdit,
  onDelete,
  rentAmount,
  contractAmount,
  leaseStartDate,
  leaseEndDate,
  onRecordPayment
}: PaymentHistoryProps) {
  const [localPayments, setLocalPayments] = useState<ExtendedPayment[]>(payments);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ExtendedPayment | null>(null);

  useEffect(() => {
    setLocalPayments(payments);
  }, [payments]);

  useEffect(() => {
    if (payments.length === 0 && !isLoading) {
      const loadPayments = async () => {
        setLoading(true);
        setError(null);
        try {
          const paymentData = await fetchUnifiedPayments(agreementId);
          setLocalPayments(paymentData);
        } catch (e: any) {
          setError(e.message || 'Failed to load payments.');
          toast.error(e.message || 'Failed to load payments.');
        } finally {
          setLoading(false);
        }
      };

      loadPayments();
    }
  }, [agreementId, isLoading, payments]);

  const handleEditPayment = (payment: ExtendedPayment) => {
    setSelectedPayment(payment);
    setEditDialogOpen(true);
    if (onEdit) onEdit(payment);
  };

  const handleSavePayment = async (paymentId: string, updateData: Partial<ExtendedPayment>) => {
    try {
      await updateUnifiedPayment(paymentId, updateData);
      const updatedPayments = localPayments.map(payment =>
        payment.id === paymentId ? { ...payment, ...updateData } : payment
      );
      setLocalPayments(updatedPayments);
      if (onPaymentUpdated) await onPaymentUpdated();
      toast.success('Payment updated successfully!');
    } catch (e: any) {
      setError(e.message || 'Failed to update payment.');
      toast.error(e.message || 'Failed to update payment.');
    } finally {
      setEditDialogOpen(false);
      setSelectedPayment(null);
    }
  };

  return (
    <div>
      {error && <p className="text-red-500">{error}</p>}
      {loading ? (
        <p>Loading payments...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference #</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.payment_date}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{payment.payment_method}</TableCell>
                <TableCell>{payment.status}</TableCell>
                <TableCell>{payment.reference_number}</TableCell>
                <TableCell>{payment.notes}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleEditPayment(payment)}
                      >
                        Edit Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(payment)}
                      >
                        Delete Payment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {selectedPayment && (
        <PaymentEditDialog
          payment={selectedPayment}
          isOpen={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedPayment(null);
          }}
          onSave={handleSavePayment}
        />
      )}
    </div>
  );
}

export default PaymentHistory;
