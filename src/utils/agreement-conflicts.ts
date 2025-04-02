import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';

/**
 * Checks if a vehicle is already assigned to an active agreement
 * @param vehicleId The ID of the vehicle to check
 * @param currentAgreementId Optional ID of the current agreement (to exclude from conflict check)
 * @returns An object containing conflict information
 */
export const checkVehicleBookingConflicts = async (vehicleId: string, currentAgreementId?: string) => {
  try {
    // Find all active agreements for this vehicle
    const { data: conflicts, error } = await supabase
      .from('leases')
      .select(`
        id, 
        agreement_number, 
        status, 
        start_date, 
        end_date, 
        created_at,
        customers:customer_id (id, full_name, phone_number, email)
      `)
      .eq('vehicle_id', vehicleId)
      .eq('status', AgreementStatus.ACTIVE)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error checking for vehicle conflicts:", error);
      return { hasConflicts: false, conflicts: [] };
    }

    // Filter out the current agreement from conflicts if currentAgreementId is provided
    const filteredConflicts = currentAgreementId 
      ? conflicts.filter(conflict => conflict.id !== currentAgreementId)
      : conflicts;

    return {
      hasConflicts: filteredConflicts.length > 0,
      conflicts: filteredConflicts,
      oldestConflict: filteredConflicts.length > 0 ? filteredConflicts[filteredConflicts.length - 1] : null,
      newestConflict: filteredConflicts.length > 0 ? filteredConflicts[0] : null
    };
  } catch (err) {
    console.error("Error in checkVehicleBookingConflicts:", err);
    return { hasConflicts: false, conflicts: [] };
  }
};

/**
 * Resolves vehicle booking conflicts by cancelling older agreements
 * @param vehicleId The ID of the vehicle with conflicts
 * @param keepAgreementId The ID of the agreement to keep (newest one)
 * @returns True if conflicts were successfully resolved
 */
export const resolveVehicleBookingConflicts = async (vehicleId: string, keepAgreementId: string) => {
  try {
    // Get conflicts
    const { hasConflicts, conflicts } = await checkVehicleBookingConflicts(vehicleId, keepAgreementId);
    
    if (!hasConflicts) {
      console.log("No conflicts to resolve for vehicle:", vehicleId);
      return true;
    }
    
    console.log(`Resolving ${conflicts.length} conflicts for vehicle ID ${vehicleId}`);
    
    // Cancel all other active agreements for this vehicle
    const conflictIds = conflicts.map(conflict => conflict.id);
    
    // Update each conflict in a transaction
    for (const conflictId of conflictIds) {
      const { error } = await supabase
        .from('leases')
        .update({ 
          status: AgreementStatus.CANCELLED,
          updated_at: new Date().toISOString()
        })
        .eq('id', conflictId);
        
      if (error) {
        console.error(`Failed to cancel conflicting agreement ${conflictId}:`, error);
        toast.error(`Failed to cancel a conflicting agreement. Please check the logs.`);
        return false;
      }
    }
    
    toast.success(`Cancelled ${conflicts.length} conflicting agreement(s)`);
    return true;
  } catch (err) {
    console.error("Error in resolveVehicleBookingConflicts:", err);
    toast.error("Failed to resolve vehicle booking conflicts");
    return false;
  }
};

/**
 * Performs a system-wide check and automatically resolves double-booked vehicles
 * For each vehicle with multiple active agreements, cancels all but the newest one
 * @returns Statistics about the conflicts found and resolved
 */
export const auditAndFixDoubleBookedVehicles = async () => {
  try {
    console.log("Starting system-wide double-booking audit...");
    
    // First, we'll find all distinct vehicle IDs that have leases
    const { data: vehiclesWithLeases, error: vehiclesError } = await supabase
      .from('leases')
      .select('vehicle_id')
      .not('vehicle_id', 'is', null)
      .order('vehicle_id');
    
    if (vehiclesError) {
      console.error("Error finding vehicles with leases:", vehiclesError);
      return { 
        success: false, 
        message: `Error finding vehicles with leases: ${vehiclesError.message}`,
        error: vehiclesError 
      };
    }
    
    if (!vehiclesWithLeases || vehiclesWithLeases.length === 0) {
      console.log("No vehicles with leases found");
      return {
        success: true,
        message: "No vehicles with leases found",
        vehiclesFixed: 0,
        agreementsCancelled: 0
      };
    }
    
    // Get unique vehicle IDs
    const vehicleIds = [...new Set(vehiclesWithLeases.map(v => v.vehicle_id))];
    console.log(`Found ${vehicleIds.length} unique vehicles with leases`);
    
    let agreementsCancelled = 0;
    let vehiclesFixed = 0;
    
    // For each vehicle, check if it has multiple active agreements
    for (const vehicleId of vehicleIds) {
      if (!vehicleId) continue; // Skip null vehicle IDs
      
      // Get all active agreements for this vehicle
      const { data: activeAgreements, error: agreementsError } = await supabase
        .from('leases')
        .select('id, agreement_number, created_at')
        .eq('vehicle_id', vehicleId)
        .eq('status', AgreementStatus.ACTIVE)
        .order('created_at', { ascending: false });
        
      if (agreementsError) {
        console.error(`Error fetching agreements for vehicle ${vehicleId}:`, agreementsError);
        continue;
      }
      
      if (!activeAgreements || activeAgreements.length <= 1) {
        // No conflict for this vehicle
        continue;
      }
      
      // Vehicle has multiple active agreements - keep newest, cancel others
      console.log(`Vehicle ${vehicleId} has ${activeAgreements.length} active agreements`);
      
      const newestAgreementId = activeAgreements[0].id;
      console.log(`Keeping newest agreement ${activeAgreements[0].agreement_number} (${newestAgreementId})`);
      
      // Cancel all other agreements
      const agreementsToCancel = activeAgreements.slice(1);
      for (const agreement of agreementsToCancel) {
        const { error: updateError } = await supabase
          .from('leases')
          .update({ 
            status: AgreementStatus.CANCELLED,
            updated_at: new Date().toISOString()
          })
          .eq('id', agreement.id);
          
        if (updateError) {
          console.error(`Failed to cancel agreement ${agreement.id}:`, updateError);
          continue;
        }
        
        console.log(`Cancelled agreement ${agreement.agreement_number} (${agreement.id})`);
        agreementsCancelled++;
      }
      
      vehiclesFixed++;
    }
    
    return {
      success: true,
      message: `Fixed ${vehiclesFixed} double-booked vehicles, cancelled ${agreementsCancelled} agreements`,
      vehiclesFixed,
      agreementsCancelled
    };
  } catch (err) {
    console.error("Error in auditAndFixDoubleBookedVehicles:", err);
    return { 
      success: false, 
      message: `Error fixing double-booked vehicles: ${err instanceof Error ? err.message : String(err)}` 
    };
  }
};
