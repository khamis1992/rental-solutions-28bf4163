import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/utils/toast-utils";
import { supabase } from "@/integrations/supabase/client";

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId?: string;
  onPaymentAdded?: (agreementId: string) => Promise<void>;
}

const formSchema = z.object({
  amount: z.string().refine(value => !isNaN(parseFloat(value)), {
    message: "Amount must be a number.",
  }),
  payment_date: z.date().optional(),
  payment_method: z.string().min(2, {
    message: "Payment method must be at least 2 characters.",
  }),
  status: z.string().optional(),
  notes: z.string().optional(),
  receipt_number: z.string().optional(),
})

const PaymentEntryDialog: React.FC<PaymentEntryDialogProps> = ({
  open,
  onOpenChange,
  agreementId,
  onPaymentAdded
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      payment_date: new Date(),
      payment_method: '',
      status: 'paid',
      notes: '',
      receipt_number: ''
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      const paymentData = {
        lease_id: agreementId,
        amount: parseFloat(data.amount),
        payment_date: data.payment_date ? new Date(data.payment_date).toISOString() : new Date().toISOString(),
        payment_method: data.payment_method,
        status: data.status || 'paid',
        notes: data.notes || '',
        receipt_number: data.receipt_number || ''
      };

      const { data: result, error } = await supabase
        .from('unified_payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;

      showSuccessToast('Payment recorded successfully');
      
      if (onPaymentAdded) {
        await onPaymentAdded(agreementId || '');
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error recording payment:', error);
      showErrorToast(error, 'Failed to record payment');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Record Payment</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the payment details below to record a new payment for this agreement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="Payment amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_date"
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Input placeholder="Payment notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receipt_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Receipt number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit">Record Payment</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentEntryDialog;
