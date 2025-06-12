
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { Payment } from '@/types/payment.types';

interface PaymentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
  onSubmit: (payment: Payment) => Promise<void>;
}

export function PaymentEditDialog({
  open,
  onOpenChange,
  payment,
  onSubmit
}: PaymentEditDialogProps) {
  const [amount, setAmount] = useState(payment.amount);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date(payment.payment_date || new Date()));
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(payment.payment_method || 'cash');
  const [referenceNumber, setReferenceNumber] = useState('');

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount);
      setPaymentDate(new Date(payment.payment_date || new Date()));
      setNotes(payment.description || '');
      setPaymentMethod(payment.payment_method || 'cash');
      setReferenceNumber(payment.reference_number || '');
    }
  }, [payment]);

  const handleSubmit = async () => {
    const updatedPayment: Payment = {
      ...payment,
      amount: parseFloat(amount.toString()),
      payment_date: paymentDate.toISOString(),
      description: notes,
      payment_method: paymentMethod,
      reference_number: referenceNumber
    };

    try {
      await onSubmit(updatedPayment);
      toast.success('Payment updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setPaymentDate(date);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Make changes to the payment details.
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
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentDate" className="text-right">
              Payment Date
            </Label>
            <DatePicker
              date={paymentDate}
              setDate={handleDateChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">
              Payment Method
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
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
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
