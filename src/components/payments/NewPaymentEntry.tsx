
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface NewPaymentEntryProps {
  onBack: () => void;
  onClose: () => void;
}

export function NewPaymentEntry({ onBack, onClose }: NewPaymentEntryProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [description, setDescription] = useState('');
  const [payer, setPayer] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [generateInvoice, setGenerateInvoice] = useState(false);

  const handleSubmit = () => {
    // In a real implementation, we would save the payment to the database
    // and generate an invoice if requested
    
    onClose();
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
        <Label htmlFor="payer">Payer Name</Label>
        <Input
          type="text"
          id="payer"
          placeholder="Enter payer name"
          value={payer}
          onChange={(e) => setPayer(e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="paymentDate">Payment Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-full justify-start text-left font-normal',
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
        <select
          id="paymentMethod"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-popover file:text-popover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="cash">Cash</option>
          <option value="card">Credit/Debit Card</option>
          <option value="bank">Bank Transfer</option>
          <option value="check">Check</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div>
        <Label htmlFor="referenceNumber">Reference Number</Label>
        <Input
          type="text"
          id="referenceNumber"
          placeholder="Enter reference number"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter payment description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="generateInvoice"
          checked={generateInvoice}
          onChange={(e) => setGenerateInvoice(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="generateInvoice">Generate invoice</Label>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  );
}
