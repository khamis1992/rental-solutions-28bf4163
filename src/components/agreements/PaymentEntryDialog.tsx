import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExtendedPayment, Payment } from './PaymentHistory.types';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';
import { useParams } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PaymentFormFields } from './payment/PaymentFormFields';
import { PendingPaymentsSelect } from './payment/PendingPaymentsSelect';
import { LateFeeSection } from './payment/LateFeeSection';

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    targetPaymentId?: string
  ) => void;
  defaultAmount?: number;
  title?: string;
  description?: string;
  lateFeeDetails?: {
    amount: number;
    daysLate: number;
  } | null;
  selectedPayment?: Payment | null;
}

export function PaymentEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultAmount = 0,
  title = "Record Payment",
  description = "Enter payment details to record a payment",
  lateFeeDetails,
  selectedPayment
}: PaymentEntryDialogProps) {
  const { id: agreementId } = useParams();
  const { getAgreement } = useAgreements();
  const { handleSpecialAgreementPayments, isProcessing } = usePaymentGeneration(null, agreementId);
  
  const [amount, setAmount] = useState<number>(selectedPayment?.balance || defaultAmount);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = useState<boolean>(false);
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(false);
  const [pendingPayments, setPendingPayments] = useState<ExtendedPayment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | undefined>(
    selectedPayment?.id
  );
  
  useEffect(() => {
    if (open) {
      setAmount(selectedPayment?.balance || defaultAmount);
      setPaymentDate(new Date());
      setNotes('');
      setPaymentMethod('cash');
      setReferenceNumber('');
      setIncludeLatePaymentFee(false);
      setIsPartialPayment(false);
      setSelectedPaymentId(selectedPayment?.id);
      
      if (agreementId) {
        fetchPendingPayments(agreementId);
      }
    }
  }, [open, defaultAmount, selectedPayment, agreementId]);

  const fetchPendingPayments = async (agreementId: string) => {
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .in('status', ['pending', 'partially_paid', 'overdue'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching pending payments:", error);
        return;
      }
      
      if (data && data.length > 0) {
        setPendingPayments(data as ExtendedPayment[]);
        console.log("Found payments for dialog:", data);
      } else {
        console.log("No pending/overdue payments found");
        setPendingPayments([]);
      }
    } catch (err) {
      console.error("Unexpected error fetching pending payments:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than zero");
      return;
    }
    
    const paymentResult = await handleSpecialAgreementPayments(
      amount,
      paymentDate,
      notes,
      paymentMethod,
      referenceNumber,
      includeLatePaymentFee,
      isPartialPayment,
      selectedPaymentId
    );
    
    if (paymentResult) {
      onSubmit(
        amount, 
        paymentDate, 
        notes, 
        paymentMethod, 
        referenceNumber, 
        includeLatePaymentFee,
        isPartialPayment,
        selectedPaymentId
      );
    }
  };

  const handlePaymentSelect = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    
    const payment = pendingPayments.find(p => p.id === paymentId);
    if (payment) {
      setAmount(payment.balance || payment.amount || 0);
      setIsPartialPayment(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAmount(isNaN(value) ? 0 : value);
    
    if (!isNaN(value) && defaultAmount > 0 && value < defaultAmount) {
      setIsPartialPayment(true);
    } else if (selectedPayment && !isNaN(value) && value < (selectedPayment.balance || 0)) {
      setIsPartialPayment(true);
    } else {
      setIsPartialPayment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {pendingPayments.length > 0 && (
            <PendingPaymentsSelect
              pendingPayments={pendingPayments}
              selectedPaymentId={selectedPaymentId}
              onPaymentSelect={handlePaymentSelect}
            />
          )}

          <PaymentFormFields
            amount={amount}
            paymentDate={paymentDate}
            notes={notes}
            paymentMethod={paymentMethod}
            referenceNumber={referenceNumber}
            isPartialPayment={isPartialPayment}
            defaultAmount={defaultAmount}
            calendarOpen={calendarOpen}
            onAmountChange={handleAmountChange}
            onPaymentDateSelect={(date) => {
              if (date) {
                setPaymentDate(date);
                setCalendarOpen(false);
              }
            }}
            onNotesChange={(e) => setNotes(e.target.value)}
            onPaymentMethodChange={setPaymentMethod}
            onReferenceNumberChange={(e) => setReferenceNumber(e.target.value)}
            onPartialPaymentChange={(checked) => setIsPartialPayment(checked)}
            setCalendarOpen={setCalendarOpen}
          />

          {lateFeeDetails && (
            <LateFeeSection
              lateFeeDetails={lateFeeDetails}
              includeLatePaymentFee={includeLatePaymentFee}
              onLatePaymentFeeChange={setIncludeLatePaymentFee}
            />
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
