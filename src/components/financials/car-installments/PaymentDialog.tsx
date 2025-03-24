
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { CarInstallmentPayment } from '@/types/car-installment';

// Schema for adding a new payment
const newPaymentSchema = z.object({
  cheque_number: z.string().min(1, 'Cheque number is required'),
  drawee_bank: z.string().min(1, 'Bank name is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_notes: z.string().optional(),
});

// Schema for recording a payment
const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
});

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  payment?: CarInstallmentPayment | null;
  recordMode?: boolean;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  payment,
  recordMode = false
}) => {
  const schema = recordMode ? recordPaymentSchema : newPaymentSchema;
  
  const form = useForm<z.infer<typeof schema>>({
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
        form.reset({ 
          amount: payment.remaining_amount || 0
        });
      } else {
        form.reset({
          cheque_number: '',
          drawee_bank: '',
          amount: 0,
          payment_date: new Date().toISOString().split('T')[0],
          payment_notes: '',
        });
      }
    }
  }, [open, recordMode, payment, form]);

  const handleSubmit = (data: z.infer<typeof schema>) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {recordMode ? 'Record Payment' : 'Add New Payment'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {recordMode && payment ? (
              <>
                <div className="bg-muted p-4 rounded-md mb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cheque Number</p>
                      <p className="font-medium">{payment.cheque_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bank</p>
                      <p className="font-medium">{payment.drawee_bank}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-medium">{formatCurrency(payment.remaining_amount || 0)}</p>
                    </div>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={0}
                          max={payment.remaining_amount || undefined}
                          step={0.01}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            step={0.01} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </div>
                <FormField
                  control={form.control}
                  name="payment_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
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
