
import { supabase } from '@/integrations/supabase/client';
import { asLeaseStatus, asVehicleStatus } from './supabase-helpers';

/**
 * Check if a vehicle is available to be assigned to an agreement
 * @param vehicleId The ID of the vehicle to check
 * @returns An object with availability info and any existing agreement details
 */
export async function checkVehicleAvailability(vehicleId: string) {
  try {
    // Check if vehicle exists and its status
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicleId)
      .single();

    if (vehicleError) {
      return {
        isAvailable: false,
        error: 'Vehicle not found'
      };
    }

    // Check if vehicle is already assigned to an active agreement
    const { data: existingAgreement, error: agreementError } = await supabase
      .from('leases')
      .select('id, agreement_number, customer_id')
      .eq('vehicle_id', vehicleId)
      .eq('status', asLeaseStatus('active'))
      .single();

    if (agreementError && agreementError.code !== 'PGRST116') {
      // Only consider it an error if it's not "no rows returned"
      console.error("Error checking vehicle availability:", agreementError);
      return {
        isAvailable: false,
        error: 'Error checking vehicle availability'
      };
    }

    if (existingAgreement) {
      // Vehicle is assigned to an active agreement
      return {
        isAvailable: false,
        existingAgreement
      };
    }

    // Vehicle is available
    return {
      isAvailable: true
    };
  } catch (error) {
    console.error("Error checking vehicle availability:", error);
    return {
      isAvailable: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Activate an agreement and update vehicle status
 * @param agreementId The agreement ID to activate
 * @param vehicleId The vehicle ID to associate with this agreement
 * @returns Result of the activation operation
 */
export async function activateAgreement(agreementId: string, vehicleId: string) {
  try {
    // Check if there's an existing active agreement for this vehicle
    const { isAvailable, existingAgreement, error: availabilityError } = 
      await checkVehicleAvailability(vehicleId);
    
    if (availabilityError) {
      return {
        success: false,
        error: availabilityError,
        message: 'Failed to check vehicle availability'
      };
    }

    // If vehicle is already assigned to another active agreement, close it first
    if (!isAvailable && existingAgreement && existingAgreement.id !== agreementId) {
      console.log(`Vehicle is assigned to agreement #${existingAgreement.agreement_number}, closing it before reassigning`);
      
      // Set the previous agreement to closed status
      const { error: closeError } = await supabase
        .from('leases')
        .update({ status: asLeaseStatus('closed') })
        .eq('id', existingAgreement.id);
        
      if (closeError) {
        console.error("Error closing previous agreement:", closeError);
        return {
          success: false,
          error: closeError,
          message: 'Failed to close previous agreement for this vehicle'
        };
      }
    }
    
    // Update vehicle status to "rented"
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: asVehicleStatus('rented') })
      .eq('id', vehicleId);
      
    if (vehicleError) {
      console.error("Error updating vehicle status:", vehicleError);
      return {
        success: false,
        error: vehicleError,
        message: 'Failed to update vehicle status'
      };
    }
    
    // Set the agreement status to active
    const { error: agreementError } = await supabase
      .from('leases')
      .update({ 
        status: asLeaseStatus('active'),
        vehicle_id: vehicleId
      })
      .eq('id', agreementId);
    
    if (agreementError) {
      console.error("Error activating agreement:", agreementError);
      return {
        success: false,
        error: agreementError,
        message: 'Failed to activate agreement'
      };
    }
    
    // Generate payment schedules - this would be handled by the imported function in agreement-submission.ts
    
    return {
      success: true,
      message: 'Agreement activated successfully'
    };
  } catch (error) {
    console.error("Error activating agreement:", error);
    return {
      success: false,
      error,
      message: 'An unexpected error occurred while activating agreement'
    };
  }
}

/**
 * Update an agreement with validation and vehicle availability checks
 * @param id The agreement ID to update
 * @param data The agreement data
 * @returns Result of the update operation
 */
export async function updateAgreementWithCheck(id: string, data: any) {
  try {
    // Check if vehicle is available or already assigned to this agreement
    const vehicleId = data.vehicle_id;
    
    if (vehicleId) {
      // Check if the vehicle is already assigned to this agreement
      const { data: currentAgreement } = await supabase
        .from('leases')
        .select('vehicle_id')
        .eq('id', id)
        .single();

      // If the vehicle is changing, check availability
      if (currentAgreement && currentAgreement.vehicle_id !== vehicleId) {
        const availabilityResult = await checkVehicleAvailability(vehicleId);
        
        // If the vehicle is not available and assigned to a different agreement
        if (!availabilityResult.isAvailable && availabilityResult.existingAgreement) {
          // We need to handle this case in the UI - return the availability result
          return { 
            success: false,
            availabilityResult,
            message: 'Vehicle is currently assigned to another agreement'
          };
        }
      }
    }

    // All checks passed, proceed with update
    const { data: updatedAgreement, error } = await supabase
      .from('leases')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error,
        message: 'Failed to update agreement'
      };
    }

    // After updating, check if we need to generate payment schedules
    if (data.status === 'active') {
      // Generate payment schedules - this would be a separate function
      // await generatePaymentSchedules(id);
    }

    return {
      success: true,
      data: updatedAgreement
    };
  } catch (error) {
    console.error("Error updating agreement:", error);
    return {
      success: false,
      error,
      message: 'An unexpected error occurred'
    };
  }
}

/**
 * Adapts a simplified agreement object to a full agreement object with related data
 */
export function adaptSimpleToFullAgreement(simpleAgreement: any) {
  return {
    ...simpleAgreement,
    customer: simpleAgreement.customers || {
      id: simpleAgreement.customer_id,
      full_name: simpleAgreement.customer_name || 'N/A'
    },
    vehicle: simpleAgreement.vehicles || {
      id: simpleAgreement.vehicle_id,
      license_plate: simpleAgreement.license_plate || 'N/A',
      make: simpleAgreement.vehicle_make || '',
      model: simpleAgreement.vehicle_model || ''
    }
  };
}
