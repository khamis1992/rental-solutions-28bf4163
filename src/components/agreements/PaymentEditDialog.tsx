
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Payment } from './PaymentHistory.types';
import { z } from 'zod';

interface PaymentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
  onPaymentUpdated: (payment: Payment) => Promise<void>;
}

// Payment schema for validation
const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.date().optional().nullable(),
  payment_method: z.string().min(1, 'Payment method is required'),
  description: z.string().optional(),
  reference_number: z.string().optional().nullable(),
});

export const PaymentEditDialog = ({ 
  open, 
  onOpenChange, 
  payment,
  onPaymentUpdated
}: PaymentEditDialogProps) => {
  const [amount, setAmount] = useState(payment?.amount || 0);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(payment?.payment_date ? new Date(payment.payment_date) : new Date());
  const [paymentMethod, setPaymentMethod] = useState(payment?.payment_method || 'cash');
  const [description, setDescription] = useState(payment?.description || '');
  const [referenceNumber, setReferenceNumber] = useState(payment?.reference_number || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when payment changes
  useEffect(() => {
    if (payment) {
      setAmount(payment.amount || 0);
      setPaymentDate(payment.payment_date ? new Date(payment.payment_date) : new Date());
      setPaymentMethod(payment.payment_method || 'cash');
      setDescription(payment.description || '');
      setReferenceNumber(payment.reference_number || '');
    }
  }, [payment]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});
      
      // Construct payment data
      const updatedPayment = {
        ...payment,
        amount,
        payment_date: paymentDate ? paymentDate.toISOString() : null,
        payment_method: paymentMethod,
        description,
        reference_number: referenceNumber || null,
      };
      
      // Validate with Zod
      try {
        paymentSchema.parse({
          ...updatedPayment,
          amount: Number(updatedPayment.amount),
        });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          validationError.errors.forEach(err => {
            fieldErrors[err.path[0]] = err.message;
          });
          setErrors(fieldErrors);
          return;
        }
      }
      
      // Update payment
      await onPaymentUpdated(updatedPayment);
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating payment:", error);
      setErrors({ submit: 'Failed to update payment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Edit the details for this payment record.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                QAR
              </span>
              <Input
                id="amount"
                type="number"
                className="pl-12"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentDate" className="text-right">
              Payment Date
            </Label>
            <div className="col-span-3">
              <DatePicker
                date={paymentDate}
                setDate={setPaymentDate}
              />
              {errors.payment_date && <p className="text-red-500 text-xs mt-1">{errors.payment_date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="method" className="text-right">
              Payment Method
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="method" className="col-span-3">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reference" className="text-right">
              Reference #
            </Label>
            <Input
              id="reference"
              className="col-span-3"
              placeholder="Optional reference number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              className="col-span-3"
              placeholder="Optional payment notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-3">
            {errors.submit}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
