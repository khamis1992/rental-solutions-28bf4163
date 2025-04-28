import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField, FormGroup, FormRow } from '@/components/ui/form-components';
import type { PaymentEntryDialogProps, Payment } from '@/types/agreement-types';

export function PaymentEntryDialog({
  open,
  onOpenChange,
  selectedPayment,
  onSubmit
}: PaymentEntryDialogProps) {
  const [amount, setAmount] = React.useState<number>(selectedPayment?.amount || 0);
  const [paymentDate, setPaymentDate] = React.useState<Date>(selectedPayment?.payment_date || new Date());
  const [notes, setNotes] = React.useState<string>(selectedPayment?.notes || '');
  const [paymentMethod, setPaymentMethod] = React.useState<string>(selectedPayment?.payment_method || 'cash');
  const [referenceNumber, setReferenceNumber] = React.useState<string>(selectedPayment?.reference_number || '');
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = React.useState<boolean>(selectedPayment?.include_late_fee || false);
  const [isPartialPayment, setIsPartialPayment] = React.useState<boolean>(selectedPayment?.is_partial || false);

  const handleSubmit = async (payment: Partial<Payment>) => {
    // Remove options field as it's not part of the Payment type
    const { options, ...paymentData } = payment as any;
    await onSubmit(
      amount,
      paymentDate,
      notes,
      paymentMethod,
      referenceNumber,
      includeLatePaymentFee,
      isPartialPayment
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FormSection title="Enter Payment Details" description="Provide the necessary information to record the payment.">
          <FormGroup>
            <FormRow>
              <FormField label="Amount" htmlFor="amount">
                <Input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Payment Date" htmlFor="paymentDate">
                <Input
                  type="date"
                  id="paymentDate"
                  value={paymentDate.toISOString().split('T')[0]}
                  onChange={(e) => setPaymentDate(new Date(e.target.value))}
                />
              </FormField>
            </FormRow>
          </FormGroup>
          <FormGroup>
            <FormRow>
              <FormField label="Payment Method" htmlFor="paymentMethod">
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Reference Number" htmlFor="referenceNumber">
                <Input
                  type="text"
                  id="referenceNumber"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </FormField>
            </FormRow>
          </FormGroup>
          <FormGroup>
            <FormRow>
              <FormField label="Notes" htmlFor="notes">
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormField>
            </FormRow>
          </FormGroup>
          <FormGroup>
            <FormRow>
              <label htmlFor="includeLatePaymentFee">
                Include Late Payment Fee
                <input
                  type="checkbox"
                  id="includeLatePaymentFee"
                  checked={includeLatePaymentFee}
                  onChange={(e) => setIncludeLatePaymentFee(e.target.checked)}
                />
              </label>
            </FormRow>
            <FormRow>
              <label htmlFor="isPartialPayment">
                Is Partial Payment
                <input
                  type="checkbox"
                  id="isPartialPayment"
                  checked={isPartialPayment}
                  onChange={(e) => setIsPartialPayment(e.target.checked)}
                />
              </label>
            </FormRow>
          </FormGroup>
          <button onClick={() => handleSubmit({})}>Submit Payment</button>
        </FormSection>
      </DialogContent>
    </Dialog>
  );
}
