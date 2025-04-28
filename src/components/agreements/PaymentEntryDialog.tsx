
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Payment } from './PaymentHistory.types';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { z } from 'zod';

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentCreated: (payment: Partial<Payment>) => Promise<void>;
  leaseId?: string;
  rentAmount?: number | null;
}

// Payment schema for validation
const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.date(),
  payment_method: z.string().min(1, 'Payment method is required'),
  description: z.string().optional(),
  reference_number: z.string().optional().nullable(),
  lease_id: z.string().uuid('Invalid lease ID')
});

export const PaymentEntryDialog = ({ 
  open, 
  onOpenChange, 
  onPaymentCreated,
  leaseId,
  rentAmount = 0
}: PaymentEntryDialogProps) => {
  const [amount, setAmount] = useState(rentAmount || 0);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [description, setDescription] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate late fee if any
  const calculateLateFee = () => {
    const currentDate = paymentDate || new Date();
    const dayOfMonth = currentDate.getDate();
    
    if (dayOfMonth > 1) {
      const daysLate = dayOfMonth - 1;
      const dailyLateFee = 120; // Default daily late fee (QAR)
      const lateFee = Math.min(daysLate * dailyLateFee, 3000); // Cap at 3000 QAR
      return { daysLate, lateFee };
    }
    
    return { daysLate: 0, lateFee: 0 };
  };

  const { daysLate, lateFee } = calculateLateFee();
  const totalAmount = amount + (includeLatePaymentFee ? lateFee : 0);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});
      
      // Validate the data
      if (!leaseId) {
        setErrors(prev => ({ ...prev, lease_id: 'Lease ID is missing' }));
        return;
      }
      
      // Construct payment data
      const paymentData = {
        lease_id: leaseId,
        amount: isPartialPayment ? rentAmount : amount,
        amount_paid: amount,
        balance: isPartialPayment ? (rentAmount || 0) - amount : 0,
        payment_date: paymentDate.toISOString(),
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        description: description || `Rent payment`,
        status: isPartialPayment ? 'partially_paid' : 'completed',
        type: 'rent'
      };
      
      // Validate with Zod
      try {
        paymentSchema.parse({
          ...paymentData,
          amount: Number(paymentData.amount),
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
      
      // Create payment
      await onPaymentCreated({
        ...paymentData,
        // Additional options for special payment handling
        options: {
          isPartialPayment,
          includeLatePaymentFee,
        }
      });
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error creating payment:", error);
      setErrors({ submit: 'Failed to create payment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount(rentAmount || 0);
    setPaymentDate(new Date());
    setPaymentMethod('cash');
    setDescription('');
    setReferenceNumber('');
    setIsPartialPayment(false);
    setIncludeLatePaymentFee(false);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record New Payment</DialogTitle>
          <DialogDescription>
            Enter the payment details for this agreement.
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

          {daysLate > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-amber-800">Late Payment Detected</span>
                  <span className="text-amber-800 font-medium">{daysLate} days late</span>
                </div>
                <p className="text-amber-700 text-sm mb-3">
                  This payment is being made after the 1st of the month. A late fee may apply.
                </p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeFee" className="cursor-pointer text-sm text-amber-800">
                    Include late fee ({formatCurrency(lateFee)})
                  </Label>
                  <Switch
                    id="includeFee"
                    checked={includeLatePaymentFee}
                    onCheckedChange={setIncludeLatePaymentFee}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="partialPayment"
              checked={isPartialPayment}
              onCheckedChange={setIsPartialPayment}
            />
            <Label htmlFor="partialPayment" className="cursor-pointer">
              This is a partial payment
            </Label>
          </div>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-3">
            {errors.submit}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div className="font-medium">
            Total: {formatCurrency(totalAmount)}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
