import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Payment } from '@/types/payment.types';
import { Agreement } from '@/types/agreement';
import { useAgreementPaymentSync } from '@/hooks/payment/use-agreement-payment-sync';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';

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
  agreement
}: PaymentHistorySectionProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const {
    syncAll,
    isPending
  } = useAgreementPaymentSync(leaseId);

  const handleRecordPayment = async (
    amount: number,
    date: Date,
    notes?: string,
    method?: string,
    reference?: string
  ) => {
    if (selectedPayment) {
      const updatedPayment: Partial<Payment> = {
        id: selectedPayment.id,
        amount,
        payment_date: date.toISOString(),
        description: notes || selectedPayment.description || '',
        payment_method: method || selectedPayment.payment_method || 'cash',
        reference_number: reference || selectedPayment.reference_number || '',
        lease_id: leaseId,
        status: 'completed',
      };
      await onPaymentUpdated(updatedPayment);
      setSelectedPayment(null);
    } else {
      const newPayment: Partial<Payment> = {
        amount,
        payment_date: date.toISOString(),
        description: notes || '',
        payment_method: method || 'cash',
        reference_number: reference || '',
        lease_id: leaseId,
        status: 'completed'
      };
      await onRecordPayment(newPayment);
    }
    return true;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'destructive';
      default:
        return 'default';
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
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(payment.payment_date), 'PPP')}
                    </div>
                    {payment.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {payment.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                  {payment.payment_method && (
                    <Badge variant="outline">
                      {payment.payment_method}
                    </Badge>
                  )}
                  {payment.status !== 'completed' && (
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
        leaseId={leaseId}
        rentAmount={rentAmount}
        selectedPayment={selectedPayment}
      />
    </Card>
  );
}
