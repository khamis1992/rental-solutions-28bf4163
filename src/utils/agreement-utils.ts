
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { MutationVariables } from '@/utils/type-utils';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { recordVehicleReassignment } from './reassignment-utils';

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
      .select('id, agreement_number, status, customer_id')
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
 * @param userId Optional: The user ID performing the activation
 * @param transferObligations Whether to transfer financial obligations to the new agreement
 * @returns Promise resolving to success status
 */
export const activateAgreement = async (
  id: string, 
  vehicleId: string,
  userId?: string,
  transferObligations: boolean = false
): Promise<boolean> => {
  try {
    // Get new agreement details
    const { data: newAgreement, error: newAgreementError } = await supabase
      .from('leases')
      .select('id, agreement_number')
      .eq('id', id)
      .single();
      
    if (newAgreementError) {
      console.error("Error fetching new agreement details:", newAgreementError);
      toast.error("Failed to find agreement details");
      return false;
    }
    
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
        
        // Record the vehicle reassignment for historical tracking
        await recordVehicleReassignment({
          sourceAgreementId: existingAgreement.id,
          sourceAgreementNumber: existingAgreement.agreement_number,
          targetAgreementId: id,
          targetAgreementNumber: newAgreement.agreement_number,
          vehicleId: vehicleId,
          userId: userId,
          reason: "Vehicle reassigned to new agreement",
          transferObligations: transferObligations
        });
        
        // Transfer financial obligations if requested
        if (transferObligations && existingAgreement.id) {
          const { transferObligations } = await import('./reassignment-utils');
          await transferObligations(existingAgreement.id, id);
        }
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
 * Generates documentation for a vehicle reassignment
 * @param sourceAgreementId Previous agreement
 * @param targetAgreementId New agreement
 * @returns URL to the generated document
 */
export const generateReassignmentDocument = async (
  sourceAgreementId: string,
  targetAgreementId: string
): Promise<string | null> => {
  try {
    // This would be implemented to generate transfer/transition documentation
    // For now, just return a placeholder message
    toast.info("Document generation to be implemented");
    return null;
  } catch (error) {
    console.error("Error generating reassignment document:", error);
    return null;
  }
};

/**
 * Enhances the agreement update function with vehicle availability check
 * @param updateParams The update parameters
 * @param userId Optional: The user ID performing the update
 * @param onSuccess Optional success callback
 * @param onError Optional error callback
 * @param transferObligations Whether to transfer financial obligations to the new agreement
 */
export const updateAgreementWithCheck = async (
  updateParams: MutationVariables<Agreement>,
  userId?: string,
  onSuccess?: () => void,
  onError?: (error: any) => void,
  transferObligations: boolean = false
): Promise<void> => {
  try {
    const { id, data } = updateParams;
    
    // Get existing agreement details for potential reassignment tracking
    const { data: existingAgreement, error: existingAgreementError } = await supabase
      .from('leases')
      .select('id, agreement_number, vehicle_id')
      .eq('id', id)
      .single();
      
    if (existingAgreementError) {
      console.error("Error fetching existing agreement details:", existingAgreementError);
    }
    
    // Check if this is a status change to 'active' and the agreement has a vehicle
    if (data.status === AgreementStatus.ACTIVE && data.vehicle_id) {
      const { isAvailable, existingAgreement: vehicleAgreement } = await checkVehicleAvailability(
        data.vehicle_id.toString(), 
        id
      );
      
      // If vehicle is not available, close the existing agreement
      if (!isAvailable && vehicleAgreement) {
        // Show warning toast about closing other agreement
        toast(`Vehicle is currently assigned to agreement #${vehicleAgreement.agreement_number}. That agreement will be automatically closed.`, {
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
          .eq('id', vehicleAgreement.id);
          
        if (closeError) {
          console.error("Error closing existing agreement:", closeError);
          toast.error("Failed to close existing agreement");
        } else {
          console.log(`Successfully closed agreement ${vehicleAgreement.id}`);
          
          // Record the vehicle reassignment if we have all the necessary details
          if (existingAgreement) {
            await recordVehicleReassignment({
              sourceAgreementId: vehicleAgreement.id,
              sourceAgreementNumber: vehicleAgreement.agreement_number,
              targetAgreementId: id,
              targetAgreementNumber: existingAgreement.agreement_number,
              vehicleId: data.vehicle_id.toString(),
              userId: userId,
              reason: "Vehicle reassigned during agreement update",
              transferObligations: transferObligations
            });
            
            // Transfer financial obligations if requested
            if (transferObligations && vehicleAgreement.id) {
              const { transferObligations } = await import('./reassignment-utils');
              await transferObligations(vehicleAgreement.id, id);
            }
          }
        }
      }
      
      // Check if this is a vehicle change, not just a status change
      if (existingAgreement && 
          existingAgreement.vehicle_id && 
          data.vehicle_id.toString() !== existingAgreement.vehicle_id.toString()) {
        // This is a vehicle change within the same agreement - record it as well
        console.log(`Vehicle changed from ${existingAgreement.vehicle_id} to ${data.vehicle_id}`);
        
        // We might want to record this differently or handle it as a special case
      }
    }
    
    // Map the Agreement enum status to database status values
    let dbStatus: string;
    
    // Convert AgreementStatus to database status string
    switch(data.status) {
      case AgreementStatus.DRAFT:
        dbStatus = 'pending_payment';
        break;
      case AgreementStatus.PENDING:
        dbStatus = 'pending_payment';
        break;
      case AgreementStatus.EXPIRED:
        dbStatus = 'archived';
        break;
      case AgreementStatus.CLOSED:
        dbStatus = 'closed';
        break;
      case AgreementStatus.ACTIVE:
        dbStatus = 'active';
        break;
      case AgreementStatus.CANCELLED:
        dbStatus = 'cancelled';
        break;
      default:
        dbStatus = 'pending_payment'; // Default fallback
    }
    
    // Convert Date objects to ISO strings for Supabase
    const preparedData: Record<string, any> = {
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
