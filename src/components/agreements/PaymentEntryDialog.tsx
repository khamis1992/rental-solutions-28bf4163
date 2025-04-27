import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PaymentSubmitParams } from "./AgreementDetail.types";

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleSubmit: (
    amount: number,
    paymentDate: Date,
    notes: string,
    paymentMethod: string,
    referenceNumber: string,
    includeLatePaymentFee: boolean,
    isPartialPayment: boolean,
    targetPaymentId?: string
  ) => void;
  defaultAmount?: number;
  lateFeeDetails?: {
    days: number;
    amount: number;
  };
  selectedPayment?: any;
}

interface DatePickerProps {
  selected: Date | undefined;
  onSelect: Dispatch<SetStateAction<Date | undefined>>;
  initialFocus?: boolean;
}

const Calendar = ({ selected, onSelect, initialFocus = true }) => {
  return (
    <div className="p-0">
      <CalendarUI
        selected={selected}
        onSelect={onSelect}
        initialFocus={initialFocus}
        className="pointer-events-auto"
      />
    </div>
  );
};

export function PaymentEntryDialog({
  open,
  onOpenChange,
  handleSubmit,
  defaultAmount = 0,
  lateFeeDetails,
  selectedPayment
}: PaymentEntryDialogProps) {
  const [amount, setAmount] = useState(defaultAmount);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [targetPaymentId, setTargetPaymentId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (defaultAmount) {
      setAmount(defaultAmount);
    }
  }, [defaultAmount]);

  const onSubmit = () => {
    if (!paymentDate) {
      toast.error("Please select a payment date");
      return;
    }

    handleSubmit(
      amount,
      paymentDate,
      notes,
      paymentMethod,
      referenceNumber,
      includeLatePaymentFee,
      isPartialPayment,
      targetPaymentId
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Enter the payment details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
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
                  <Calendar
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference-number">Reference #</Label>
              <Input
                id="reference-number"
                placeholder="Reference number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Payment notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {lateFeeDetails && lateFeeDetails.days > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-late-fee"
                checked={includeLatePaymentFee}
                onCheckedChange={(checked) => setIncludeLatePaymentFee(!!checked)}
              />
              <label
                htmlFor="include-late-fee"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include Late Fee (Days Late: {lateFeeDetails.days}, Amount: {lateFeeDetails.amount})
              </label>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-partial-payment"
              checked={isPartialPayment}
              onCheckedChange={(checked) => setIsPartialPayment(!!checked)}
            />
            <label
              htmlFor="is-partial-payment"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Is Partial Payment
            </label>
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
}
