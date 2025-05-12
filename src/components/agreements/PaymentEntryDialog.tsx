
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Define common payment types - moved outside component to prevent recreations on renders
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
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = useState<boolean>(false);
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(false);
  const [paymentType, setPaymentType] = useState<string>('rent');
  const [showVoidWarning, setShowVoidWarning] = useState<boolean>(false);

  // Update form values when selected payment changes or default amount changes
  useEffect(() => {
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
  }, [selectedPayment, defaultAmount]); // Only depend on selectedPayment and defaultAmount

  // Check if the amount is zero and show a warning - optimized dependency
  useEffect(() => {
    const isZeroAmount = amount === 0;
    const shouldShowWarning = Boolean(selectedPayment) && isZeroAmount;
    setShowVoidWarning(shouldShowWarning);
  }, [amount, selectedPayment]); // Only depend on amount and whether selectedPayment exists

  // Memoize the handleSubmit function to avoid recreating it on each render
  const handleSubmit = useCallback(async () => {
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
  }, [
    amount, 
    paymentDate, 
    notes, 
    paymentMethod, 
    referenceNumber, 
    includeLatePaymentFee, 
    isPartialPayment, 
    paymentType, 
    onSubmit, 
    onOpenChange
  ]);

  // Calculate button text based on payment state - memoized to avoid recalculation
  const buttonText = useMemo(() => {
    if (selectedPayment && amount === 0) return 'Void Payment';
    return selectedPayment ? 'Update Payment' : 'Submit Payment';
  }, [selectedPayment, amount]);

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
            {buttonText}
          </button>
        </FormSection>
      </DialogContent>
    </Dialog>
  );
}
