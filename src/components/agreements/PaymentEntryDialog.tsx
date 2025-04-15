import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { format as dateFormat } from 'date-fns';
import { Payment, ExtendedPayment } from './PaymentHistory.types';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';
import { useAgreements } from '@/hooks/use-agreements';
import { useParams } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Define an interface for payments with additional properties needed in this component
interface PaymentEntryDialogPayment extends ExtendedPayment {
  created_at?: string;
}

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
  
  const [amount, setAmount] = useState<number>(selectedPayment && 'balance' in selectedPayment ? selectedPayment.balance : defaultAmount);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = useState<boolean>(false);
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(false);
  const [pendingPayments, setPendingPayments] = useState<PaymentEntryDialogPayment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | undefined>(
    selectedPayment?.id
  );
  
  useEffect(() => {
    if (open) {
      setAmount(selectedPayment && 'balance' in selectedPayment ? selectedPayment.balance : defaultAmount);
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
        setPendingPayments(data as PaymentEntryDialogPayment[]);
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
    } else if (selectedPayment && 'balance' in selectedPayment && !isNaN(value) && value < (selectedPayment.balance || 0)) {
      setIsPartialPayment(true);
    } else {
      setIsPartialPayment(false);
    }
  };

  const showLateFeeOption = lateFeeDetails !== null;

  const formatPaymentDescription = (payment: PaymentEntryDialogPayment) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {pendingPayments.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="payment-select">Record Payment For</Label>
              <Select 
                value={selectedPaymentId} 
                onValueChange={handlePaymentSelect}
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
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (QAR)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          {defaultAmount > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="partial-payment" 
                checked={isPartialPayment} 
                onCheckedChange={(checked) => setIsPartialPayment(checked as boolean)}
              />
              <Label htmlFor="partial-payment" className="text-sm cursor-pointer">
                This is a partial payment
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payment-date">Payment Date</Label>
            <div className="relative">
              <Input
                id="payment-date"
                value={dateFormat(paymentDate, 'PPP')}
                readOnly
                onClick={() => setCalendarOpen(true)}
                className="cursor-pointer"
              />
              {calendarOpen && (
                <div className="absolute top-full mt-1 z-10 bg-white border rounded-md shadow-lg">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => {
                      if (date) {
                        setPaymentDate(date);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference-number">Reference Number (Optional)</Label>
            <Input
              id="reference-number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Transaction or receipt reference"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information"
              rows={3}
            />
          </div>

          {showLateFeeOption && lateFeeDetails && (
            <div className="border p-3 rounded-md bg-amber-50">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-800">Late Payment Fee</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    {lateFeeDetails.daysLate} days late: QAR {lateFeeDetails.amount.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="late-fee"
                    checked={includeLatePaymentFee}
                    onCheckedChange={setIncludeLatePaymentFee}
                  />
                  <Label htmlFor="late-fee" className="text-xs">Include Fee</Label>
                </div>
              </div>
            </div>
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
