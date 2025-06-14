
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CarInstallmentPayment } from '@/types/car-installment';

// Define schemas based on mode
const recordPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

const addPaymentSchema = z.object({
  cheque_number: z.string().min(1, 'Cheque number is required'),
  drawee_bank: z.string().min(1, 'Bank name is required'),
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_notes: z.string().optional(),
});

type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>;
type AddPaymentFormData = z.infer<typeof addPaymentSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RecordPaymentFormData | AddPaymentFormData) => void;
  payment: CarInstallmentPayment | null;
  recordMode: boolean;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  payment,
  recordMode,
}) => {
  const schema = recordMode ? recordPaymentSchema : addPaymentSchema;
  
  // UseForm with appropriate type based on mode
  const form = useForm<RecordPaymentFormData | AddPaymentFormData>({
    resolver: zodResolver(schema),
    defaultValues: recordMode 
      ? { amount: 0 } 
      : {
          cheque_number: '',
          drawee_bank: '',
          amount: 0,
          payment_date: new Date().toISOString().split('T')[0],
          payment_notes: '',
        },
  });

  // Reset form when dialog opens/closes or mode changes
  React.useEffect(() => {
    if (open) {
      if (recordMode && payment) {
        // Set the default amount to the remaining amount in record mode
        form.reset({ amount: payment.remaining_amount });
      } else {
        // Reset to default values for add mode
        form.reset(
          recordMode
            ? { amount: 0 }
            : {
                cheque_number: '',
                drawee_bank: '',
                amount: 0,
                payment_date: new Date().toISOString().split('T')[0],
                payment_notes: '',
              }
        );
      }
    }
  }, [open, recordMode, payment, form]);

  const handleSubmit = (data: RecordPaymentFormData | AddPaymentFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {recordMode ? 'Record Payment' : 'Add Payment Schedule'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {!recordMode ? (
              // Add mode fields
              <>
                <FormField
                  control={form.control}
                  name="cheque_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cheque Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="drawee_bank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drawee Bank</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!recordMode ? (
              <>
                <FormField
                  control={form.control}
                  name="payment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            <DialogFooter>
              <Button type="submit">
                {recordMode ? 'Record Payment' : 'Add Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
