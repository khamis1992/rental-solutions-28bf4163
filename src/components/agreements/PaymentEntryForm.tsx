
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0" }),
  paymentMethod: z.string().min(1, { message: "Please select a payment method" }),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.date(),
  includeLatePaymentFee: z.boolean().default(false),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentEntryFormProps {
  agreementId: string;
  onPaymentComplete: () => void;
}

export function PaymentEntryForm({ agreementId, onPaymentComplete }: PaymentEntryFormProps) {
  const [lateFeeDetails, setLateFeeDetails] = useState<{
    amount: number;
    daysLate: number;
  } | null>(null);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: undefined,
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
      paymentDate: new Date(),
      includeLatePaymentFee: false,
    },
  });

  const paymentDate = form.watch("paymentDate");
  const includeLatePaymentFee = form.watch("includeLatePaymentFee");

  React.useEffect(() => {
    // Calculate late fee when payment date changes
    if (paymentDate) {
      calculateLateFee(paymentDate);
    }
  }, [paymentDate]);

  const calculateLateFee = async (date: Date) => {
    // Get the current month's first day
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    
    // If payment date is after the 1st, calculate late fee
    if (date.getDate() > 1) {
      // Calculate days late (payment date - 1st of month)
      const daysLate = date.getDate() - 1;
      
      // Calculate late fee amount (120 QAR per day, max 3000 QAR)
      const calculatedFee = Math.min(daysLate * 120, 3000);
      
      setLateFeeDetails({
        amount: calculatedFee,
        daysLate: daysLate
      });
    } else {
      setLateFeeDetails(null);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      // Record the main payment
      const { data: paymentData, error: paymentError } = await supabase.from("unified_payments").insert({
        lease_id: agreementId,
        amount: data.amount,
        amount_paid: data.amount,
        balance: 0, // Fully paid
        payment_date: data.paymentDate.toISOString(),
        payment_method: data.paymentMethod,
        status: "completed",
        type: "Income",
        reference_number: data.referenceNumber || null,
        notes: data.notes || null,
        days_overdue: lateFeeDetails?.daysLate || 0,
        original_due_date: new Date(data.paymentDate.getFullYear(), data.paymentDate.getMonth(), 1).toISOString(),
      });

      if (paymentError) {
        throw paymentError;
      }

      // If late fee is applicable and user opted to include it
      if (lateFeeDetails && data.includeLatePaymentFee) {
        // Record late fee payment
        const { error: lateFeeError } = await supabase.from("unified_payments").insert({
          lease_id: agreementId,
          amount: lateFeeDetails.amount,
          amount_paid: lateFeeDetails.amount,
          balance: 0, // Fully paid
          payment_date: data.paymentDate.toISOString(),
          payment_method: data.paymentMethod,
          status: "completed",
          type: "LATE_PAYMENT_FEE",
          description: `Late payment fee for ${format(data.paymentDate, "MMMM yyyy")} (${lateFeeDetails.daysLate} days late)`,
          reference_number: data.referenceNumber || null,
          notes: data.notes || null,
          late_fine_amount: lateFeeDetails.amount,
          days_overdue: lateFeeDetails.daysLate,
          original_due_date: new Date(data.paymentDate.getFullYear(), data.paymentDate.getMonth(), 1).toISOString(),
        });

        if (lateFeeError) {
          toast.error("Payment recorded but failed to record late fee");
          console.error("Error recording late fee:", lateFeeError);
        }
      }

      toast.success("Payment recorded successfully");
      form.reset();
      onPaymentComplete();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
        <CardDescription>Enter payment details below</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the payment amount in QAR
                  </FormDescription>
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When the payment was made
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {lateFeeDetails && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2">
                <p className="text-amber-800 font-medium">Late Payment Fee Applicable</p>
                <p className="text-sm text-amber-700">
                  Payment is {lateFeeDetails.daysLate} days late from the 1st of the month. 
                  A late fee of {formatCurrency(lateFeeDetails.amount)} applies ({lateFeeDetails.daysLate} days × 120 QAR/day, max 3000 QAR).
                </p>
                
                <FormField
                  control={form.control}
                  name="includeLatePaymentFee"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Include late payment fee</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
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
                    <Input placeholder="Enter reference number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Transaction ID, cheque number, etc.
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Record Payment</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
