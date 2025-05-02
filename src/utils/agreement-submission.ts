
import { AgreementValidationService } from "@/services/AgreementValidationService";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { checkVehicleAvailability, activateAgreement } from "@/utils/agreement";
import { forceGeneratePaymentForAgreement } from "@/lib/validation-schemas/agreement";
import { DatabaseError, ApiError, safeAsync } from "@/utils/error-handling";

export interface SubmissionResult {
  success: boolean;
  agreementId?: string;
  error?: string;
}

/**
 * Handles the submission of a new agreement with proper validation and error handling
 */
export async function handleAgreementSubmission(formData: any): Promise<SubmissionResult> {
  try {
    // Step 1: Validate the agreement data
    const validationResult = await AgreementValidationService.validateAgreement(formData);

    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.errors);
      return {
        success: false,
        error: "Validation failed. Please check the form for errors."
      };
    }

    const { customer_data, vehicle_data, terms_accepted, ...leaseData } = formData;
    
    // Step 2: Check vehicle availability
    if (leaseData.vehicle_id && leaseData.status === 'active') {
      const { isAvailable, existingAgreement } = await checkVehicleAvailability(leaseData.vehicle_id);
      
      if (!isAvailable && existingAgreement) {
        console.log(`Vehicle is assigned to agreement #${existingAgreement.agreement_number} which will be closed`);
      }
    }
    
    // Step 3: Insert the agreement into the database
    const { data, error } = await supabase.from("leases").insert([leaseData]).select("id").single();
    
    if (error) {
      const dbError: DatabaseError = {
        message: "Failed to create agreement in database",
        code: error.code,
        table: "leases",
        operation: "insert",
        details: error.details
      };
      throw dbError;
    }
    
    // Step 4: Activate agreement if needed
    if (leaseData.status === 'active' && leaseData.vehicle_id) {
      await activateAgreement(data.id, leaseData.vehicle_id);
    } else if (leaseData.status === 'active') {
      // If agreement is active but not tied to a vehicle, still generate payment
      try {
        console.log("Generating initial payment schedule for new agreement");
        const result = await forceGeneratePaymentForAgreement(supabase, data.id);
        if (!result.success) {
          console.warn("Could not generate payment schedule:", result.message);
        }
      } catch (paymentError) {
        console.error("Error generating payment schedule:", paymentError);
      }
    }
    
    return {
      success: true,
      agreementId: data.id
    };
    
  } catch (error) {
    console.error("Error submitting agreement:", error);
    
    let errorMessage = "Failed to create agreement";
    
    if ((error as DatabaseError).table === "leases") {
      errorMessage = `Database error: ${(error as DatabaseError).message || "Failed to save agreement"}`;
    } else if ((error as ApiError).statusCode) {
      errorMessage = `API error: ${(error as ApiError).message || "Failed to process agreement"}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
