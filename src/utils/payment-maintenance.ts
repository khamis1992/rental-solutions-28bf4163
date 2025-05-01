
import { supabase } from "@/lib/supabase";
import { forceGeneratePaymentForAgreement } from "@/lib/validation-schemas/agreement";
import { asTableId } from "@/lib/database-helpers";

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
    
    // Check each agreement for missing payment schedules
    for (const agreement of activeAgreements) {
      try {
        // Check if payment schedule exists for this agreement
        const { data: existingPayments, error: paymentsError } = await supabase
          .from("unified_payments")
          .select("id")
          .eq("lease_id", agreement.id)
          .limit(1);
          
        if (paymentsError) {
          console.error(`Error checking payments for agreement ${agreement.id}:`, paymentsError);
          errorCount++;
          continue;
        }
        
        // If no payments exist, generate them
        if (!existingPayments || existingPayments.length === 0) {
          console.log(`Generating payment schedule for agreement ${agreement.agreement_number}`);
          
          const result = await forceGeneratePaymentForAgreement(supabase, agreement.id);
          
          if (result.success) {
            generatedCount++;
            console.log(`Successfully generated payment schedule for agreement ${agreement.agreement_number}`);
          } else {
            errorCount++;
            console.error(`Failed to generate payment schedule for agreement ${agreement.agreement_number}:`, result.message);
          }
        }
      } catch (agreementError) {
        console.error(`Error processing agreement ${agreement.id}:`, agreementError);
        errorCount++;
      }
    }
    
    const message = `Payment schedule check completed. Generated ${generatedCount} new schedules. Encountered ${errorCount} errors.`;
    console.log(message);
    
    return {
      success: true,
      generatedCount,
      errorCount,
      message
    };
  } catch (error) {
    console.error("Unexpected error in checkAndCreateMissingPaymentSchedules:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
