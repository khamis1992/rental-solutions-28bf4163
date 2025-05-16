
import { supabase } from '@/lib/supabase';

/**
 * Checks if a vehicle is available or already assigned to an active agreement
 */
export const checkVehicleAvailability = async (vehicleId: string) => {
  try {
    console.log("Checking availability for vehicle:", vehicleId);
    
    // Check if the vehicle is already assigned to an active agreement
    const { data: activeAgreements, error } = await supabase
      .from('leases')
      .select('id, agreement_number, customer_id, status')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .limit(1);
      
    if (error) {
      console.error("Error checking vehicle availability:", error);
      return { 
        isAvailable: false, 
        error: error.message,
        existingAgreement: null 
      };
    }
    
    const isAvailable = !activeAgreements || activeAgreements.length === 0;
    let existingAgreement = null;
    
    if (!isAvailable && activeAgreements && activeAgreements.length > 0) {
      existingAgreement = activeAgreements[0];
      console.log("Vehicle is already assigned to agreement:", existingAgreement.agreement_number);
    }
    
    return {
      isAvailable,
      existingAgreement,
      vehicleId
    };
  } catch (error) {
    console.error("Error in checkVehicleAvailability:", error);
    return { 
      isAvailable: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred",
      existingAgreement: null 
    };
  }
};
