
import { supabase } from "@/lib/supabase";
import { safeAsync } from "@/utils/error-handling";
import { toast } from "sonner";
import { forceGeneratePaymentForAgreement } from "@/lib/validation-schemas/agreement";
import { Agreement } from "@/lib/validation-schemas/agreement";
import { SimpleAgreement } from "@/hooks/use-agreements";

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
 * Adapts a SimpleAgreement to a full Agreement object
 * Used when loading agreement details from a simplified data structure
 */
export function adaptSimpleToFullAgreement(simpleAgreement: SimpleAgreement): Agreement {
  return {
    id: simpleAgreement.id,
    agreement_number: simpleAgreement.agreement_number,
    customer_id: simpleAgreement.customer_id,
    vehicle_id: simpleAgreement.vehicle_id,
    start_date: simpleAgreement.start_date,
    end_date: simpleAgreement.end_date,
    total_amount: simpleAgreement.total_amount,
    deposit_amount: simpleAgreement.deposit_amount,
    status: simpleAgreement.status,
    notes: simpleAgreement.notes,
    created_at: simpleAgreement.created_at,
    updated_at: simpleAgreement.updated_at,
    customers: simpleAgreement.customers,
    vehicles: simpleAgreement.vehicles,
    unified_payments: simpleAgreement.unified_payments
  };
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

/**
 * Updates an agreement with validation checks and status handling
 */
export async function updateAgreementWithCheck(
  agreement: { id: string, data: any },
  userId?: string,
  onSuccess?: () => void,
  onError?: (error: any) => void,
  statusUpdateCallback?: (status: string) => void
): Promise<void> {
  try {
    if (statusUpdateCallback) statusUpdateCallback("Starting agreement update process...");
    
    // Extract the data we need to update
    const { id, data } = agreement;
    
    // If vehicle ID changed, check availability
    if (data.vehicle_id) {
      if (statusUpdateCallback) statusUpdateCallback("Checking vehicle availability...");
      
      const vehicleAvailability = await checkVehicleAvailability(data.vehicle_id);
      
      if (!vehicleAvailability.isAvailable && vehicleAvailability.existingAgreement) {
        // The vehicle is assigned to another agreement
        if (vehicleAvailability.existingAgreement.id !== id) {
          if (statusUpdateCallback) statusUpdateCallback("Vehicle is currently assigned to another agreement. Reassigning...");
          
          // Close the other agreement first
          const { error: closeError } = await supabase
            .from("leases")
            .update({ status: 'closed' })
            .eq("id", vehicleAvailability.existingAgreement.id);
            
          if (closeError) {
            throw new Error(`Failed to reassign vehicle: ${closeError.message}`);
          }
          
          console.log(`Closed agreement ${vehicleAvailability.existingAgreement.agreement_number} to reassign vehicle`);
        }
      }
    }
    
    // Check if the status is being changed to active
    if (data.status === 'active') {
      if (statusUpdateCallback) statusUpdateCallback("Activating agreement...");
      
      // Update vehicle status if vehicle is assigned
      if (data.vehicle_id) {
        const { error: vehicleError } = await supabase
          .from("vehicles")
          .update({ status: 'in_use' })
          .eq("id", data.vehicle_id);
          
        if (vehicleError) {
          throw new Error(`Failed to update vehicle status: ${vehicleError.message}`);
        }
        
        if (statusUpdateCallback) statusUpdateCallback("Vehicle marked as in-use.");
      }
      
      // Ensure payment schedule exists
      try {
        if (statusUpdateCallback) statusUpdateCallback("Generating payment schedule...");
        await forceGeneratePaymentForAgreement(supabase, id);
      } catch (paymentError) {
        console.warn("Could not generate payment schedule:", paymentError);
        // Non-critical error, continue with update
      }
    }
    
    // If status is changed to closed, update vehicle status
    if (data.status === 'closed') {
      if (statusUpdateCallback) statusUpdateCallback("Closing agreement...");
      
      // Get the current vehicle ID from the agreement if not in the update data
      let vehicleId = data.vehicle_id;
      if (!vehicleId) {
        const { data: currentData, error: fetchError } = await supabase
          .from("leases")
          .select("vehicle_id")
          .eq("id", id)
          .single();
          
        if (fetchError) {
          console.warn("Could not fetch current vehicle ID:", fetchError);
        } else {
          vehicleId = currentData.vehicle_id;
        }
      }
      
      // Update vehicle status to available if we have a vehicle ID
      if (vehicleId) {
        if (statusUpdateCallback) statusUpdateCallback("Updating vehicle status to available...");
        
        const { error: vehicleError } = await supabase
          .from("vehicles")
          .update({ status: 'available' })
          .eq("id", vehicleId);
          
        if (vehicleError) {
          console.warn("Failed to update vehicle status:", vehicleError);
          // Non-critical error, continue with update
        }
      }
    }
    
    // Record user who made the update
    if (userId) {
      data.updated_by = userId;
    }
    
    // Perform the actual agreement update
    if (statusUpdateCallback) statusUpdateCallback("Updating agreement record...");
    const { error: updateError } = await supabase
      .from("leases")
      .update(data)
      .eq("id", id);
      
    if (updateError) {
      throw new Error(`Failed to update agreement: ${updateError.message}`);
    }
    
    // All operations completed successfully
    if (statusUpdateCallback) statusUpdateCallback("Agreement updated successfully!");
    
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error("Error in updateAgreementWithCheck:", error);
    
    if (onError) {
      onError(error);
    }
  }
}
