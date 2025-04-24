
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';

export const generatePaymentSchedule = async (
  agreement: any,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message?: string }> => {
  try {
    if (onStatusUpdate) onStatusUpdate("Analyzing agreement details...");
    console.log("Generating payment schedule for agreement:", agreement.id);

    if (!agreement || !agreement.id) {
      return { success: false, message: "Invalid agreement data" };
    }

    if (!agreement.rent_amount || agreement.rent_amount <= 0) {
      return { success: false, message: "Cannot generate payment schedule: no rent amount specified" };
    }
    
    if (onStatusUpdate) onStatusUpdate("Setting up payment due dates...");

    const rentDueDay = agreement.rent_due_day || 1;
    
    let startDate: Date;
    try {
      startDate = new Date(agreement.start_date);
      if (isNaN(startDate.getTime())) {
        return { success: false, message: "Invalid start date" };
      }
    } catch (error) {
      return { success: false, message: "Could not parse agreement start date" };
    }
    
    let firstDueDate = new Date(startDate);
    firstDueDate.setDate(rentDueDay);
    
    if (startDate.getDate() > rentDueDay) {
      firstDueDate.setMonth(firstDueDate.getMonth() + 1);
    }

    const { data: existingPayments, error } = await supabase
      .from('unified_payments')
      .select('id')
      .eq('lease_id', agreement.id)
      .gte('due_date', formatDate(startDate))
      .lt('due_date', formatDate(new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate())));

    if (error) {
      console.error("Error checking existing payments:", error);
      return { success: false, message: `Payment check failed: ${error.message}` };
    }

    if (existingPayments && existingPayments.length > 0) {
      console.log("Payments already exist for this agreement:", existingPayments.length);
      return { success: true, message: "Payments already exist for this agreement" };
    }

    const paymentData = {
      lease_id: agreement.id,
      amount: agreement.rent_amount,
      description: `Rent Payment - ${formatDate(firstDueDate, 'MMMM yyyy')}`,
      type: 'Income',
      status: 'pending',
      due_date: formatDate(firstDueDate),
      is_recurring: false
    };

    const { error: insertError } = await supabase
      .from('unified_payments')
      .insert(paymentData);

    if (insertError) {
      console.error("Error creating payment schedule:", insertError);
      return { success: false, message: `Failed to create payment: ${insertError.message}` };
    }
    
    return { success: true, message: "Payment schedule generated successfully" };
  } catch (error) {
    console.error("Unexpected error generating payment schedule:", error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

export const handleLateFees = async (
  amount: number,
  paymentDate: Date,
  dailyLateFee: number = 120
): Promise<{ lateFineAmount: number; daysLate: number }> => {
  let lateFineAmount = 0;
  let daysLate = 0;
  
  if (paymentDate.getDate() > 1) {
    daysLate = paymentDate.getDate() - 1;
    lateFineAmount = Math.min(daysLate * dailyLateFee, 3000);
  }
  
  return { lateFineAmount, daysLate };
};

export const processExistingPayment = async (
  existingPaymentId: string,
  amount: number,
  existingAmountPaid: number,
  existingPaymentAmount: number,
  paymentDate: Date,
  paymentMethod: string
) => {
  const totalPaid = existingAmountPaid + amount;
  const newBalance = existingPaymentAmount - totalPaid;
  const newStatus = newBalance <= 0 ? 'completed' : 'partially_paid';
  
  const { error: updateError } = await supabase
    .from('unified_payments')
    .update({
      amount_paid: totalPaid,
      balance: Math.max(0, newBalance),
      status: newStatus,
      payment_date: paymentDate.toISOString(),
      payment_method: paymentMethod
    })
    .eq('id', existingPaymentId);
    
  if (updateError) {
    console.error("Error updating payment:", updateError);
    return { success: false, message: "Failed to record additional payment" };
  }
  
  return { 
    success: true, 
    message: newStatus === 'completed' ? 
      "Payment completed successfully!" : 
      "Additional payment recorded successfully"
  };
};

