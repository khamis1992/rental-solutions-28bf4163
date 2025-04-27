
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PaymentSubmitParams } from './AgreementDetail.types';
import { toast } from 'sonner';

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSubmit: (params: PaymentSubmitParams) => Promise<boolean>;
  rentAmount?: number;
  showLatePaymentOption?: boolean;
}

export const PaymentEntryDialog = ({
  open,
  onOpenChange,
  onPaymentSubmit,
  rentAmount = 0,
  showLatePaymentOption = false,
}: PaymentEntryDialogProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [includeLatePaymentFee, setIncludeLatePaymentFee] = React.useState(false);

  const form = useForm({
    defaultValues: {
      amount: rentAmount,
      paymentDate: new Date(),
      notes: '',
      paymentMethod: 'cash',
      referenceNumber: '',
    },
  });

  React.useEffect(() => {
    if (open && rentAmount) {
      form.setValue('amount', rentAmount);
    }
  }, [open, rentAmount, form]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      const success = await onPaymentSubmit({
        amount: parseFloat(data.amount),
        paymentDate: data.paymentDate,
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        includeLatePaymentFee
      });

      if (success) {
        onOpenChange(false);
        form.reset();
        setIncludeLatePaymentFee(false);
        toast.success("Payment recorded successfully");
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Enter payment details below
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                    />
                  </FormControl>
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
                            "w-full pl-3 text-left font-normal",
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
                          date > new Date() || date < new Date("2010-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
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
                  <FormControl>
                    <select
                      className="w-full p-2 rounded-md border border-input bg-transparent"
                      {...field}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="check">Check</option>
                      <option value="other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Receipt or transaction number"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional reference number for this payment
                  </FormDescription>
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
                      {...field}
                      placeholder="Additional notes about the payment"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showLatePaymentOption && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={includeLatePaymentFee}
                  onCheckedChange={setIncludeLatePaymentFee}
                  id="late-payment-fee"
                />
                <Label htmlFor="late-payment-fee">
                  Include late payment fee (120)
                </Label>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
