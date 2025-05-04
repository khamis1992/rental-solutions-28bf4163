import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { PaymentStatus } from '@/types/payment';

interface PaymentFormProps {
  agreementId: string;
  onSubmit: (payment: any) => void;
  onCancel: () => void;
  rentAmount?: number | null;
  contractAmount?: number | null;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ agreementId, onSubmit, onCancel, rentAmount, contractAmount }) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [description, setDescription] = useState('');
  const [paymentType, setPaymentType] = useState('rent');
  const [lateFeeAmount, setLateFeeAmount] = useState('');

  const handleSubmit = () => {
    // Make sure we use the right status value from the enum
    const newPayment = {
      amount: amount,
      payment_date: paymentDate,
      lease_id: agreementId,
      payment_method: paymentMethod,
      description: description,
      status: 'completed' as PaymentStatus,
      type: paymentType,
      late_fine_amount: lateFeeAmount
    };

    onSubmit(newPayment);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          type="number"
          id="amount"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="paymentDate">Payment Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[240px] justify-start text-left font-normal',
                !paymentDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {paymentDate ? format(paymentDate, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" side="bottom">
            <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} className="rounded-md border" />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Input
          type="text"
          id="paymentMethod"
          placeholder="Enter payment method"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          type="text"
          id="description"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="paymentType">Payment Type</Label>
        <select
          id="paymentType"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-popover file:text-popover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
        >
          <option value="rent">Rent</option>
          <option value="deposit">Deposit</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <Label htmlFor="lateFeeAmount">Late Fee Amount</Label>
        <Input
          type="number"
          id="lateFeeAmount"
          placeholder="Enter late fee amount"
          value={lateFeeAmount}
          onChange={(e) => setLateFeeAmount(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  );
};

export default PaymentForm;
