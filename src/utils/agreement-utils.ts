
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '@/lib/date-utils';
import { castDbId } from '@/utils/supabase-type-helpers';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';

/**
 * Updates an agreement with proper validation and status transitions
 */
export const updateAgreementWithCheck = async (
  { id, data }: { id: string; data: Partial<Agreement> },
  userId?: string | null,
  onSuccess?: () => void,
  onError?: (error: any) => void,
  onStatusUpdate?: (status: string) => void
) => {
  // Track if there's a status change that needs special handling
  const isChangingToActive = data.status === 'active';
  const isChangingToClosed = data.status === 'closed';
  
  try {
    if (onStatusUpdate) onStatusUpdate("Updating agreement details...");
    console.log(`Updating agreement ${id} with data:`, data);

    // First, perform the basic agreement update
    const { error: updateError } = await supabase
      .from('leases')
      .update(data)
      .eq('id', castDbId(id));

    if (updateError) {
      console.error("Error updating agreement:", updateError);
      toast.error(`Failed to update agreement: ${updateError.message}`);
      if (onError) onError(updateError);
      return;
    }

    // Handle status-specific operations asynchronously
    if (isChangingToActive) {
      if (onStatusUpdate) onStatusUpdate("Agreement updated. Processing payment schedule...");
      
      // Run payment schedule generation in the background
      processingPaymentSchedule(id, onStatusUpdate).then(result => {
        if (result.success) {
          if (onStatusUpdate) onStatusUpdate("Payment schedule generated successfully");
          toast.success("Payment schedule generated successfully");
        } else {
          toast.error(`Payment schedule issue: ${result.message}`);
          // This doesn't block the main flow, just informs the user
        }
      }).catch(error => {
        console.error("Background payment schedule error:", error);
        toast.error("There was an issue with the payment schedule");
      });
    } 
    else if (isChangingToClosed) {
      // Handle agreement closing operations
      if (onStatusUpdate) onStatusUpdate("Finalizing agreement closure...");
      
      // Add specific closing operations here if needed
      setTimeout(() => {
        if (onStatusUpdate) onStatusUpdate("Agreement closed successfully");
      }, 1000);
    }

    // Allow the main flow to complete regardless of background tasks
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error("Error in updateAgreementWithCheck:", error);
    toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
    if (onError) onError(error);
  }
};

/**
 * Handles the payment schedule processing with proper status updates and error handling
 */
const processingPaymentSchedule = async (
  agreementId: string, 
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message?: string }> => {
  try {
    if (onStatusUpdate) onStatusUpdate("Checking agreement details...");
    
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

    if (onStatusUpdate) onStatusUpdate("Generating payment schedule...");
    
    // Set a timeout to prevent infinite processing
    const timeoutPromise = new Promise<{ success: false; message: string }>((_, reject) => {
      setTimeout(() => reject({ success: false, message: "Payment schedule generation timed out" }), 10000);
    });
    
    try {
      // Race between the generation and timeout
      const result = await Promise.race([
        generatePaymentSchedule(agreement, onStatusUpdate),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      console.error("Error in payment schedule generation:", error);
      return { 
        success: false, 
        message: `Failed to generate payment schedule: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  } catch (error) {
    console.error("Error in processingPaymentSchedule:", error);
    return { 
      success: false, 
      message: `Failed to process payment schedule: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Asynchronously generates a payment schedule for an agreement
 */
const generatePaymentScheduleAsync = async (agreementId: string): Promise<{ success: boolean; message?: string }> => {
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
const generatePaymentSchedule = async (
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

// Helper function to check and create payment schedules for active agreements
export const checkAndCreateMissingPaymentSchedules = async (): Promise<{ 
  success: boolean; 
  generatedCount: number;
  message?: string;
  error?: any 
}> => {
  try {
    console.log('Checking for missing payment schedules');
    
    // Find active agreements without payment records
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from('leases')
      .select('id, rent_amount, start_date, rent_due_day')
      .eq('status', 'active')
      .is('payment_status', null);
    
    if (agreementsError) {
      console.error('Error fetching active agreements:', agreementsError);
      return { 
        success: false, 
        generatedCount: 0,
        message: 'Error fetching agreements', 
        error: agreementsError 
      };
    }
    
    if (!activeAgreements || activeAgreements.length === 0) {
      console.log('No agreements require payment schedule generation');
      return { success: true, generatedCount: 0, message: 'No payments needed to be generated' };
    }
    
    console.log(`Found ${activeAgreements.length} agreements that might need payment schedules`);
    
    let generatedCount = 0;
    let failedCount = 0;
    
    // Process each agreement with a small delay between them to avoid overwhelming the database
    for (const agreement of activeAgreements) {
      try {
        // Generate payment schedule
        const result = await generatePaymentSchedule(agreement);
        if (result.success) {
          generatedCount++;
        } else {
          failedCount++;
          console.error(`Failed to generate payment schedule for agreement ${agreement.id}: ${result.message}`);
        }
        
        // Add a small delay between operations
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        failedCount++;
        console.error(`Error processing agreement ${agreement.id}:`, err);
      }
    }
    
    return { 
      success: true, 
      generatedCount,
      message: `Generated ${generatedCount} payment schedules${failedCount > 0 ? `, ${failedCount} failed` : ''}` 
    };
  } catch (err) {
    console.error('Unexpected error in checkAndCreateMissingPaymentSchedules:', err);
    return { 
      success: false, 
      generatedCount: 0,
      message: `Failed to generate payments: ${err instanceof Error ? err.message : String(err)}`,
      error: err 
    };
  }
};

// Helper to convert from simple to full agreement
export function adaptSimpleToFullAgreement(simpleAgreement: any): Agreement {
  return {
    ...simpleAgreement,
    additional_drivers: simpleAgreement.additional_drivers || [],
    terms_accepted: !!simpleAgreement.terms_accepted,
  };
}
