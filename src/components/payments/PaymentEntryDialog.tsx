
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentAmount?: number;
  onSubmit: (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean
  ) => void;
}

export function PaymentEntryDialog({
  open,
  onOpenChange,
  rentAmount = 0,
  onSubmit,
}: PaymentEntryDialogProps) {
  const [amount, setAmount] = useState<number>(rentAmount);
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = useState<boolean>(false);
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      amount,
      date,
      notes,
      paymentMethod,
      referenceNumber,
      includeLatePaymentFee,
      isPartialPayment
    );
    onOpenChange(false);
    resetForm();
  };
  
  const resetForm = () => {
    setAmount(rentAmount);
    setDate(new Date());
    setNotes('');
    setPaymentMethod('cash');
    setReferenceNumber('');
    setIncludeLatePaymentFee(false);
    setIsPartialPayment(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => setDate(date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="online">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference/Transaction Number</Label>
            <Input
              id="referenceNumber"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Optional"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional payment notes"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeLatePaymentFee"
              checked={includeLatePaymentFee}
              onCheckedChange={(checked) => 
                setIncludeLatePaymentFee(checked === true)
              }
            />
            <Label htmlFor="includeLatePaymentFee">Include late payment fee</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPartialPayment"
              checked={isPartialPayment}
              onCheckedChange={(checked) => 
                setIsPartialPayment(checked === true)
              }
            />
            <Label htmlFor="isPartialPayment">This is a partial payment</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Record Payment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
