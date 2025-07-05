import * as z from 'zod';
import { useForm } from 'react-hook-form';
import React from 'react';
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
  amount: z.number().positive('يجب أن يكون المبلغ موجباً'),
});

const addPaymentSchema = z.object({
  cheque_number: z.string().min(1, 'رقم الشيك مطلوب'),
  drawee_bank: z.string().min(1, 'اسم البنك مطلوب'),
  amount: z.number().positive('يجب أن يكون المبلغ موجباً'),
  payment_date: z.string().min(1, 'تاريخ الدفع مطلوب'),
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
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>
            {recordMode ? 'تسجيل دفعة' : 'إضافة جدولة دفعات'}
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
                      <FormLabel className="text-right">رقم الشيك</FormLabel>
                      <FormControl>
                        <Input {...field} className="text-right" dir="rtl" />
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
                      <FormLabel className="text-right">البنك المسحوب عليه</FormLabel>
                      <FormControl>
                        <Input {...field} className="text-right" dir="rtl" />
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
                  <FormLabel className="text-right">المبلغ</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      className="text-right"
                      dir="rtl"
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
                      <FormLabel className="text-right">تاريخ الدفع</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="text-right" dir="rtl" />
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
                      <FormLabel className="text-right">ملاحظات</FormLabel>
                      <FormControl>
                        <Input {...field} className="text-right" dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            <DialogFooter>
              <Button type="submit">
                {recordMode ? 'تسجيل دفعة' : 'إضافة دفعة'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
