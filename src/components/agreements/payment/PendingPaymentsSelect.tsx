
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExtendedPayment } from '../PaymentHistory.types';
import { format as dateFormat } from 'date-fns';

interface PendingPaymentsSelectProps {
  pendingPayments: ExtendedPayment[];
  selectedPaymentId?: string;
  onPaymentSelect: (paymentId: string) => void;
}

export const PendingPaymentsSelect: React.FC<PendingPaymentsSelectProps> = ({
  pendingPayments,
  selectedPaymentId,
  onPaymentSelect,
}) => {
  const formatPaymentDescription = (payment: ExtendedPayment) => {
    let desc = payment.description || 
               `${dateFormat(new Date(payment.payment_date || new Date()), 'MMM yyyy')} Payment`;
    
    let status = "";
    if (payment.status === 'partially_paid') {
      status = " (Partially Paid)";
    } else if (payment.status === 'pending') {
      status = " (Pending)";
    } else if (payment.status === 'overdue') {
      status = " (Overdue)";
    }
    
    return `${desc}${status} - ${payment.amount_paid ? 
      `Paid: ${payment.amount_paid.toLocaleString()} / ` : ''}QAR ${payment.amount?.toLocaleString() || 0}`;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="payment-select">Record Payment For</Label>
      <Select 
        value={selectedPaymentId} 
        onValueChange={onPaymentSelect}
      >
        <SelectTrigger id="payment-select">
          <SelectValue placeholder="Select a payment" />
        </SelectTrigger>
        <SelectContent>
          {pendingPayments.map((payment) => (
            <SelectItem key={payment.id} value={payment.id}>
              {formatPaymentDescription(payment)}
            </SelectItem>
          ))}
          <SelectItem value="manual">Record a new manual payment</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
