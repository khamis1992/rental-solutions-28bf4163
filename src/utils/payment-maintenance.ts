
import { supabase } from "@/lib/supabase";
import { forceGeneratePaymentForAgreement } from "@/lib/validation-schemas/agreement";
import { asTableId } from "@/lib/database-helpers";
import { processBatches } from "@/utils/concurrency-utils";
import { withTimeoutAndRetry } from "@/utils/promise-utils";

/**
 * Checks and creates missing payment schedules for active agreements
 * This function ensures all agreements have properly set up payment schedules
 * @returns Object with success status and message
 */
export async function checkAndCreateMissingPaymentSchedules() {
  try {
    console.log("Checking for missing payment schedules...");
    
    // Get all active agreements
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from("leases")
      .select("id, agreement_number, start_date")
      .eq("status", 'active');
      
    if (agreementsError) {
      console.error("Error fetching agreements:", agreementsError);
      return {
        success: false,
        message: `Failed to fetch agreements: ${agreementsError.message}`
      };
    }
    
    if (!activeAgreements || activeAgreements.length === 0) {
      console.log("No active agreements found");
      return { 
        success: true, 
        message: "No active agreements found" 
      };
    }
    
    console.log(`Found ${activeAgreements.length} active agreements to check`);
    
    // Track progress
    let generatedCount = 0;
    let errorCount = 0;
    
    // First, check which agreements need payment schedules
    const agreementsNeedingSchedules = await Promise.all(
      activeAgreements.map(async (agreement) => {
        // Check if payment schedule exists for this agreement
        const { data: existingPayments, error: paymentsError } = await supabase
          .from("unified_payments")
          .select("id")
          .eq("lease_id", agreement.id)
          .limit(1);
          
        if (paymentsError) {
          console.error(`Error checking payments for agreement ${agreement.id}:`, paymentsError);
          return null;
        }
        
        // If no payments exist, this agreement needs a schedule
        if (!existingPayments || existingPayments.length === 0) {
          return agreement;
        }
        
        return null;
      })
    ).then(results => results.filter(Boolean));
    
    const filteredAgreements = agreementsNeedingSchedules.filter(Boolean) as typeof activeAgreements;
    
    console.log(`${filteredAgreements.length} agreements need payment schedules`);
    
    if (filteredAgreements.length === 0) {
      return {
        success: true,
        message: "All agreements already have payment schedules"
      };
    }
    
    // Process agreements in batches with limited concurrency to prevent race conditions
    const results = await processBatches(
      filteredAgreements,
      10, // Process 10 agreements at a time
      3,  // Maximum 3 concurrent operations
      async (agreement) => {
        try {
          console.log(`Generating payment schedule for agreement ${agreement.agreement_number}`);
          
          // Use withTimeoutAndRetry to add resilience
          const result = await withTimeoutAndRetry(
            () => forceGeneratePaymentForAgreement(supabase, agreement.id),
            {
              operationName: `Payment generation for ${agreement.agreement_number}`,
              timeoutMs: 10000,
              retries: 2,
              retryDelayMs: 500
            }
          );
          
          if (result.success) {
            generatedCount++;
            console.log(`Successfully generated payment schedule for agreement ${agreement.agreement_number}`);
          } else {
            errorCount++;
            console.error(`Failed to generate payment schedule for agreement ${agreement.agreement_number}:`, result.message);
          }
          
          return {
            agreementId: agreement.id,
            agreementNumber: agreement.agreement_number,
            success: result.success,
            message: result.message
          };
        } catch (error) {
          errorCount++;
          console.error(`Error processing agreement ${agreement.id}:`, error);
          return {
            agreementId: agreement.id,
            agreementNumber: agreement.agreement_number,
            success: false,
            message: error instanceof Error ? error.message : String(error)
          };
        }
      },
      (batchResults, batchIndex) => {
        // Log progress after each batch
        console.log(`Completed batch ${batchIndex + 1}, processed ${(batchIndex + 1) * 10} agreements`);
      }
    );
    
    const message = `Payment schedule check completed. Generated ${generatedCount} new schedules. Encountered ${errorCount} errors.`;
    console.log(message);
    
    return {
      success: true,
      generatedCount,
      errorCount,
      message,
      details: results
    };
  } catch (error) {
    console.error("Unexpected error in checkAndCreateMissingPaymentSchedules:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
