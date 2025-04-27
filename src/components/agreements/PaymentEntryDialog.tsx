
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { ExtendedPayment } from './PaymentHistory.types';

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleSubmit: (
    amount: number,
    paymentDate: Date,
    notes: string | undefined,
    paymentMethod: string | undefined,
    referenceNumber: string | undefined,
    includeLatePaymentFee: boolean,
    isPartialPayment: boolean,
    targetPaymentId?: string
  ) => void;
  defaultAmount?: number;
  lateFeeDetails?: { days: number; amount: number };
  selectedPayment?: ExtendedPayment | null;
}

export function PaymentEntryDialog({
  open,
  onOpenChange,
  handleSubmit,
  defaultAmount = 0,
  lateFeeDetails,
  selectedPayment
}: PaymentEntryDialogProps) {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = useState<boolean>(false);
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setAmount(defaultAmount);
      setPaymentDate(new Date());
      setNotes('');
      setPaymentMethod('cash');
      setReferenceNumber('');
      setIncludeLatePaymentFee(false);
      setIsPartialPayment(false);
      setIsSubmitting(false);
    } else if (selectedPayment) {
      // Populate form with selected payment data if editing
      setAmount(selectedPayment.amount);
      setPaymentDate(new Date(selectedPayment.payment_date));
      setNotes(selectedPayment.notes || '');
      setPaymentMethod(selectedPayment.payment_method || 'cash');
      setReferenceNumber(selectedPayment.reference_number || '');
    } else {
      // Reset to defaults for new payment
      setAmount(defaultAmount);
    }
  }, [open, defaultAmount, selectedPayment]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetId = selectedPayment?.id;
      
      await handleSubmit(
        amount, 
        paymentDate, 
        notes || undefined, 
        paymentMethod, 
        referenceNumber || undefined,
        includeLatePaymentFee,
        isPartialPayment,
        targetId
      );
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{selectedPayment ? "Edit Payment" : "Record New Payment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleFormSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="amount">Payment Amount (QAR)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                autoComplete="off"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP") : "Select date"}
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
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="reference-number">Reference Number (Optional)</Label>
              <Input
                id="reference-number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Receipt #, Check #, etc."
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional payment details"
                rows={3}
              />
            </div>
            
            {lateFeeDetails && lateFeeDetails.days > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="include-late-fee" className="inline-flex items-center">
                    Include Late Fee
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p>Payment is {lateFeeDetails.days} days late.</p>
                            <p>Late fee: QAR {lateFeeDetails.amount.toFixed(2)}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Switch 
                    id="include-late-fee"
                    checked={includeLatePaymentFee}
                    onCheckedChange={(checked) => setIncludeLatePaymentFee(!!checked)}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="partial-payment" className="inline-flex items-center">
                  Partial Payment
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Record this as a partial payment against the full amount due</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Switch 
                  id="partial-payment"
                  checked={isPartialPayment} 
                  onCheckedChange={(checked) => setIsPartialPayment(!!checked)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : selectedPayment ? "Update Payment" : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
