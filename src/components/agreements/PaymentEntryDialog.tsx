
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField, FormGroup, FormRow, FormSection } from '@/components/ui/form-components';
import { Input } from "@/components/ui/input";
import { Payment } from '@/types/payment-history.types';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPayment?: Payment | null;
  onSubmit: (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    paymentType?: string
  ) => Promise<boolean>;
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

// Define common payment types
const PAYMENT_TYPES = [
  { value: 'rent', label: 'Rent' },
  { value: 'deposit', label: 'Security Deposit' },
  { value: 'late_fee', label: 'Late Fee' },
  { value: 'damage', label: 'Damage Fee' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'refund', label: 'Refund' },
  { value: 'other', label: 'Other' }
];

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
  const [paymentType, setPaymentType] = React.useState<string>(selectedPayment?.type || 'rent');
  const [showVoidWarning, setShowVoidWarning] = React.useState<boolean>(false);

  // Update form values when selected payment changes
  React.useEffect(() => {
    if (selectedPayment) {
      setAmount(selectedPayment.amount || 0);
      setPaymentDate(selectedPayment.payment_date ? new Date(selectedPayment.payment_date) : new Date());
      setNotes(selectedPayment.notes || selectedPayment.description || '');
      setPaymentMethod(selectedPayment.payment_method || 'cash');
      setReferenceNumber(selectedPayment.reference_number || selectedPayment.transaction_id || '');
      setPaymentType(selectedPayment.type || 'rent');
    } else {
      // Reset form when no payment is selected
      setAmount(defaultAmount || 0);
      setPaymentDate(new Date());
      setNotes('');
      setPaymentMethod('cash');
      setReferenceNumber('');
      setIncludeLatePaymentFee(false);
      setIsPartialPayment(false);
      setPaymentType('rent');
    }
  }, [selectedPayment, defaultAmount]);

  // Check if the amount is zero and show a warning
  React.useEffect(() => {
    setShowVoidWarning(!!selectedPayment && amount === 0);
  }, [amount, selectedPayment]);

  const handleSubmit = async () => {
    const success = await onSubmit(
      amount,
      paymentDate,
      notes,
      paymentMethod,
      referenceNumber,
      includeLatePaymentFee,
      isPartialPayment,
      paymentType
    );
    
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FormSection title={title} description={description}>
          {showVoidWarning && (
            <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-300">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription>
                Setting amount to 0 will mark this transaction as void.
              </AlertDescription>
            </Alert>
          )}
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
              <FormField label="Payment Type" htmlFor="paymentType">
                <Select
                  value={paymentType}
                  onValueChange={(value) => setPaymentType(value)}
                >
                  <SelectTrigger id="paymentType">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Payment Method" htmlFor="paymentMethod">
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
            {selectedPayment && amount === 0 ? 'Void Payment' : selectedPayment ? 'Update Payment' : 'Submit Payment'}
          </button>
        </FormSection>
      </DialogContent>
    </Dialog>
  );
}
