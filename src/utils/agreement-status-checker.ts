
import { supabase } from '@/lib/supabase';

export const checkAndUpdateConflictingAgreements = async () => {
  try {
    console.log("Running agreement conflict check");
    
    // Look for vehicles with multiple active agreements
    const { data: conflictingVehicles, error: conflictError } = await supabase
      .from('leases')
      .select('vehicle_id, count(*)')
      .eq('status', 'active')
      .groupBy('vehicle_id')
      .having('count(*)', 'gt', 1);
      
    if (conflictError) {
      return {
        success: false,
        message: `Error checking for conflicts: ${conflictError.message}`,
        conflicts: 0
      };
    }
    
    if (!conflictingVehicles || conflictingVehicles.length === 0) {
      return {
        success: true,
        message: "No conflicting agreements found",
        conflicts: 0
      };
    }
    
    console.log(`Found ${conflictingVehicles.length} vehicles with multiple active agreements`);
    
    let resolvedCount = 0;
    
    // For each vehicle with multiple agreements, find the most recent one and keep it active
    for (const conflict of conflictingVehicles) {
      const { vehicle_id } = conflict;
      
      // Get all active agreements for this vehicle
      const { data: agreements, error: agreementsError } = await supabase
        .from('leases')
        .select('id, created_at')
        .eq('vehicle_id', vehicle_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
        
      if (agreementsError || !agreements || agreements.length <= 1) {
        console.error(`Error retrieving agreements for vehicle ${vehicle_id}:`, agreementsError);
        continue;
      }
      
      // Keep the first one (most recent) active, mark others as superseded
      const [latestAgreement, ...olderAgreements] = agreements;
      
      for (const agreement of olderAgreements) {
        const { error: updateError } = await supabase
          .from('leases')
          .update({ status: 'superseded' })
          .eq('id', agreement.id);
          
        if (!updateError) {
          resolvedCount++;
        }
      }
    }
    
    return {
      success: true,
      message: `Resolved ${resolvedCount} conflicting agreements`,
      conflicts: resolvedCount
    };
    
  } catch (error) {
    console.error("Error in checkAndUpdateConflictingAgreements:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      conflicts: 0
    };
  }
};

// Define runAgreementStatusMaintenance first
export const runAgreementStatusMaintenance = async () => {
  try {
    console.log("Running agreement status maintenance");
    
    // Check for conflicting vehicle assignments
    const conflictResult = await checkAndUpdateConflictingAgreements();
    
    if (!conflictResult.success) {
      return {
        success: false,
        message: `Failed to check conflicting agreements: ${conflictResult.message}`,
        error: conflictResult
      };
    }
    
    return {
      success: true,
      message: conflictResult.message
    };
  } catch (error) {
    console.error("Error in runAgreementStatusMaintenance:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
};

// Add this for compatibility with existing imports
export const runAgreementStatusCheck = runAgreementStatusMaintenance;
