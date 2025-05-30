
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
  agreement: Agreement;
  onRecordPayment: (payment: Partial<Payment>) => Promise<void>;
  onUpdatePayment: (payment: Partial<Payment>) => Promise<boolean>;
  onDeletePayment: (paymentId: string) => Promise<void>;
}

export function PaymentHistorySection({
  payments,
  isLoading,
  agreement,
  onRecordPayment,
  onUpdatePayment,
  onDeletePayment
}: PaymentHistorySectionProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const {
    syncAll,
    isPending
  } = useAgreementPaymentSync(agreement.id);

  const handleRecordPayment = async (
    amount: number,
    date: Date,
    notes?: string,
    method?: string,
    reference?: string
  ) => {
    const newPayment: Partial<Payment> = {
      amount,
      payment_date: date.toISOString(),
      description: notes || '',
      payment_method: method || 'cash',
      reference_number: reference || '',
      lease_id: agreement.id,
      status: 'completed'
    };

    await onRecordPayment(newPayment);
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
            <Button
              variant="outline"
              size="sm"
              onClick={syncAll}
              disabled={isPending.all}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isPending.all ? 'animate-spin' : ''}`} />
              Sync Payments
            </Button>
            <Button
              size="sm"
              onClick={() => setIsPaymentDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={handleRecordPayment}
        defaultAmount={agreement.rent_amount}
        title="Record Payment"
        description="Add a new payment to this agreement"
        leaseId={agreement.id}
        rentAmount={agreement.rent_amount}
      />
    </Card>
  );
}
