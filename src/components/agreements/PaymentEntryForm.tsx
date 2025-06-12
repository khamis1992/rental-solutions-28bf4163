
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { differenceInDays, isBefore } from 'date-fns';
import { Calculator, AlertTriangle } from 'lucide-react';
import { Payment } from '@/types/payment.types';

interface PaymentEntryFormProps {
  onSubmit: (amount: number, date: Date, notes: string, method: string, reference: string) => Promise<boolean>;
  onCancel: () => void;
  defaultAmount?: number;
  rentAmount?: number | null;
  selectedPayment?: Payment | null;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
}

export function PaymentEntryForm({
  onSubmit,
  onCancel,
  defaultAmount = 0,
  rentAmount,
  selectedPayment,
  leaseStartDate,
  leaseEndDate
}: PaymentEntryFormProps) {
  const [amount, setAmount] = useState(defaultAmount);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [lateFees, setLateFees] = useState(0);
  const [dailyLateFeeRate, setDailyLateFeeRate] = useState(0.01); // 1% daily late fee
  const [showCalculator, setShowCalculator] = useState(false);

  const calculateLateFees = useCallback(() => {
    if (!leaseStartDate || !rentAmount) {
      return 0;
    }

    const startDate = new Date(leaseStartDate);

    if (isBefore(paymentDate, startDate)) {
      return 0;
    }

    const daysLate = differenceInDays(paymentDate, startDate);
    const lateFee = daysLate > 0 ? daysLate * dailyLateFeeRate : 0;
    return parseFloat(lateFee.toFixed(2));
  }, [paymentDate, rentAmount, dailyLateFeeRate, leaseStartDate]);

  useEffect(() => {
    if (selectedPayment) {
      setAmount(selectedPayment.amount);
      setPaymentDate(new Date(selectedPayment.payment_date || new Date()));
      setNotes(selectedPayment.description || '');
      setPaymentMethod(selectedPayment.payment_method || 'cash');
      setReferenceNumber(selectedPayment.reference_number || '');
    } else {
      setAmount(defaultAmount);
      setPaymentDate(new Date());
      setNotes('');
      setPaymentMethod('cash');
      setReferenceNumber('');
    }
  }, [selectedPayment, defaultAmount]);

  useEffect(() => {
    if (rentAmount) {
      setAmount(rentAmount);
    }
  }, [rentAmount]);

  useEffect(() => {
    if (leaseStartDate && leaseEndDate) {
      const dailyRate = rentAmount ? rentAmount / 30 : 0;
      setDailyLateFeeRate(dailyRate > 0 ? dailyRate * 0.01 : 0.01);
    }
  }, [leaseStartDate, leaseEndDate, rentAmount]);

  useEffect(() => {
    setLateFees(calculateLateFees());
  }, [paymentDate, calculateLateFees]);

  const toggleCalculator = () => {
    setShowCalculator(!showCalculator);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value);
    setAmount(isNaN(newAmount) ? 0 : newAmount);
  };

  const handlePaymentDateChange = (date: Date | undefined) => {
    if (date) {
      setPaymentDate(date);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
  };

  const handleReferenceNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReferenceNumber(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    try {
      const success = await onSubmit(
        amount,
        paymentDate,
        notes,
        paymentMethod,
        referenceNumber
      );
      
      if (success) {
        // Reset form or close dialog
        setAmount(defaultAmount);
        setNotes('');
        setReferenceNumber('');
        setPaymentMethod('cash');
        setPaymentDate(new Date());
        toast.success('Payment recorded successfully');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to record payment');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Input
                  type="number"
                  id="amount"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={toggleCalculator}
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <DatePicker
                id="paymentDate"
                date={paymentDate}
                setDate={handlePaymentDateChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
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

          <div>
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              type="text"
              id="referenceNumber"
              placeholder="Reference number"
              value={referenceNumber}
              onChange={handleReferenceNumberChange}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Payment notes"
              value={notes}
              onChange={handleNotesChange}
            />
          </div>
        </CardContent>
      </Card>

      {lateFees > 0 && (
        <div className="flex items-center p-4 bg-amber-50 text-amber-800 rounded-md">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>
            Late fee: {formatCurrency(lateFees)}
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Record Payment</Button>
      </div>
    </form>
  );
}
