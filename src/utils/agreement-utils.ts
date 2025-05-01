import { supabase } from "@/lib/supabase";
import { castDbId } from "@/utils/supabase-type-helpers";
import { withTimeout, executeWithRetry } from "@/types/api-response";
import { formatDate } from "@/lib/date-utils";
import { PaymentHistoryItem } from '@/types/payment-history.types';
import { Agreement } from '@/types/api-response';
import { logOperation } from "@/utils/monitoring-utils";

const agreementCache = new Map();

async function getCachedAgreement(id) {
  if (agreementCache.has(id)) {
    return agreementCache.get(id)!;
  }
  
  const { data } = await supabase
    .from('leases')
    .select('*')
    .eq('id', id)
    .single();
    
  if (data) agreementCache.set(id, data);
  return data;
}

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
  try {
    if (onStatusUpdate) onStatusUpdate("Validating agreement update...");
    
    // Get current agreement state
    const { data: currentAgreement, error: fetchError } = await supabase
      .from('leases')
      .select('*')
      .eq('id', castDbId(id))
      .single();
      
    if (fetchError || !currentAgreement) {
      throw fetchError || new Error('Agreement not found');
    }
    
    // Validate update
    const { isValid, errors } = validateAgreementUpdate(currentAgreement, data);
    if (!isValid) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    // Proceed with update
    if (onStatusUpdate) onStatusUpdate("Updating agreement details...");
    
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
      updated_by: userId
    };
    
    const { error: updateError } = await supabase
      .from('leases')
      .update(updateData)
      .eq('id', castDbId(id));
      
    if (updateError) throw updateError;
    
    if (onSuccess) onSuccess();
    return { success: true };
  } catch (error) {
    logOperation('agreement.update', 'error', 
      { id, error: error instanceof Error ? error.message : String(error) },
      'Error updating agreement');
    if (onError) onError(error);
    return { success: false, error };
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
    const agreement = await getCachedAgreement(agreementId);

    if (!agreement) {
      logOperation('agreement.paymentSchedule', 'error', 
        { agreementId }, 'Error fetching agreement for payment schedule');
      return { success: false, message: "Agreement not found" };
    }

    if (onStatusUpdate) onStatusUpdate("Generating payment schedule...");
    
    // Set a timeout to prevent infinite processing
    const timeoutPromise = new Promise<{ success: false; message: string }>((_, reject) => {
      setTimeout(() => reject({ success: false, message: "Payment schedule generation timed out" }), 10000);
    });
    
    try {
      // Race between the generation and timeout
      const result = await Promise.race([
        generatePaymentScheduleAsync(agreementId, onStatusUpdate),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      logOperation('agreement.paymentSchedule', 'error', 
        { agreementId, error: error instanceof Error ? error.message : String(error) },
        'Error in payment schedule generation');
      return { 
        success: false, 
        message: `Failed to generate payment schedule: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  } catch (error) {
    logOperation('agreement.paymentSchedule', 'error', 
      { agreementId, error: error instanceof Error ? error.message : String(error) },
      'Error in processingPaymentSchedule');
    return { 
      success: false, 
      message: `Failed to process payment schedule: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Asynchronously generates a payment schedule for an agreement
 */
const generatePaymentScheduleAsync = async (agreementId: string, onStatusUpdate?: (status: string) => void): Promise<{ success: boolean; message?: string }> => {
  try {
    // First, get the agreement details
    const agreement = await getCachedAgreement(agreementId);

    if (!agreement) {
      logOperation('agreement.paymentSchedule', 'error', 
        { agreementId }, 'Error fetching agreement for payment schedule');
      return { success: false, message: "Agreement not found" };
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
export async function forceGeneratePaymentForAgreement(
  agreement: Agreement & { payments?: Payment[] }
) {
  // Check if payments already exist
  if (agreement.payments?.length) {
    return createSuccessResponse(
      agreement.payments,
      'Payments already exist for this agreement'
    );
  }

  // Generate payments with timeout and retry
  return withTimeout(
    executeWithRetry(() => generatePaymentSchedule(agreement)),
    8000
  );
}

/**
 * Core payment schedule generation logic with improved performance and error handling
 */
async function generatePaymentSchedule(
  agreement: Agreement,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message?: string }> {
  try {
    if (onStatusUpdate) onStatusUpdate("Validating agreement...");
    
    // Validate agreement
    if (!agreement?.id) throw new Error("Invalid agreement data");
    if (!agreement.rent_amount || agreement.rent_amount <= 0) {
      throw new Error("Cannot generate payment schedule: no rent amount specified");
    }
    
    // Calculate payment dates
    const { firstDueDate } = calculatePaymentDates(agreement);
    
    // Check for existing payments
    if (onStatusUpdate) onStatusUpdate("Checking existing payments...");
    const hasExistingPayments = await checkExistingPayments(agreement.id, firstDueDate);
    if (hasExistingPayments) {
      return { success: true, message: "Payments already exist" };
    }
    
    // Create and insert payment
    if (onStatusUpdate) onStatusUpdate("Creating payment record...");
    const payment = createPaymentRecord(agreement, firstDueDate);
    await insertPayment(payment);
    
    if (onStatusUpdate) onStatusUpdate("Payment schedule created");
    return { success: true, message: "Payment schedule generated" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment generation failed";
    return { success: false, message };
  }
}

/**
 * Activates an agreement and generates the initial payment schedule
 */
export const activateAgreement = async (
  agreementId: string, 
  vehicleId?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log(`Activating agreement ${agreementId}${vehicleId ? ` with vehicle ${vehicleId}` : ''}`);
    
    // First check if the agreement exists and is not already active
    const agreement = await getCachedAgreement(agreementId);

    if (!agreement) {
      console.error("Error getting agreement for activation:");
      return { 
        success: false, 
        message: "Agreement not found" 
      };
    }
    
    if (agreement.status === 'active') {
      console.log("Agreement is already active");
      return { success: true, message: "Agreement is already active" };
    }

    // If a vehicle ID is provided and the vehicle is not already assigned
    if (vehicleId) {
      // Check if vehicle is available
      const { isAvailable, existingAgreement, error } = await checkVehicleAvailability(vehicleId);
      
      if (error) {
        console.error("Error checking vehicle availability:", error);
        return { 
          success: false, 
          message: `Could not check vehicle availability: ${error}` 
        };
      }
      
      if (!isAvailable && existingAgreement) {
        console.log("Vehicle is already assigned, will close existing agreement first");
        
        // Close the existing agreement
        const { error: closeError } = await supabase
          .from('leases')
          .update({ 
            status: 'closed',
            updated_at: new Date().toISOString(),
            notes: `Closed automatically when vehicle was reassigned to agreement ${agreementId}`
          })
          .eq('id', existingAgreement.id);
        
        if (closeError) {
          console.error("Failed to close existing agreement:", closeError);
          return { 
            success: false, 
            message: `Failed to close existing vehicle assignment: ${closeError.message}` 
          };
        }
      }
    }
    
    // Update the agreement status to active
    const { error: updateError } = await supabase
      .from('leases')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', castDbId(agreementId));
    
    if (updateError) {
      logOperation('agreement.activate', 'error', 
        { agreementId, error: updateError.message },
        'Error activating agreement');
      return { 
        success: false, 
        message: `Failed to activate agreement: ${updateError.message}` 
      };
    }
    
    // Generate the payment schedule
    const scheduleResult = await forceGeneratePaymentForAgreement({ id: agreementId });
    
    if (!scheduleResult.success) {
      logOperation('agreement.activate', 'warning', 
        { agreementId, message: scheduleResult.message },
        'Agreement activated but payment schedule generation failed');
      return {
        success: true, // Still return true as the activation itself succeeded
        message: `Agreement activated but payment schedule generation had issues: ${scheduleResult.message}`
      };
    }
    
    return {
      success: true,
      message: "Agreement activated successfully with payment schedule"
    };
  } catch (error) {
    logOperation('agreement.activate', 'error', 
      { agreementId, error: error instanceof Error ? error.message : String(error) },
      'Error in activateAgreement');
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Checks if a vehicle is available or already assigned to an active agreement
 */
export const checkVehicleAvailability = async (vehicleId: string) => {
  try {
    logOperation('vehicle.checkAvailability', 'success', 
      { vehicleId },
      'Checking availability for vehicle');
    
    // Check if the vehicle is already assigned to an active agreement
    const { data: activeAgreements, error } = await supabase
      .from('leases')
      .select('id, agreement_number, customer_id, status')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .limit(1);
      
    if (error) {
      logOperation('vehicle.checkAvailability', 'error', 
        { vehicleId, error: error.message },
        'Error checking vehicle availability');
      return { 
        isAvailable: false, 
        error: error.message,
        existingAgreement: null 
      };
    }
    
    const isAvailable = !activeAgreements || activeAgreements.length === 0;
    let existingAgreement = null;
    
    if (!isAvailable && activeAgreements && activeAgreements.length > 0) {
      existingAgreement = activeAgreements[0];
      logOperation('vehicle.checkAvailability', 'warning', 
        { vehicleId, agreementNumber: existingAgreement.agreement_number },
        'Vehicle is already assigned to agreement');
    }
    
    return {
      isAvailable,
      existingAgreement,
      vehicleId
    };
  } catch (error) {
    logOperation('vehicle.checkAvailability', 'error', 
      { vehicleId, error: error instanceof Error ? error.message : String(error) },
      'Error in checkVehicleAvailability');
    return { 
      isAvailable: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred",
      existingAgreement: null 
    };
  }
};

/**
 * Helper function to check and create payment schedules for active agreements
 */
export const checkAndCreateMissingPaymentSchedules = async (): Promise<{ 
  success: boolean; 
  generatedCount: number;
  message?: string;
  error?: any 
}> => {
  try {
    logOperation('agreement.paymentSchedule', 'success', 
      {}, 'Checking for missing payment schedules');
    
    // Find active agreements without payment records
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from('leases')
      .select('id, rent_amount, start_date, rent_due_day')
      .eq('status', 'active')
      .is('payment_status', null);
    
    if (agreementsError) {
      logOperation('agreement.paymentSchedule', 'error', 
        { error: agreementsError.message },
        'Error fetching active agreements');
      return { 
        success: false, 
        generatedCount: 0,
        message: 'Error fetching agreements', 
        error: agreementsError 
      };
    }
    
    if (!activeAgreements || activeAgreements.length === 0) {
      logOperation('agreement.paymentSchedule', 'success', 
        {}, 'No agreements require payment schedule generation');
      return { success: true, generatedCount: 0, message: 'No payments needed to be generated' };
    }
    
    logOperation('agreement.paymentSchedule', 'success', 
      { count: activeAgreements.length },
      `Found agreements that might need payment schedules`);
    
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
          logOperation('agreement.paymentSchedule', 'error', 
            { agreementId: agreement.id, message: result.message },
            'Failed to generate payment schedule for agreement');
        }
        
        // Small delay between agreements
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        failedCount++;
        logOperation('agreement.paymentSchedule', 'error', 
          { agreementId: agreement.id, error: err instanceof Error ? err.message : String(err) },
          'Error processing agreement');
      }
    }
    
    return { 
      success: true, 
      generatedCount,
      message: `Generated ${generatedCount} payment schedules${failedCount > 0 ? `, ${failedCount} failed` : ''}` 
    };
  } catch (err) {
    logOperation('agreement.paymentSchedule', 'error', 
      { error: err instanceof Error ? err.message : String(err) },
      'Unexpected error in checkAndCreateMissingPaymentSchedules');
    return { 
      success: false, 
      generatedCount: 0,
      message: `Failed to generate payments: ${err instanceof Error ? err.message : String(err)}`,
      error: err 
    };
  }
};

/**
 * Helper to convert from simple to full agreement
 */
export function adaptSimpleToFullAgreement(simpleAgreement: any): Agreement {
  return {
    ...simpleAgreement,
    additional_drivers: simpleAgreement.additional_drivers || [],
    terms_accepted: !!simpleAgreement.terms_accepted,
  };
}

/**
 * Generates payments for an agreement
 */
export async function generatePaymentsForAgreement(agreementId: string) {
  // Single query to get agreement and related data
  const { data, error } = await supabase
    .from('leases')
    .select(`*, payments(*)`)
    .eq('id', castDbId(agreementId))
    .single();

  if (error || !data) {
    return createErrorResponse(error, 'Failed to fetch agreement');
  }

  return await forceGeneratePaymentForAgreement(data);
}

function createErrorResponse(error: any, message: string) {
  return { success: false, message, error };
}

/**
 * Acquires an advisory lock
 */
export async function acquireLock(lockId: number): Promise<boolean> {
  const { data, error } = await supabase.rpc('pg_try_advisory_xact_lock', {
    lock_id: lockId
  }) as { data: boolean, error: any };
  
  if (error) {
    logOperation('agreement.lock', 'error', 
      { lockId, error: error.message },
      'Error acquiring lock');
    return false;
  }
  
  return data;
}

/**
 * Releases an advisory lock
 */
export async function releaseLock(lockId: number): Promise<void> {
  // Advisory locks are automatically released at transaction end
}

/**
 * Batch processes agreements with locking
 */
export async function processAgreements(agreements: Agreement[]) {
  const BATCH_SIZE = 5;
  const results = [];
  
  for (let i = 0; i < agreements.length; i += BATCH_SIZE) {
    const batch = agreements.slice(i, i + BATCH_SIZE);
    
    // Process batch sequentially to prevent lock contention
    for (const agreement of batch) {
      try {
        const result = await generatePaymentSchedule(agreement);
        results.push(result);
        
        // Small delay between agreements
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        results.push({
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    // Slightly longer delay between batches
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

export async function processAgreementPayments(agreement: Agreement): Promise<void> {
  const paymentDates = calculatePaymentDates(agreement);
  for (const date of paymentDates) {
    const payment = createPaymentRecord(agreement, date);
    await insertPayment(payment);
  }
}

export function validateAgreementDates(agreement: Agreement): boolean {
  return new Date(agreement.start_date) < new Date(agreement.end_date);
}

async function checkDuplicateAgreement(agreement: Agreement): Promise<boolean> {
  const { count } = await supabase
    .from('leases')
    .select('*', { count: 'exact', head: true })
    .eq('vehicle_id', agreement.vehicle_id)
    .eq('status', 'active');
  return (count || 0) > 0;
}

function generateAgreementNumber(agreement: Agreement): string {
  return `AG-${agreement.vehicle_id.slice(0, 4)}-${new Date(agreement.start_date).getFullYear()}`;
}

async function notifyParties(agreement: Agreement): Promise<void> {
  // Implementation would go here
}

function validateAgreementUpdate(current: Agreement, update: Partial<Agreement>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Status transition validation
  if (update.status) {
    const validTransitions: Record<AgreementStatus, AgreementStatus[]> = {
      draft: ['pending', 'active'],
      pending: ['active', 'cancelled'],
      active: ['closed', 'cancelled'],
      closed: [],
      cancelled: []
    };
    
    if (!validTransitions[current.status].includes(update.status)) {
      errors.push(`Invalid status transition from ${current.status} to ${update.status}`);
    }
  }
  
  // Required fields for active status
  if (update.status === 'active') {
    if (!current.start_date) errors.push('Missing start_date for active agreement');
    if (!current.end_date) errors.push('Missing end_date for active agreement');
    if (!current.rent_amount) errors.push('Missing rent_amount for active agreement');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function createPaymentRecord(agreement: Agreement, paymentDate: Date): Promise<Payment> {
  return {
    agreement_id: agreement.id,
    amount: agreement.rent_amount,
    description: `Rent Payment - ${formatDate(paymentDate, "MMMM yyyy")}`,
    type: "Income",
    status: "pending",
    due_date: formatDate(paymentDate),
    is_recurring: false
  };
}

function calculatePaymentDates(agreement: Agreement): Date[] {
  // Determine rent due day (default to 1 if not specified)
  const rentDueDay = agreement.rent_due_day || 1;
  
  // Get agreement start date with validation
  const startDate = new Date(agreement.start_date);
  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid start date");
  }
  
  // Create first payment due date
  let firstDueDate = new Date(startDate);
  firstDueDate.setDate(rentDueDay);
  
  // If start date is after the rent due day, move to next month
  if (startDate.getDate() > rentDueDay) {
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);
  }
  
  return [firstDueDate];
}

async function checkExistingPayments(agreementId, firstDueDate) {
  const { data, error } = await supabase
    .from("payments")
    .select("id")
    .eq("agreement_id", agreementId)
    .gte("due_date", formatDate(firstDueDate))
    .limit(1);
    
  if (error) {
    logOperation('agreement.payments', 'error', 
      { agreementId, error: error.message },
      'Error checking existing payments');
    return false;
  }
  
  return data && data.length > 0;
}

async function insertPayment(payment) {
  const { error } = await supabase
    .from("payments")
    .insert([payment]);
    
  if (error) {
    logOperation('agreement.payments', 'error', 
      { payment, error: error.message },
      'Error inserting payment');
    throw error;
  }
}
