
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { asTableId } from '@/lib/database-helpers';

/**
 * Calculates the late fee based on the rent amount and days late
 * @param rentAmount The amount of rent
 * @param daysLate Number of days the payment is late
 * @returns The calculated late fee
 */
export function calculateLateFee(rentAmount: number, daysLate: number): number {
  // Base late fee is 10% of rent amount
  const baseFee = rentAmount * 0.1;
  
  // Additional fee per day is 2% of rent up to 10 days max
  const dailyFee = rentAmount * 0.02 * Math.min(daysLate, 10);
  
  // Cap the total late fee at 30% of rent
  return Math.min(baseFee + dailyFee, rentAmount * 0.3);
}

/**
 * Updates an agreement with validation checks
 */
export function updateAgreementWithCheck(agreement: Agreement): Promise<boolean> {
  // Implementation would go here
  return Promise.resolve(true);
}

/**
 * Adapts a simple agreement object to a full agreement object
 */
export function adaptSimpleToFullAgreement(data: any): Agreement {
  const agreement: Agreement = {
    ...data,
    start_date: data.start_date ? new Date(data.start_date) : null,
    end_date: data.end_date ? new Date(data.end_date) : null,
    created_at: data.created_at ? new Date(data.created_at) : null,
    updated_at: data.updated_at ? new Date(data.updated_at) : null,
  };
  
  return agreement;
}

/**
 * Checks and creates missing payment schedules for active agreements
 * @returns Promise with status of the operation
 */
export async function checkAndCreateMissingPaymentSchedules(): Promise<{
  success: boolean;
  message: string;
  created?: number;
}> {
  try {
    console.log("Running payment schedule maintenance job");
    
    // Get all active agreements
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from('leases')
      .select('id, start_date, end_date, rent_amount')
      .eq('status', 'active');
      
    if (agreementsError) {
      console.error("Error fetching active agreements:", agreementsError);
      return { 
        success: false, 
        message: `Error fetching active agreements: ${agreementsError.message}` 
      };
    }
    
    if (!activeAgreements || activeAgreements.length === 0) {
      return { 
        success: true, 
        message: "No active agreements found that need payment schedules" 
      };
    }
    
    console.log(`Found ${activeAgreements.length} active agreements to process`);
    
    let createdCount = 0;
    
    // Process each active agreement
    for (const agreement of activeAgreements) {
      // Check for existing payment records for this agreement
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('id, due_date')
        .eq('lease_id', asTableId('unified_payments', agreement.id));
        
      if (paymentsError) {
        console.error(`Error checking payments for agreement ${agreement.id}:`, paymentsError);
        continue;
      }
      
      // Convert dates to Date objects
      const startDate = new Date(agreement.start_date);
      const endDate = new Date(agreement.end_date);
      
      // Calculate how many monthly payments should exist
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();
      
      const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
      
      // If we already have the right number of payments, skip
      if (existingPayments && existingPayments.length >= totalMonths) {
        console.log(`Agreement ${agreement.id} already has sufficient payment records`);
        continue;
      }
      
      // Create a map of existing payment due dates to avoid duplicates
      const existingDueDates = new Set();
      if (existingPayments) {
        existingPayments.forEach(payment => {
          const dueDate = new Date(payment.due_date);
          const key = `${dueDate.getFullYear()}-${dueDate.getMonth() + 1}`;
          existingDueDates.add(key);
        });
      }
      
      // Generate missing payment records
      for (let i = 0; i < totalMonths; i++) {
        const paymentDate = new Date(startYear, startMonth + i, 1);
        const key = `${paymentDate.getFullYear()}-${paymentDate.getMonth() + 1}`;
        
        // Skip if payment for this month already exists
        if (existingDueDates.has(key)) {
          continue;
        }
        
        // Create payment record
        const dueDate = paymentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        const { error: insertError } = await supabase
          .from('unified_payments')
          .insert({
            lease_id: agreement.id,
            amount: agreement.rent_amount,
            amount_paid: 0,
            balance: agreement.rent_amount,
            original_due_date: dueDate,
            due_date: dueDate,
            payment_date: null,
            status: 'pending',
            type: 'rent',
            is_recurring: true,
            description: `Monthly rent payment for ${paymentDate.toLocaleString('default', { month: 'long' })} ${paymentDate.getFullYear()}`
          });
          
        if (insertError) {
          console.error(`Error creating payment record for agreement ${agreement.id}:`, insertError);
        } else {
          createdCount++;
        }
      }
    }
    
    return {
      success: true,
      message: `Successfully created ${createdCount} missing payment records`,
      created: createdCount
    };
    
  } catch (error) {
    console.error("Unexpected error in checkAndCreateMissingPaymentSchedules:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Checks the availability of a vehicle for a given time period
 * @param vehicleId The ID of the vehicle to check
 * @param startDate The start date of the period to check
 * @param endDate The end date of the period to check
 * @param excludeAgreementId Optional agreement ID to exclude from the check
 * @returns Promise with vehicle availability status
 */
export async function checkVehicleAvailability(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeAgreementId?: string
): Promise<{
  available: boolean;
  message?: string;
  conflictingAgreements?: any[];
}> {
  try {
    // Format dates for database query
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Build query to find conflicts
    let query = supabase
      .from('leases')
      .select('id, agreement_number, start_date, end_date, status, customers:profiles!inner(*)')
      .eq('vehicle_id', vehicleId)
      .neq('status', 'cancelled')
      .neq('status', 'terminated')
      .or(`start_date.lte.${formattedEndDate},end_date.gte.${formattedStartDate}`);
    
    // Exclude the current agreement if provided
    if (excludeAgreementId) {
      query = query.neq('id', excludeAgreementId);
    }
    
    const { data: conflicts, error } = await query;
    
    if (error) {
      console.error("Error checking vehicle availability:", error);
      return { 
        available: false, 
        message: `Error checking availability: ${error.message}` 
      };
    }
    
    if (!conflicts || conflicts.length === 0) {
      return { 
        available: true 
      };
    }
    
    // Vehicle is not available
    return {
      available: false,
      message: `Vehicle is already assigned for the selected period`,
      conflictingAgreements: conflicts
    };
    
  } catch (error) {
    console.error("Unexpected error in checkVehicleAvailability:", error);
    return {
      available: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
