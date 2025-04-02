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
    
    // First, find all vehicles that have more than one active agreement
    const { data: doubleBookedVehiclesResult, error: queryError } = await supabase
      .from('leases')
      .select('vehicle_id, count')
      .eq('status', AgreementStatus.ACTIVE)
      .select('vehicle_id, count(*)')
      .eq('status', AgreementStatus.ACTIVE)
      .having('count.count', 'gt', 1)
      .execute();
    
    // Extract the double-booked vehicles from the result
    const doubleBookedVehicles = doubleBookedVehiclesResult?.data || [];
      
    if (queryError) {
      console.error("Error finding double-booked vehicles:", queryError);
      return { 
        success: false, 
        message: `Error finding double-booked vehicles: ${queryError.message}` 
      };
    }
    
    console.log(`Found ${doubleBookedVehicles?.length || 0} vehicles with multiple active agreements`);
    
    if (!doubleBookedVehicles || doubleBookedVehicles.length === 0) {
      return {
        success: true,
        message: "No double-booked vehicles found",
        vehiclesFixed: 0,
        agreementsCancelled: 0
      };
    }
    
    let agreementsCancelled = 0;
    let vehiclesFixed = 0;
    
    // For each double-booked vehicle
    for (const vehicle of doubleBookedVehicles) {
      const vehicleId = vehicle.vehicle_id;
      
      // Get all active agreements for this vehicle, ordered by created date (newest first)
      const { data: agreements, error: agreementsError } = await supabase
        .from('leases')
        .select('id, agreement_number, created_at')
        .eq('vehicle_id', vehicleId)
        .eq('status', AgreementStatus.ACTIVE)
        .order('created_at', { ascending: false });
        
      if (agreementsError) {
        console.error(`Error fetching agreements for vehicle ${vehicleId}:`, agreementsError);
        continue;
      }
      
      if (!agreements || agreements.length <= 1) {
        console.log(`Expected multiple agreements for vehicle ${vehicleId} but found ${agreements?.length || 0}`);
        continue;
      }
      
      // Keep the newest agreement, cancel all others
      const newestAgreementId = agreements[0].id;
      console.log(`Keeping newest agreement ${agreements[0].agreement_number} (${newestAgreementId}) for vehicle ${vehicleId}`);
      
      // Cancel all other agreements
      const agreementsToCancel = agreements.slice(1);
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
