import { supabase } from "@/lib/supabase";
import { safeAsync } from "@/utils/error-handling";
import { toast } from "sonner";
import { forceGeneratePaymentForAgreement } from "@/lib/validation-schemas/agreement";

interface ExistingAgreement {
  id: string;
  agreement_number: string;
}

interface VehicleAvailabilityResult {
  isAvailable: boolean;
  existingAgreement?: ExistingAgreement;
  error?: string;
}

/**
 * Checks if a vehicle is available or currently assigned to another agreement
 */
export async function checkVehicleAvailability(vehicleId: string): Promise<VehicleAvailabilityResult> {
  try {
    // Check if vehicle exists and is available
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .select("status")
      .eq("id", vehicleId as any)
      .single();

    if (vehicleError) {
      return {
        isAvailable: false,
        error: `Could not check vehicle status: ${vehicleError.message}`
      };
    }

    // If vehicle status is 'available', it's available
    if (vehicleData?.status === 'available') {
      return { isAvailable: true };
    }

    // Check if vehicle is assigned to any active agreements
    const { data: agreementData, error: agreementError } = await supabase
      .from("leases")
      .select("id, agreement_number")
      .eq("vehicle_id", vehicleId as any)
      .eq("status", 'active' as any)
      .single();

    if (agreementError && agreementError.code !== 'PGRST116') {
      // PGRST116 is "No rows returned" which is fine (means no active agreements)
      return {
        isAvailable: false,
        error: `Error checking existing agreements: ${agreementError.message}`
      };
    }

    if (agreementData) {
      // Vehicle is assigned to an active agreement
      return {
        isAvailable: false,
        existingAgreement: {
          id: agreementData.id,
          agreement_number: agreementData.agreement_number
        }
      };
    }

    // Vehicle exists but isn't assigned to an active agreement, consider it available
    return { isAvailable: true };
  } catch (error) {
    console.error("Error checking vehicle availability:", error);
    return {
      isAvailable: false,
      error: error instanceof Error ? error.message : "Unknown error checking availability"
    };
  }
}

/**
 * Activates an agreement and assigns a vehicle, handling any existing assignments
 */
export async function activateAgreement(agreementId: string, vehicleId: string): Promise<boolean> {
  // First check if vehicle is already assigned to another active agreement
  const availability = await checkVehicleAvailability(vehicleId);
  
  try {
    // Begin a transaction to ensure consistency
    if (!availability.isAvailable && availability.existingAgreement) {
      // Close the existing agreement first
      const { error: closeError } = await supabase
        .from("leases")
        .update({ status: 'closed' })
        .eq("id", availability.existingAgreement.id);
        
      if (closeError) {
        console.error("Error closing existing agreement:", closeError);
        toast.error("Failed to close existing vehicle agreement");
        return false;
      }
      
      console.log(`Closed existing agreement ${availability.existingAgreement.agreement_number}`);
    }
    
    // Set vehicle status to in-use
    const { error: vehicleError } = await supabase
      .from("vehicles")
      .update({ status: 'in_use' })
      .eq("id", vehicleId as any);
      
    if (vehicleError) {
      console.error("Error updating vehicle status:", vehicleError);
      toast.error("Failed to update vehicle status");
      return false;
    }
    
    // Now activate the new agreement
    try {
      console.log("Generating initial payment schedule for new agreement");
      const result = await forceGeneratePaymentForAgreement(supabase, agreementId);
      if (!result.success) {
        console.warn("Could not generate payment schedule:", result.message);
      }
    } catch (paymentError) {
      console.error("Error generating payment schedule:", paymentError);
    }
    
    return true;
  } catch (error) {
    console.error("Error activating agreement:", error);
    toast.error("Failed to activate agreement");
    return false;
  }
}

