
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { MutationVariables } from '@/utils/type-utils';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';

/**
 * Checks if a vehicle is already assigned to an active agreement
 * @param vehicleId The ID of the vehicle to check
 * @param currentAgreementId Optional: The ID of the current agreement (to exclude from check)
 * @returns Object containing check result and any existing agreement details
 */
export const checkVehicleAvailability = async (
  vehicleId: string, 
  currentAgreementId?: string
): Promise<{
  isAvailable: boolean;
  existingAgreement?: {
    id: string;
    agreement_number: string;
    will_be_closed: boolean;
  }
}> => {
  try {
    if (!vehicleId) {
      return { isAvailable: true };
    }

    // Query for any active agreements using this vehicle
    const { data, error } = await supabase
      .from('leases')
      .select('id, agreement_number, status')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error("Error checking vehicle availability:", error);
      return { isAvailable: true }; // Default to available in case of error
    }

    // If no active agreement or the active agreement is the current one, vehicle is available
    if (!data || (currentAgreementId && data.id === currentAgreementId)) {
      return { isAvailable: true };
    }

    // Vehicle is already assigned to another active agreement
    return { 
      isAvailable: false,
      existingAgreement: {
        id: data.id,
        agreement_number: data.agreement_number,
        will_be_closed: true // This agreement will be closed if the new one is activated
      }
    };
  } catch (error) {
    console.error("Unexpected error in checkVehicleAvailability:", error);
    return { isAvailable: true }; // Default to available in case of error
  }
};

/**
 * Handles activation of an agreement, with warning if vehicle is already assigned
 * @param id The agreement ID to activate
 * @param vehicleId The vehicle ID to check
 * @returns Promise resolving to success status
 */
export const activateAgreement = async (
  id: string, 
  vehicleId: string
): Promise<boolean> => {
  try {
    // Check vehicle availability first
    const { isAvailable, existingAgreement } = await checkVehicleAvailability(vehicleId, id);
    
    // If vehicle is not available, close the existing agreement
    if (!isAvailable && existingAgreement) {
      // Show toast about closing other agreement
      toast(`Vehicle is currently assigned to agreement #${existingAgreement.agreement_number}. That agreement will be automatically closed.`, {
        duration: 5000
      });
      
      // Close the existing agreement
      const { error: closeError } = await supabase
        .from('leases')
        .update({ 
          status: 'closed', 
          updated_at: new Date().toISOString(),
          notes: `Agreement automatically closed when vehicle was reassigned to agreement ${id}`
        })
        .eq('id', existingAgreement.id);
        
      if (closeError) {
        console.error("Error closing existing agreement:", closeError);
        toast.error("Failed to close existing agreement");
      } else {
        console.log(`Successfully closed agreement ${existingAgreement.id}`);
        toast.success(`Agreement #${existingAgreement.agreement_number} was closed successfully`);
      }
    }

    // Proceed with activation
    const { error } = await supabase
      .from('leases')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error("Error activating agreement:", error);
      toast.error("Failed to activate agreement");
      return false;
    }

    toast.success("Agreement activated successfully");
    return true;
  } catch (error) {
    console.error("Unexpected error in activateAgreement:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

/**
 * Enhances the agreement update function with vehicle availability check
 * @param updateParams The update parameters
 * @param onSuccess Optional success callback
 * @param onError Optional error callback
 */
export const updateAgreementWithCheck = async (
  updateParams: MutationVariables<Agreement>,
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<void> => {
  try {
    const { id, data } = updateParams;
    
    // Check if this is a status change to 'active' and the agreement has a vehicle
    if (data.status === 'active' && data.vehicle_id) {
      const { isAvailable, existingAgreement } = await checkVehicleAvailability(
        data.vehicle_id.toString(), 
        id
      );
      
      // If vehicle is not available, close the existing agreement
      if (!isAvailable && existingAgreement) {
        // Show warning toast about closing other agreement
        toast(`Vehicle is currently assigned to agreement #${existingAgreement.agreement_number}. That agreement will be automatically closed.`, {
          duration: 5000
        });
        
        // Close the existing agreement
        const { error: closeError } = await supabase
          .from('leases')
          .update({ 
            status: 'closed', 
            updated_at: new Date().toISOString(),
            notes: `Agreement automatically closed when vehicle was reassigned to agreement ${id}`
          })
          .eq('id', existingAgreement.id);
          
        if (closeError) {
          console.error("Error closing existing agreement:", closeError);
          toast.error("Failed to close existing agreement");
        } else {
          console.log(`Successfully closed agreement ${existingAgreement.id}`);
        }
      }
    }
    
    // Map the status values to those expected by the database
    let dbStatus = data.status;
    
    // Convert AgreementStatus to database status
    // These mappings need to align with what the database expects
    if (data.status === AgreementStatus.DRAFT) {
      dbStatus = 'pending_payment'; // Map 'draft' to 'pending_payment'
    } else if (data.status === AgreementStatus.PENDING) {
      dbStatus = 'pending_payment'; // Map 'pending' to 'pending_payment'
    } else if (data.status === AgreementStatus.EXPIRED) {
      dbStatus = 'archived'; // Map 'expired' to 'archived'
    } else if (data.status === AgreementStatus.CLOSED) {
      dbStatus = 'closed';
    } else if (data.status === AgreementStatus.ACTIVE) {
      dbStatus = 'active';
    } else if (data.status === AgreementStatus.CANCELLED) {
      dbStatus = 'cancelled';
    }
    
    // Convert Date objects to ISO strings for Supabase
    const preparedData = {
      ...data,
      status: dbStatus,
      // Ensure dates are properly formatted as strings
      created_at: data.created_at instanceof Date ? data.created_at.toISOString() : data.created_at,
      updated_at: new Date().toISOString(),
      start_date: data.start_date instanceof Date ? data.start_date.toISOString() : data.start_date,
      end_date: data.end_date instanceof Date ? data.end_date.toISOString() : data.end_date
    };
    
    // Proceed with the update
    const { error } = await supabase
      .from('leases')
      .update(preparedData)
      .eq('id', id);
      
    if (error) {
      console.error("Error updating agreement:", error);
      toast.error("Failed to update agreement");
      if (onError) onError(error);
      return;
    }
    
    toast.success("Agreement updated successfully");
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error("Unexpected error in updateAgreementWithCheck:", error);
    toast.error("An unexpected error occurred");
    if (onError) onError(error);
  }
};
