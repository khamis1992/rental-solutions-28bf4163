
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
  leaseId,
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

  // Use the right ID (either leaseId or agreementId)
  const effectiveId = leaseId || agreementId;

  useEffect(() => {
    setLocalPayments(payments);
  }, [payments]);

  useEffect(() => {
    if (payments.length === 0 && !isLoading && effectiveId) {
      loadPayments();
    }
  }, [effectiveId, isLoading, payments]);

  /**
   * Load payments from the database
   */
  const loadPayments = async () => {
    if (!effectiveId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const paymentData = await fetchUnifiedPayments(effectiveId);
      setLocalPayments(paymentData);
    } catch (e: any) {
      setError(e.message || 'Failed to load payments.');
      toast.error(e.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle payment edit action
   */
  const handleEditPayment = (payment: ExtendedPayment) => {
    setSelectedPayment(payment);
    setEditDialogOpen(true);
    if (onEdit) onEdit(payment);
  };

  /**
   * Handle saving payment changes
   */
  const handleSavePayment = async (paymentId: string, updateData: Partial<ExtendedPayment>) => {
    try {
      await updateUnifiedPayment(paymentId, updateData);
      
      // Update local state
      const updatedPayments = localPayments.map(payment =>
        payment.id === paymentId ? { ...payment, ...updateData } : payment
      );
      
      setLocalPayments(updatedPayments);
      
      // Invoke callback if provided
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

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
            {localPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No payment records found</TableCell>
              </TableRow>
            ) : (
              localPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                  <TableCell>{payment.status}</TableCell>
                  <TableCell>{payment.reference_number || 'N/A'}</TableCell>
                  <TableCell>{payment.notes || 'N/A'}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEditPayment(payment)}>
                          Edit Payment
                        </DropdownMenuItem>
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(payment)}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Payment Edit Dialog */}
      {selectedPayment && (
        <PaymentEditDialog
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          payment={selectedPayment}
          onSave={handleSavePayment}
        />
      )}
    </div>
  );
}

export default PaymentHistory;
