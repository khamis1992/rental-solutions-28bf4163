
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField, FormGroup, FormRow, FormSection } from '@/components/ui/form-components';
import { Input } from "@/components/ui/input";
import { Payment } from './PaymentHistory.types';

export interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPayment?: Partial<Payment> | null;
  onSubmit: (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean
  ) => Promise<void>;
  defaultAmount?: number | null;
  leaseId?: string;
  rentAmount?: number | null;
  title?: string;
  description?: string;
  lateFeeDetails?: {
    amount: number;
    daysLate: number;
  } | null;
}

export function PaymentEntryDialog({
  open,
  onOpenChange,
  selectedPayment,
  onSubmit,
  defaultAmount,
  title = "Enter Payment Details",
  description = "Provide the necessary information to record the payment.",
  lateFeeDetails = null
}: PaymentEntryDialogProps) {
  const [amount, setAmount] = React.useState<number>(selectedPayment?.amount || defaultAmount || 0);
  const [paymentDate, setPaymentDate] = React.useState<Date>(selectedPayment?.payment_date ? new Date(selectedPayment.payment_date) : new Date());
  const [notes, setNotes] = React.useState<string>(selectedPayment?.notes || selectedPayment?.description || '');
  const [paymentMethod, setPaymentMethod] = React.useState<string>(selectedPayment?.payment_method || 'cash');
  const [referenceNumber, setReferenceNumber] = React.useState<string>(selectedPayment?.reference_number || selectedPayment?.transaction_id || '');
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = React.useState<boolean>(false);
  const [isPartialPayment, setIsPartialPayment] = React.useState<boolean>(false);

  // Update form values when selected payment changes
  React.useEffect(() => {
    if (selectedPayment) {
      setAmount(selectedPayment.amount || 0);
      setPaymentDate(selectedPayment.payment_date ? new Date(selectedPayment.payment_date) : new Date());
      setNotes(selectedPayment.notes || selectedPayment.description || '');
      setPaymentMethod(selectedPayment.payment_method || 'cash');
      setReferenceNumber(selectedPayment.reference_number || selectedPayment.transaction_id || '');
    } else {
      // Reset form when no payment is selected
      setAmount(defaultAmount || 0);
      setPaymentDate(new Date());
      setNotes('');
      setPaymentMethod('cash');
      setReferenceNumber('');
      setIncludeLatePaymentFee(false);
      setIsPartialPayment(false);
    }
  }, [selectedPayment, defaultAmount]);

  const handleSubmit = async () => {
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
        <FormSection title={title} description={description}>
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
                  className="w-full border border-gray-300 rounded px-3 py-2"
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
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </FormField>
            </FormRow>
          </FormGroup>
          <FormGroup>
            {lateFeeDetails && lateFeeDetails.amount > 0 && (
              <FormRow>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeLatePaymentFee}
                    onChange={(e) => setIncludeLatePaymentFee(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Include Late Payment Fee (QAR {lateFeeDetails.amount} for {lateFeeDetails.daysLate} days)</span>
                </label>
              </FormRow>
            )}
            <FormRow>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isPartialPayment}
                  onChange={(e) => setIsPartialPayment(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Is Partial Payment</span>
              </label>
            </FormRow>
          </FormGroup>
          <button
            onClick={handleSubmit}
            className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            {selectedPayment ? 'Update Payment' : 'Submit Payment'}
          </button>
        </FormSection>
      </DialogContent>
    </Dialog>
  );
}
