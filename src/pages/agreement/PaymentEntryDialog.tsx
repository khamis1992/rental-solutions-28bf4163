import React, { useState, useCallback, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "@radix-ui/react-icons"
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAgreementService } from '@/hooks/services';
import { usePaymentGeneration } from '@/hooks/payments';

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId?: string;
  title?: string;
  description?: string;
  defaultAmount?: number;
  rentAmount?: number;
  lateFeeDetails?: { amount: number; daysLate: number } | null;
  onSubmit: (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean
  ) => Promise<void>;
}

const PaymentEntryDialog: React.FC<PaymentEntryDialogProps> = ({
  open,
  onOpenChange,
  agreementId,
  title = "Enter Payment Details",
  description = "Please enter the payment details below.",
  defaultAmount = 0,
  rentAmount = 0,
  lateFeeDetails,
  onSubmit,
}) => {
  const [amount, setAmount] = useState(defaultAmount > 0 ? defaultAmount : rentAmount > 0 ? rentAmount : 0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);

  const { getAgreement } = useAgreementService();
  const { handleSpecialAgreementPayments, isProcessing } = usePaymentGeneration(null, agreementId);

  useEffect(() => {
    if (defaultAmount > 0) {
      setAmount(defaultAmount);
    } else if (rentAmount > 0) {
      setAmount(rentAmount);
    }
  }, [defaultAmount, rentAmount]);

  const handleSubmit = useCallback(async () => {
    if (!date) {
      toast.error("Please select a payment date.");
      return;
    }

    try {
      await onSubmit(
        amount,
        date,
        notes,
        paymentMethod,
        referenceNumber,
        includeLatePaymentFee,
        isPartialPayment
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Payment submission failed:", error);
      toast.error("Failed to submit payment. Please check the details and try again.");
    }
  }, [amount, date, notes, paymentMethod, referenceNumber, includeLatePaymentFee, isPartialPayment, onSubmit, onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Payment Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "PPP") : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date > new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">
              Payment Method
            </Label>
            <Input
              type="text"
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="col-span-3"
            />
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
          {lateFeeDetails && lateFeeDetails.amount > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="includeLatePaymentFee" className="text-right">
                Include Late Fee ({lateFeeDetails.amount} QAR)
              </Label>
              <Switch
                id="includeLatePaymentFee"
                checked={includeLatePaymentFee}
                onCheckedChange={setIncludeLatePaymentFee}
                className="col-span-3"
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isPartialPayment" className="text-right">
              Partial Payment
            </Label>
            <Switch
              id="isPartialPayment"
              checked={isPartialPayment}
              onCheckedChange={setIsPartialPayment}
              className="col-span-3"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? "Submitting..." : "Submit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentEntryDialog;
