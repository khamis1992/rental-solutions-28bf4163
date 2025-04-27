import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleSubmit: (
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
  lateFeeDetails?: { days: number; amount: number } | null;
  selectedPayment?: any | null;
  title?: string;
  description?: string;
}

export const PaymentEntryDialog: React.FC<PaymentEntryDialogProps> = ({
  open,
  onOpenChange,
  handleSubmit,
  defaultAmount = 0,
  lateFeeDetails,
  selectedPayment,
  title = "Record Payment",
  description = "Enter payment details to record a new payment",
}) => {
  const [amount, setAmount] = useState(defaultAmount || 0);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);

  useEffect(() => {
    if (selectedPayment) {
      setAmount(selectedPayment.amount || 0);
      setPaymentDate(selectedPayment.payment_date ? new Date(selectedPayment.payment_date) : new Date());
      setNotes(selectedPayment.notes || '');
      setPaymentMethod(selectedPayment.payment_method || '');
      setReferenceNumber(selectedPayment.reference_number || '');
    } else {
      setAmount(defaultAmount || 0);
      setPaymentDate(new Date());
      setNotes('');
      setPaymentMethod('');
      setReferenceNumber('');
    }
  }, [selectedPayment, defaultAmount]);

  const onSubmit = () => {
    handleSubmit(
      amount,
      paymentDate,
      notes,
      paymentMethod,
      referenceNumber,
      includeLatePaymentFee,
      isPartialPayment,
      selectedPayment?.id
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentDate" className="text-right">
              Payment Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "PPP") : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <DatePicker
                  mode="single"
                  selected={paymentDate}
                  onSelect={setPaymentDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">
              Payment Method
            </Label>
            <Select onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="referenceNumber" className="text-right">
              Reference Number
            </Label>
            <Input
              type="text"
              id="referenceNumber"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right mt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
            />
          </div>
          {lateFeeDetails && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="includeLateFee" className="text-right">
                Include Late Fee
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="includeLateFee"
                  checked={includeLatePaymentFee}
                  onCheckedChange={(checked) => setIncludeLatePaymentFee(!!checked)}
                />
                <span>
                  Add QAR {lateFeeDetails.amount} (
                  {lateFeeDetails.days} days late)
                </span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isPartialPayment" className="text-right">
              Partial Payment
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="isPartialPayment"
                checked={isPartialPayment}
                onCheckedChange={(checked) => setIsPartialPayment(!!checked)}
              />
              <span>Is this a partial payment?</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={onSubmit}>Record Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
