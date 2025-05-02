import { supabase } from '@/lib/supabase';
import { ServiceResponse } from '../response-handler';
import { forceGeneratePaymentForAgreement } from '@/lib/validation-schemas/agreement';
import { withTimeout, withTimeoutAndRetry } from '../promise-utils';
import { fetchAndProcessRecord } from '@/hooks/use-supabase-query';
import { processBatches } from '../concurrency-utils';
import { addMonths, getFirstDayOfMonth } from '../date-formatter';

/**
 * Generate payment schedule for an agreement
 * @param agreement The agreement data
 * @returns Result of the payment schedule generation
 */
export async function generatePaymentSchedule(
  agreement: any,
  onStatusUpdate?: (status: string) => void
): Promise<ServiceResponse<any>> {
  return withTimeout(
    async () => {
      try {
        if (!agreement || !agreement.id) {
          return { success: false, message: 'Invalid agreement data' };
        }

        if (onStatusUpdate) onStatusUpdate('Validating agreement data...');
        
        // Step 1: Extract and validate basic agreement data
        const { 
          id: leaseId, 
          rent_amount: rentAmount, 
          rent_due_day: rentDueDay = 1,
          start_date: startDate
        } = agreement;
        
        if (!leaseId || !startDate) {
          return { success: false, message: 'Agreement is missing required fields' };
        }

        if (!rentAmount || rentAmount <= 0) {
          return { success: false, message: 'Agreement has invalid rent amount' };
        }

        if (onStatusUpdate) onStatusUpdate('Checking existing payments...');
        
        // Step 2: Check for existing payments
        const existingPayments = await fetchExistingPayments(leaseId);
        
        if (existingPayments.length > 0) {
          console.log(`Found ${existingPayments.length} existing payments for agreement ${leaseId}`);
          return { success: true, message: 'Payment schedule already exists', data: existingPayments };
        }
        
        // Step 3: Generate payment schedule
        if (onStatusUpdate) onStatusUpdate('Generating payment schedule...');
        const schedule = await generateSchedule(agreement);
        
        if (!schedule || !schedule.length) {
          return { success: false, message: 'Failed to generate payment schedule' };
        }
        
        // Step 4: Save payment schedule to database
        if (onStatusUpdate) onStatusUpdate('Saving payment records...');
        const result = await savePaymentSchedule(schedule);
        
        return result;
      } catch (error) {
        console.error("Error generating payment schedule:", error);
        return { 
          success: false, 
          message: `Error generating payment schedule: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    },
    15000, // 15 second timeout
    'Payment schedule generation'
  );
}

/**
 * Fetch existing payment records for an agreement
 * @param leaseId The agreement ID
 * @returns Array of payment records
 */
async function fetchExistingPayments(leaseId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', leaseId)
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error("Error fetching existing payments:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Exception fetching payments:", error);
    return [];
  }
}

/**
 * Generate a complete payment schedule for an agreement
 * @param agreement The agreement data
 * @returns Array of payment records
 */
async function generateSchedule(agreement: any): Promise<any[]> {
  const {
    id: leaseId,
    rent_amount: rentAmount,
    start_date: startDate,
    end_date: endDate,
    rent_due_day: rentDueDay = 1
  } = agreement;
  
  // Calculate schedule based on agreement properties
  const schedule = [];
  const startDateObj = new Date(startDate);
  const endDateObj = endDate ? new Date(endDate) : addMonths(startDateObj, 12);
  
  let currentDate = new Date(startDateObj);
  
  // Set to the specified due day of the month
  currentDate.setDate(rentDueDay);
  
  // If start date is after the due day, move to next month
  if (startDateObj.getDate() > rentDueDay) {
    currentDate = addMonths(currentDate, 1);
  }
  
  // Generate payments until end date
  while (currentDate <= endDateObj) {
    schedule.push({
      lease_id: leaseId,
      due_date: currentDate.toISOString(),
      amount: rentAmount,
      status: 'pending',
      type: 'rent',
      description: `Monthly rent payment for ${agreement.agreement_number || 'agreement'}`
    });
    
    currentDate = addMonths(currentDate, 1);
  }
  
  return schedule;
}

/**
 * Save a payment schedule to the database
 * @param schedule Array of payment records to save
 * @returns Result of the save operation
 */
async function savePaymentSchedule(schedule: any[]): Promise<ServiceResponse<any>> {
  try {
    const { data, error } = await supabase
      .from('unified_payments')
      .insert(schedule);
    
    if (error) {
      console.error("Error saving payment schedule:", error);
      return { success: false, message: `Failed to save payment schedule: ${error.message}` };
    }
    
    return { success: true, message: 'Payment schedule generated successfully', data };
  } catch (error) {
    console.error("Exception saving payment schedule:", error);
    return { 
      success: false, 
      message: `Error saving payment schedule: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Helper function to add months to a date
 * @param date The starting date
 * @param months Number of months to add
 * @returns New date with months added
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Generate payment for an agreement by ID
 * This is an optimized version that uses chainDatabaseOperations to combine
 * the fetching of agreement data and payment generation into one operation
 * 
 * @param agreementId The agreement ID to generate payment for
 * @returns Result of the payment generation operation
 */
export async function generatePaymentForAgreement(agreementId: string): Promise<ServiceResponse<any>> {
  return fetchAndProcessRecord(
    'leases',
    agreementId,
    (agreement) => forceGeneratePaymentForAgreement(supabase, agreement.id, undefined),
    {
      operationName: "Payment generation",
      timeoutMs: 30000,
      retries: 2
    }
  );
}

/**
 * Batch generate payments for multiple agreements
 * @param agreementIds Array of agreement IDs to generate payments for
 * @returns Results of payment generation operations
 */
export async function batchGeneratePayments(
  agreementIds: string[]
): Promise<{
  results: Array<{ id: string; success: boolean; message?: string }>;
  summary: { total: number; succeeded: number; failed: number };
}> {
  console.log(`Starting batch payment generation for ${agreementIds.length} agreements`);
  
  // Process agreements in batches with controlled concurrency
  const results = await processBatches(
    agreementIds,
    10, // Process 10 agreements per batch
    3,  // Maximum 3 concurrent operations
    async (id) => {
      try {
        console.log(`Generating payment for agreement ${id}`);
        const result = await generatePaymentForAgreement(id);
        
        if (!result.success) {
          console.error(`Failed to generate payment for agreement ${id}: ${result.message}`);
        }
        
        return {
          id,
          success: result.success,
          message: result.message
        };
      } catch (error) {
        console.error(`Error generating payment for agreement ${id}:`, error);
        return {
          id,
          success: false,
          message: error instanceof Error ? error.message : String(error)
        };
      }
    },
    (batchResults, batchIndex) => {
      // Log progress after each batch
      const successCount = batchResults.filter(r => r.success).length;
      console.log(`Completed batch ${batchIndex + 1}: ${successCount}/${batchResults.length} succeeded`);
    }
  );

  // Calculate summary statistics
  const summary = results.reduce(
    (acc, curr) => {
      acc.total += 1;
      acc.succeeded += curr.success ? 1 : 0;
      acc.failed += curr.success ? 0 : 1;
      return acc;
    },
    { total: 0, succeeded: 0, failed: 0 }
  );

  console.log(`Batch payment generation completed: ${summary.succeeded}/${summary.total} succeeded`);
  return { results, summary };
}
