
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number, paymentDate: Date, notes?: string, paymentMethod?: string, referenceNumber?: string, includeLatePaymentFee?: boolean, isPartialPayment?: boolean) => Promise<void>;
  title?: string;
  description?: string;
  defaultAmount?: number | null;
  rentAmount?: number | null;
}

export function PaymentEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  title = "Record Payment",
  description = "Enter payment details to record a new payment",
  defaultAmount = 0,
  rentAmount = 0
}: PaymentEntryDialogProps) {
  const [amount, setAmount] = useState<number>(defaultAmount || 0);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = useState<boolean>(false);
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setAmount(defaultAmount || 0);
    setPaymentDate(new Date());
    setPaymentMethod('cash');
    setNotes('');
    setReferenceNumber('');
    setIncludeLatePaymentFee(false);
    setIsPartialPayment(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(
        amount,
        paymentDate,
        notes,
        paymentMethod,
        referenceNumber,
        includeLatePaymentFee,
        isPartialPayment
      );
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Credit/Debit Card' },
    { id: 'bank', label: 'Bank Transfer' },
    { id: 'check', label: 'Check' },
    { id: 'other', label: 'Other' },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                placeholder="Enter amount"
                required
              />
              {rentAmount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setAmount(rentAmount)}
                >
                  <Check className="mr-1 h-3 w-3" /> Use Monthly Rent (QAR {rentAmount.toFixed(2)})
                </Button>
              )}
            </div>

            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="paymentDate"
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => date && setPaymentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select
                id="paymentMethod"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Transaction ID, Receipt #, etc."
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional information"
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isPartialPayment" 
                checked={isPartialPayment}
                onCheckedChange={(checked) => setIsPartialPayment(checked === true)}
              />
              <Label htmlFor="isPartialPayment">This is a partial payment</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeLatePaymentFee" 
                checked={includeLatePaymentFee}
                onCheckedChange={(checked) => setIncludeLatePaymentFee(checked === true)}
              />
              <Label htmlFor="includeLatePaymentFee">Include late payment fee</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Submit Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
