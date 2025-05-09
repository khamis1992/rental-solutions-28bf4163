import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";

// Define the pending payment interface to match our state structure
interface PendingPayment {
  id: string;
  date: string;
  amount: number;
}

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0" }),
  paymentMethod: z.string().min(1, { message: "Please select a payment method" }),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.date(),
  includeLatePaymentFee: z.boolean().default(false),
  pendingPaymentId: z.string().optional(),
  isPartialPayment: z.boolean().default(false),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentEntryFormProps {
  agreementId: string;
  onPaymentComplete: () => void;
  defaultAmount?: number; // Add defaultAmount as an optional prop
}

export function PaymentEntryForm({ agreementId, onPaymentComplete, defaultAmount }: PaymentEntryFormProps) {
  const [lateFeeDetails, setLateFeeDetails] = useState<{
    amount: number;
    daysLate: number;
  } | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [selectedPendingPayment, setSelectedPendingPayment] = useState<string | null>(null);
  const [originalAmount, setOriginalAmount] = useState<number>(0);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: defaultAmount, // Use defaultAmount if provided
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
      paymentDate: new Date(),
      includeLatePaymentFee: false,
      pendingPaymentId: undefined,
      isPartialPayment: false,
    },
  });

  // Update form value if defaultAmount changes
  useEffect(() => {
    if (defaultAmount && !selectedPendingPayment) {
      form.setValue("amount", defaultAmount);
      setOriginalAmount(defaultAmount);
    }
  }, [defaultAmount, form, selectedPendingPayment]);

  const paymentDate = form.watch("paymentDate");
  const includeLatePaymentFee = form.watch("includeLatePaymentFee");
  const isPartialPayment = form.watch("isPartialPayment");
  const amount = form.watch("amount");

  // Fetch pending payments when component mounts
  useEffect(() => {
    fetchPendingPayments();
  }, [agreementId]);

  // Fetch any pending payments for this agreement
  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("unified_payments")
        .select("id, payment_date, amount")
        .eq("lease_id", agreementId)
        .eq("status", "pending")
        .order("payment_date", { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Transform the data to match our state structure
        const transformedData: PendingPayment[] = data.map(item => ({
          id: item.id,
          date: item.payment_date,
          amount: item.amount
        }));
        
        setPendingPayments(transformedData);
        
        // Auto-select the first pending payment
        const firstPending = transformedData[0];
        setSelectedPendingPayment(firstPending.id);
        form.setValue("pendingPaymentId", firstPending.id);
        form.setValue("amount", firstPending.amount);
        setOriginalAmount(firstPending.amount);
        
        // Calculate late fee based on the pending payment date
        const pendingDate = new Date(firstPending.date);
        calculateLateFee(pendingDate);
      }
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    }
  };

  // Calculate late fee when payment date changes
  useEffect(() => {
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

  const handlePendingPaymentSelect = (paymentId: string) => {
    setSelectedPendingPayment(paymentId);
    form.setValue("pendingPaymentId", paymentId);
    
    // Find the corresponding payment and set its amount
    const payment = pendingPayments.find(p => p.id === paymentId);
    if (payment) {
      form.setValue("amount", payment.amount);
      setOriginalAmount(payment.amount);
      
      // Recalculate late fee based on the pending payment date
      const pendingDate = new Date(payment.date);
      calculateLateFee(pendingDate);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const isFullPayment = !data.isPartialPayment || data.amount >= originalAmount;
      const paymentStatus = isFullPayment ? "completed" : "partially_paid";
      const remainingBalance = isFullPayment ? 0 : originalAmount - data.amount;

      if (data.pendingPaymentId) {
        // Update the pending payment to paid status
        const { error: updateError } = await supabase
          .from("unified_payments")
          .update({
            status: paymentStatus,
            payment_method: data.paymentMethod,
            reference_number: data.referenceNumber || null,
            notes: data.notes || null,
            payment_date: data.paymentDate.toISOString(), // Use the actual payment date
            days_overdue: lateFeeDetails?.daysLate || 0,
            amount_paid: data.amount,
            balance: remainingBalance
          })
          .eq("id", data.pendingPaymentId);

        if (updateError) throw updateError;
      } else {
        // Record a new payment if not updating a pending one
        const { data: paymentData, error: paymentError } = await supabase.from("unified_payments").insert({
          lease_id: agreementId,
          amount: originalAmount,
          amount_paid: data.amount,
          balance: remainingBalance,
          payment_date: data.paymentDate.toISOString(),
          payment_method: data.paymentMethod,
          status: paymentStatus,
          type: "Income",
          reference_number: data.referenceNumber || null,
          notes: data.notes || null,
          days_overdue: lateFeeDetails?.daysLate || 0,
          original_due_date: new Date(data.paymentDate.getFullYear(), data.paymentDate.getMonth(), 1).toISOString(),
          late_fine_amount: lateFeeDetails?.amount || 0,
        });

        if (paymentError) {
          throw paymentError;
        }
      }

      // If late fee is applicable and user opted to include it
      if (lateFeeDetails && data.includeLatePaymentFee) {
        // Record late fee payment - IMPORTANT: Using late_fine_amount instead of daily_late_fee
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

      toast.success(isFullPayment ? "Payment recorded successfully" : "Partial payment recorded successfully");
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
            {pendingPayments.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 my-2">
                <p className="text-blue-800 font-medium">Pending Payments Available</p>
                <p className="text-sm text-blue-700 mb-2">
                  There are pending payments that need to be cleared.
                </p>
                
                <div className="grid gap-2">
                  {pendingPayments.map(payment => (
                    <div 
                      key={payment.id}
                      className={`p-2 border rounded-md cursor-pointer ${
                        selectedPendingPayment === payment.id 
                          ? "border-blue-500 bg-blue-100" 
                          : "border-gray-200"
                      }`}
                      onClick={() => handlePendingPaymentSelect(payment.id)}
                    >
                      <div className="flex justify-between">
                        <span>{format(new Date(payment.date), "MMMM d, yyyy")}</span>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
                  {isPartialPayment && originalAmount > 0 && (
                    <FormDescription className="flex justify-between">
                      <span>Enter the payment amount in QAR</span>
                      <span className={amount > originalAmount ? "text-red-500" : ""}>
                        {amount > originalAmount ? "Amount exceeds original amount" : `Remaining: ${formatCurrency(originalAmount - amount)}`}
                      </span>
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
