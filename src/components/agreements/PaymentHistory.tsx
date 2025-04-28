
import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { Payment } from './PaymentHistory.types';

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment: (payment: Partial<Payment>) => void;
  leaseStartDate: string | Date | null;
  leaseEndDate: string | Date | null;
}

export function PaymentHistory({
  payments,
  isLoading,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  leaseStartDate,
  leaseEndDate
}: PaymentHistoryProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const handleEditPayment = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentDialogOpen(true);
  }, []);

  const handleDeletePayment = useCallback(async (paymentId: string) => {
    try {
      // Optimistically update the UI
      toast.success("Payment deleted successfully");
      onPaymentDeleted();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  }, [onPaymentDeleted]);

  const handlePaymentCreated = useCallback((payment: Partial<Payment>) => {
    if (onRecordPayment) {
      onRecordPayment(payment);
      setIsPaymentDialogOpen(false);
    }
  }, [onRecordPayment]);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All recorded payments for this agreement</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          {isLoading ? (
            <div>Loading payments...</div>
          ) : (
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
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                    <TableCell>QAR {payment.amount}</TableCell>
                    <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                    <TableCell>{payment.transaction_id || payment.reference_number || 'N/A'}</TableCell>
                    <TableCell>{payment.description || payment.notes || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditPayment(payment)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePayment(payment.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No payments recorded</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <Button onClick={() => setIsPaymentDialogOpen(true)} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </CardContent>
      </Card>
      
      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={(amount, date, notes, method, reference, includeLatePaymentFee, isPartial) => {
          handlePaymentCreated({
            amount,
            payment_date: date.toISOString(),
            description: notes,
            payment_method: method,
            transaction_id: reference,
          });
          return Promise.resolve();
        }}
        title="Record Payment"
        description="Add a new payment to this agreement"
        defaultAmount={rentAmount}
        leaseId={payments[0]?.lease_id || ''}
        rentAmount={rentAmount}
        selectedPayment={null}
      />
    </div>
  );
}
