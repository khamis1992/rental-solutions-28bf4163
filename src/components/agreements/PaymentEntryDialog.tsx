
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { PaymentSubmitParams } from './AgreementDetail.types';

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
  title?: string;
  description?: string;
  lateFeeDetails?: { days: number; amount: number } | null;
  selectedPayment?: any;
}

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  paymentDate: z.date(),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  includeLatePaymentFee: z.boolean().optional(),
  isPartialPayment: z.boolean().optional()
});

export const PaymentEntryDialog = ({
  open,
  onOpenChange,
  handleSubmit,
  defaultAmount = 0,
  title = "Record Payment",
  description = "Enter payment details",
  lateFeeDetails = null,
  selectedPayment = null
}: PaymentEntryDialogProps) => {
  const [isLateFeeIncluded, setIsLateFeeIncluded] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: defaultAmount,
      paymentDate: new Date(),
      notes: '',
      paymentMethod: 'cash',
      referenceNumber: '',
      includeLatePaymentFee: false,
      isPartialPayment: false
    },
  });

  useEffect(() => {
    if (defaultAmount) {
      form.setValue('amount', defaultAmount);
    }
  }, [defaultAmount, form]);

  const onSubmit = (values: z.infer<typeof paymentSchema>) => {
    handleSubmit(
      values.amount,
      values.paymentDate,
      values.notes,
      paymentMethod,
      referenceNumber,
      isLateFeeIncluded,
      isPartialPayment,
      selectedPayment?.id
    );
    onOpenChange(false);
  };

  const handleLateFeeChange = (checked: boolean) => {
    setIsLateFeeIncluded(checked);
  };

  const handlePartialPaymentChange = (checked: boolean) => {
    setIsPartialPayment(checked);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>Enter the payment amount.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Select the date of the payment.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Payment notes"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Any additional notes for this payment.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={() => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={setPaymentMethod}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Select the method of payment.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceNumber"
              render={() => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Reference Number"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>Enter the reference number for the payment.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {lateFeeDetails && (
              <FormField
                control={form.control}
                name="includeLatePaymentFee"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Include Late Fee</FormLabel>
                      <FormDescription>
                        Include a late fee of QAR {lateFeeDetails.amount} for {lateFeeDetails.days} days overdue.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={isLateFeeIncluded}
                        onCheckedChange={(checked) => handleLateFeeChange(checked)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="isPartialPayment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Partial Payment</FormLabel>
                    <FormDescription>
                      Mark this payment as a partial payment.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={isPartialPayment}
                      onCheckedChange={(checked) => handlePartialPaymentChange(checked)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
