import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, differenceInCalendarDays, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { Payment } from '@/types/payment.types';

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    amount: number,
    date: Date,
    notes?: string,
    method?: string,
    reference?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    paymentType?: string,
    paymentId?: string
  ) => Promise<boolean>;
  defaultAmount?: number;
  title?: string;
  description?: string;
  leaseId: string;
  rentAmount?: number | null;
  selectedPayment?: Payment | null;
  pendingPayments?: Payment[];
}

export function PaymentEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultAmount = 0,
  title = "Record Payment",
  description = "Enter payment details",
  leaseId,
  rentAmount,
  selectedPayment,
  pendingPayments = []
}: PaymentEntryDialogProps) {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [description_text, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find the selected payment from the list
  const selectedScheduledPayment = useMemo(() => {
    return pendingPayments.find(p => p.id === selectedPaymentId) || null;
  }, [pendingPayments, selectedPaymentId]);

  // Calculate late fee
  const calculatedLateFee = useMemo(() => {
    if (!selectedScheduledPayment) return 0;
    const dueDate = selectedScheduledPayment.original_due_date ? new Date(selectedScheduledPayment.original_due_date) : null;
    if (!dueDate) return 0;
    const today = new Date();
    if (!isAfter(today, dueDate)) return 0;
    const daysLate = differenceInCalendarDays(today, dueDate);
    let fee = daysLate * 120;
    if (fee > 3000) fee = 3000;
    return fee;
  }, [selectedScheduledPayment]);

  // Calculate total due
  const totalDue = useMemo(() => {
    if (!selectedScheduledPayment) return 0;
    return (selectedScheduledPayment.amount || 0) + calculatedLateFee;
  }, [selectedScheduledPayment, calculatedLateFee]);

  // Reset form when dialog opens or selectedPayment changes
  useEffect(() => {
    if (selectedPayment) {
      setAmount((selectedPayment.amount || 0).toString());
      setPaymentDate(new Date(selectedPayment.payment_date));
      setDescription(selectedPayment.description || '');
      setPaymentMethod(selectedPayment.payment_method || 'cash');
      setReferenceNumber(selectedPayment.reference_number || '');
      setSelectedPaymentId(selectedPayment.id);
    } else if (pendingPayments.length > 0) {
      setSelectedPaymentId(pendingPayments[0].id);
      setAmount(((pendingPayments[0].amount || 0) + (calculatedLateFee || 0)).toString());
      setPaymentDate(new Date());
      setDescription('');
      setPaymentMethod('cash');
      setReferenceNumber('');
    } else {
      setSelectedPaymentId(null);
      setAmount(defaultAmount.toString());
      setPaymentDate(new Date());
      setDescription('');
      setPaymentMethod('cash');
      setReferenceNumber('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPayment, defaultAmount, open, pendingPayments.length]);

  // Update amount when selected payment or late fee changes
  useEffect(() => {
    if (selectedScheduledPayment) {
      setAmount((totalDue).toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScheduledPayment, totalDue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await onSubmit(
        parseFloat(amount),
        paymentDate,
        description_text,
        paymentMethod,
        referenceNumber,
        !!calculatedLateFee,
        parseFloat(amount) < totalDue,
        selectedScheduledPayment?.type,
        selectedScheduledPayment?.id
      );
      if (success) {
        onOpenChange(false);
        setAmount(defaultAmount.toString());
        setPaymentDate(new Date());
        setDescription('');
        setPaymentMethod('cash');
        setReferenceNumber('');
        setSelectedPaymentId(null);
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment selection dropdown */}
          {pendingPayments.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="scheduled-payment">Select Payment</Label>
              <Select value={selectedPaymentId || ''} onValueChange={setSelectedPaymentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a payment to pay" />
                </SelectTrigger>
                <SelectContent>
                  {pendingPayments.map((p) => (
                    <SelectItem value={p.id} key={p.id}>
                      {p.description || format(new Date(p.original_due_date || p.payment_date || ''), 'MMM yyyy')} - QAR {p.amount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show due, late fee, total */}
          {selectedScheduledPayment && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Due Amount: <span className="font-semibold text-black">QAR {selectedScheduledPayment.amount}</span></div>
              <div>Late Fee: <span className="font-semibold text-black">QAR {calculatedLateFee}</span></div>
              <div>Total Due: <span className="font-semibold text-black">QAR {totalDue}</span></div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (QAR)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter payment amount"
              required
              min={0.01}
              max={totalDue}
            />
            {selectedScheduledPayment && parseFloat(amount) < totalDue && (
              <div className="text-xs text-orange-600">Partial payment: QAR {totalDue - parseFloat(amount)} will remain pending.</div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Transaction reference (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description_text}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Payment description or notes (optional)"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
