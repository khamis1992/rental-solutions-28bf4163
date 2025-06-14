
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, RefreshCw } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Payment } from '@/types/payment.types';
import { Agreement } from '@/types/agreement';
import { useAgreementPaymentSync } from '@/hooks/payment/use-agreement-payment-sync';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentHistorySectionProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount?: number | null;
  contractAmount?: number | null;
  leaseId?: string;
  onPaymentDeleted: (paymentId: string) => void;
  onRecordPayment: (payment: Partial<Payment>) => Promise<void>;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  showAnalytics?: boolean;
  agreement?: Agreement | null;
  fetchPayments?: () => void;
}

export function PaymentHistorySection({
  payments,
  isLoading,
  rentAmount,
  contractAmount,
  leaseId,
  onRecordPayment,
  onPaymentUpdated,
  onPaymentDeleted,
  showAnalytics = true,
  agreement,
  fetchPayments
}: PaymentHistorySectionProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditLateFeeDialogOpen, setIsEditLateFeeDialogOpen] = useState(false);
  const [newLateFee, setNewLateFee] = useState('');

  const {
    syncAll,
    isPending
  } = useAgreementPaymentSync(leaseId);

  // Compute pending/overdue payments for the dialog
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');

  // Utility to call the process-payment edge function
  async function processPartialPayment(paymentId: string, paymentAmount: number) {
    const response = await fetch('/functions/v1/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, paymentAmount }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Payment failed');
    }
    return result.payment;
  }

  // Updated handleRecordPayment to use the edge function
  const handleRecordPayment = async (
    amount: number,
    date: Date,
    notes?: string,
    method?: string,
    reference?: string,
    includeLateFee?: boolean,
    isPartialPayment?: boolean,
    paymentType?: string,
    paymentId?: string
  ) => {
    if (paymentId) {
      try {
        await processPartialPayment(paymentId, amount);
        // Optionally, show a success message
        if (typeof fetchPayments === 'function') {
          fetchPayments();
        } else if (typeof window !== 'undefined') {
          window.location.reload(); // fallback: reload page
        }
      } catch (err) {
        alert('Payment failed: ' + (err instanceof Error ? err.message : err));
        return false;
      }
    } else {
      // Fallback: create a new payment (if needed)
      const newPayment: Partial<Payment> = {
        amount,
        payment_date: date.toISOString(),
        description: notes || '',
        payment_method: method || 'cash',
        reference_number: reference || '',
        lease_id: leaseId,
        status: 'paid' // Fix: use valid status
      };
      await onRecordPayment(newPayment);
    }
    return true;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-QA', {
      style: 'currency',
      currency: 'QAR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading payment history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Payment History</CardTitle>
          <div className="flex gap-2">
            {leaseId && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncAll}
                disabled={isPending?.all}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isPending?.all ? 'animate-spin' : ''}`} />
                Sync Payments
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setSelectedPayment(null);
                setIsPaymentDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>
        <div className="text-muted-foreground text-sm mt-1">
          Track payments and financial transactions for this agreement
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payments recorded yet
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {formatCurrency(payment.amount)}
                    </div>
                    {payment.payment_date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Payment Date: {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                      </div>
                    )}
                    {(() => {
                      // Show dynamic late fee for pending/overdue
                      if ((payment.status === 'pending' || payment.status === 'overdue') && payment.payment_date) {
                        const today = new Date();
                        const dueDate = new Date(payment.payment_date);
                        const firstOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
                        const daysLate = Math.max(0, differenceInCalendarDays(today, firstOfMonth));
                        const fee = Math.min(daysLate * 120, 3000);
                        return (
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-red-600 mt-1">
                              Late Fee: {formatCurrency(payment.late_fine_amount ?? fee)}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setNewLateFee(String(payment.late_fine_amount ?? fee));
                                setIsEditLateFeeDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        );
                      }
                      // Show static late_fine_amount for paid/completed/partially_paid
                      if ((['completed', 'paid', 'partially_paid'].includes(String(payment.status))) && payment.late_fine_amount && payment.late_fine_amount > 0) {
                        return (
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-red-600 mt-1">
                              Late Fee: {formatCurrency(payment.late_fine_amount)}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setNewLateFee(String(payment.late_fine_amount));
                                setIsEditLateFeeDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {payment.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {payment.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(payment.status)}>
                    {payment.status || 'pending'}
                  </Badge>
                  <Badge variant="outline">
                    {payment.payment_method ? payment.payment_method : 'N/A'}
                  </Badge>
                  {payment.status !== 'completed' && payment.status !== 'paid' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsPaymentDialogOpen(true);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          setIsPaymentDialogOpen(open);
          if (!open) setSelectedPayment(null);
        }}
        onSubmit={handleRecordPayment}
        defaultAmount={selectedPayment ? selectedPayment.amount : rentAmount || 0}
        title="Record Payment"
        description={selectedPayment ? "Clear this payment" : "Add a new payment to this agreement"}
        leaseId={leaseId || ''}
        rentAmount={rentAmount}
        selectedPayment={selectedPayment}
        pendingPayments={pendingPayments}
      />

      {/* Edit Late Fee Dialog */}
      <Dialog open={isEditLateFeeDialogOpen} onOpenChange={setIsEditLateFeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Late Fee</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (selectedPayment && newLateFee !== '') {
                await onPaymentUpdated({
                  id: selectedPayment.id,
                  late_fine_amount: Number(newLateFee),
                });
                setIsEditLateFeeDialogOpen(false);
                setSelectedPayment(null);
              }
            }}
          >
            <Label>Late Fee (QAR)</Label>
            <Input
              type="number"
              value={newLateFee}
              onChange={(e) => setNewLateFee(e.target.value)}
              min={0}
              step={1}
              required
            />
            <Button type="submit" className="mt-2">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
