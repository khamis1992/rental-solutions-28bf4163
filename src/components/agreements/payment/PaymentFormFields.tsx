
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { format as dateFormat } from 'date-fns';
import { cn } from '@/lib/utils';

interface PaymentFormFieldsProps {
  amount: number;
  paymentDate: Date;
  notes: string;
  paymentMethod: string;
  referenceNumber: string;
  isPartialPayment: boolean;
  defaultAmount: number;
  calendarOpen: boolean;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaymentDateSelect: (date: Date | undefined) => void;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onPaymentMethodChange: (value: string) => void;
  onReferenceNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPartialPaymentChange: (checked: boolean) => void;
  setCalendarOpen: (open: boolean) => void;
}

export const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({
  amount,
  paymentDate,
  notes,
  paymentMethod,
  referenceNumber,
  isPartialPayment,
  defaultAmount,
  calendarOpen,
  onAmountChange,
  onPaymentDateSelect,
  onNotesChange,
  onPaymentMethodChange,
  onReferenceNumberChange,
  onPartialPaymentChange,
  setCalendarOpen,
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="amount">Payment Amount (QAR)</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={onAmountChange}
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
            onCheckedChange={(checked) => onPartialPaymentChange(checked as boolean)}
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
                onSelect={onPaymentDateSelect}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-method">Payment Method</Label>
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
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
          onChange={onReferenceNumberChange}
          placeholder="Transaction or receipt reference"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={onNotesChange}
          placeholder="Add any additional information"
          rows={3}
        />
      </div>
    </>
  );
};
