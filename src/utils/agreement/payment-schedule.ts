
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/date-utils';
import { castDbId } from '@/utils/supabase-type-helpers';

/**
 * Asynchronously generates a payment schedule for an agreement
 */
export const generatePaymentScheduleAsync = async (agreementId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // First, get the agreement details
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select('*')
      .eq('id', castDbId(agreementId))
      .single();

    if (agreementError || !agreement) {
      console.error("Error fetching agreement for payment schedule:", agreementError);
      return { success: false, message: agreementError?.message || "Agreement not found" };
    }

    // Call the payment schedule generation with the agreement data
    const result = await forceGeneratePaymentForAgreement(agreement);
    return result;
  } catch (error) {
    console.error("Error generating payment schedule:", error);
    return { 
      success: false, 
      message: `Failed to generate payment schedule: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Generates payment schedules for an agreement with improved error handling
 */
export const forceGeneratePaymentForAgreement = async (agreement: any): Promise<{ success: boolean; message?: string }> => {
  try {
    // Set a timeout to prevent infinite processing
    const timeoutPromise = new Promise<{ success: false; message: string }>((_, reject) => {
      setTimeout(() => reject({ success: false, message: "Operation timed out" }), 8000);
    });

    // Run the payment generation with a timeout
    try {
      const result = await Promise.race([
        generatePaymentSchedule(agreement),
        timeoutPromise
      ]);
      return result;
    } catch (error) {
      console.error("Payment generation timed out or failed:", error);
      return { 
        success: false, 
        message: `Payment generation issue: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  } catch (error) {
    console.error("Error in forceGeneratePaymentForAgreement:", error);
    return { 
      success: false, 
      message: `Failed to generate payment schedule: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Core payment schedule generation logic with improved performance and error handling
 */
export const generatePaymentSchedule = async (
  agreement: any,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message?: string }> => {
  try {
    if (onStatusUpdate) onStatusUpdate("Analyzing agreement details...");
    console.log("Generating payment schedule for agreement:", agreement.id);

    // Safety checks
    if (!agreement || !agreement.id) {
      return { success: false, message: "Invalid agreement data" };
    }

    // Skip if no rent amount is defined
    if (!agreement.rent_amount || agreement.rent_amount <= 0) {
      return { success: false, message: "Cannot generate payment schedule: no rent amount specified" };
    }
    
    if (onStatusUpdate) onStatusUpdate("Setting up payment due dates...");

    // Determine rent due day (default to 1 if not specified)
    const rentDueDay = agreement.rent_due_day || 1;
    
    // Get agreement start date with validation
    let startDate: Date;
    try {
      startDate = new Date(agreement.start_date);
      if (isNaN(startDate.getTime())) {
        return { success: false, message: "Invalid start date" };
      }
    } catch (error) {
      return { success: false, message: "Could not parse agreement start date" };
    }
    
    // Create first payment due date
    let firstDueDate = new Date(startDate);
    firstDueDate.setDate(rentDueDay);
    
    // If start date is after the rent due day, move to next month
    if (startDate.getDate() > rentDueDay) {
      firstDueDate.setMonth(firstDueDate.getMonth() + 1);
    }
    
    if (onStatusUpdate) onStatusUpdate("Checking for existing payments...");

    // Check if a payment already exists for this month with better error handling
    try {
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

      // If payments already exist, don't recreate them
      if (existingPayments && existingPayments.length > 0) {
        console.log("Payments already exist for this agreement:", existingPayments.length);
        return { success: true, message: "Payments already exist for this agreement" };
      }
    } catch (error) {
      console.error("Error checking existing payments:", error);
      return { success: false, message: "Failed to check existing payments" };
    }
    
    if (onStatusUpdate) onStatusUpdate("Creating payment record...");

    // Prepare the first payment record
    const paymentData = {
      lease_id: agreement.id,
      amount: agreement.rent_amount,
      description: `Rent Payment - ${formatDate(firstDueDate, 'MMMM yyyy')}`,
      type: 'Income',
      status: 'pending',
      due_date: formatDate(firstDueDate),
      is_recurring: false
    };

    try {
      // Insert the payment record
      const { error: insertError } = await supabase
        .from('unified_payments')
        .insert(paymentData);

      if (insertError) {
        console.error("Error creating payment schedule:", insertError);
        return { success: false, message: `Failed to create payment: ${insertError.message}` };
      }
      
      if (onStatusUpdate) onStatusUpdate("Payment schedule created successfully");
      return { success: true, message: "Payment schedule generated successfully" };
    } catch (error) {
      console.error("Error inserting payment record:", error);
      return { success: false, message: "Failed to insert payment record" };
    }
  } catch (error) {
    console.error("Unexpected error generating payment schedule:", error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
