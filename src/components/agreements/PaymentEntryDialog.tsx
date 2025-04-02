
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import { Payment } from './PaymentHistory';

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number, paymentDate: Date, notes?: string, paymentMethod?: string, referenceNumber?: string, includeLatePaymentFee?: boolean, isPartialPayment?: boolean) => void;
  defaultAmount: number;
  title: string;
  description: string;
  lateFeeDetails: {
    amount: number;
    daysLate: number;
  } | null;
  selectedPayment?: Payment | null;
}

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  paymentDate: z.date({
    required_error: 'Payment date is required',
  }),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  includeLatePaymentFee: z.boolean().default(false),
  isPartialPayment: z.boolean().default(false),
});

export function PaymentEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultAmount,
  title,
  description,
  lateFeeDetails,
  selectedPayment,
}: PaymentEntryDialogProps) {
  const [originalAmount, setOriginalAmount] = useState(defaultAmount);
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: defaultAmount,
      paymentDate: new Date(),
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: '',
      includeLatePaymentFee: false,
      isPartialPayment: false,
    },
  });

  // Update form when defaultAmount changes
  useEffect(() => {
    form.setValue('amount', defaultAmount);
    setOriginalAmount(defaultAmount);
    
    // If this is an additional payment for a partially paid item, hide partial payment option
    if (selectedPayment && selectedPayment.status === 'partially_paid') {
      form.setValue('isPartialPayment', false);
    }
  }, [defaultAmount, form, selectedPayment]);
  
  const isPartialPayment = form.watch('isPartialPayment');
  const amount = form.watch('amount');

  const handleSubmit = (values: z.infer<typeof paymentSchema>) => {
    onSubmit(
      values.amount,
      values.paymentDate,
      values.notes,
      values.paymentMethod,
      values.referenceNumber,
      values.includeLatePaymentFee,
      values.isPartialPayment
    );
    form.reset({
      amount: defaultAmount,
      paymentDate: new Date(),
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: '',
      includeLatePaymentFee: false,
      isPartialPayment: false,
    });
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Only show partial payment toggle for new payments, not for additional payments on partially paid items */}
            {!selectedPayment?.status && (
              <FormField
                control={form.control}
                name="isPartialPayment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Partial Payment</FormLabel>
                      <FormDescription>
                        Enable if customer is paying only part of the amount
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (QAR)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  {isPartialPayment && originalAmount > 0 && (
                    <FormDescription className="flex justify-between">
                      <span>Payment amount</span>
                      <span className={amount > originalAmount ? "text-red-500" : ""}>
                        {amount > originalAmount ? 
                          "Amount exceeds original amount" : 
                          `Remaining: ${formatCurrency(originalAmount - amount)}`
                        }
                      </span>
                    </FormDescription>
                  )}
                  {selectedPayment?.status === 'partially_paid' && (
                    <FormDescription className="text-blue-500">
                      Remaining balance: {formatCurrency(selectedPayment.balance || 0)}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={formatDateForInput(field.value)}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : new Date();
                        field.onChange(date);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {lateFeeDetails && lateFeeDetails.amount > 0 && !selectedPayment?.status && (
              <>
                <Alert variant="warning" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Late Payment Fee Applicable</AlertTitle>
                  <AlertDescription>
                    This payment is {lateFeeDetails.daysLate} days late. A late fee of QAR {lateFeeDetails.amount.toLocaleString()} applies.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="includeLatePaymentFee"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Include Late Payment Fee (QAR {lateFeeDetails.amount.toLocaleString()})
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Add the late payment fee as a separate transaction
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Payment</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
