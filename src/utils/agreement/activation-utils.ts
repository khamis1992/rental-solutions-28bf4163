
import { supabase } from '@/lib/supabase';
import { castDbId } from '@/utils/supabase-type-helpers';
import { forceGeneratePaymentForAgreement } from './payment-schedule';
import { checkVehicleAvailability } from './vehicle-utils';

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
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select('id, status')
      .eq('id', castDbId(agreementId))
      .single();
    
    if (agreementError || !agreement) {
      console.error("Error getting agreement for activation:", agreementError);
      return { 
        success: false, 
        message: agreementError?.message || "Agreement not found" 
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
      console.error("Error activating agreement:", updateError);
      return { 
        success: false, 
        message: `Failed to activate agreement: ${updateError.message}` 
      };
    }
    
    // Generate the payment schedule
    const scheduleResult = await forceGeneratePaymentForAgreement({ id: agreementId });
    
    if (!scheduleResult.success) {
      console.warn("Agreement activated but payment schedule generation failed:", scheduleResult.message);
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
    console.error("Error in activateAgreement:", error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
