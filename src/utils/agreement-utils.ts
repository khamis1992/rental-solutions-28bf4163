
import { supabase } from '@/lib/supabase';
import { ServiceResponse, wrapOperation, hasResponseData } from '@/utils/response-handler';
import { withTimeout, chainOperations } from '@/utils/promise-utils';
import { LEASE_STATUSES, VEHICLE_STATUSES } from '@/types/database-common';
import { hasResponseData as hasSupabaseData, safeQueryToServiceResponse } from '@/utils/supabase-type-helpers';

/**
 * Check if a vehicle is available to be assigned to an agreement
 * @param vehicleId The ID of the vehicle to check
 * @returns An object with availability info and any existing agreement details
 */
export async function checkVehicleAvailability(vehicleId: string): Promise<ServiceResponse<{
  isAvailable: boolean;
  existingAgreement?: any;
  error?: string;
}>> {
  return safeQueryToServiceResponse(
    async () => {
      // Check if vehicle exists and its status
      const vehicleResponse = await supabase
        .from('vehicles')
        .select('status')
        .eq('id', vehicleId)
        .single();

      if (!hasSupabaseData(vehicleResponse)) {
        return {
          data: {
            isAvailable: false,
            error: 'Vehicle not found'
          },
          error: null
        };
      }

      // Check if vehicle is already assigned to an active agreement
      const agreementResponse = await supabase
        .from('leases')
        .select('id, agreement_number, customer_id')
        .eq('vehicle_id', vehicleId)
        .eq('status', LEASE_STATUSES.ACTIVE)
        .single();

      if (agreementResponse.error) {
        // PGRST116 is "no rows returned" which means no active agreement
        if (agreementResponse.error.code === 'PGRST116') {
          return {
            data: {
              isAvailable: true
            },
            error: null
          };
        }
        
        // Any other error is a problem
        console.error("Error checking vehicle availability:", agreementResponse.error);
        return {
          data: {
            isAvailable: false,
            error: 'Error checking vehicle availability'
          },
          error: null
        };
      }

      // Vehicle is assigned to an active agreement
      return {
        data: {
          isAvailable: false,
          existingAgreement: agreementResponse.data
        },
        error: null
      };
    },
    'Checking vehicle availability'
  );
}

/**
 * Activate an agreement and update vehicle status
 * @param agreementId The agreement ID to activate
 * @param vehicleId The vehicle ID to associate with this agreement
 * @returns Result of the activation operation
 */
export async function activateAgreement(
  agreementId: string, 
  vehicleId: string
): Promise<ServiceResponse<{
  success: boolean;
  message: string;
}>> {
  return wrapOperation(async () => {
    // Check if there's an existing active agreement for this vehicle
    const availabilityResult = await checkVehicleAvailability(vehicleId);
    
    if (!availabilityResult.success) {
      return {
        success: false,
        message: availabilityResult.message || 'Failed to check vehicle availability'
      };
    }
    
    const availabilityData = availabilityResult.data;

    // If vehicle is already assigned to another active agreement, close it first
    if (!availabilityData.isAvailable && availabilityData.existingAgreement && availabilityData.existingAgreement.id !== agreementId) {
      console.log(`Vehicle is assigned to agreement #${availabilityData.existingAgreement.agreement_number}, closing it before reassigning`);
      
      // Set the previous agreement to closed status
      const closeResponse = await supabase
        .from('leases')
        .update({ status: LEASE_STATUSES.CLOSED })
        .eq('id', availabilityData.existingAgreement.id);
        
      if (closeResponse.error) {
        console.error("Error closing previous agreement:", closeResponse.error);
        return {
          success: false,
          message: 'Failed to close previous agreement for this vehicle'
        };
      }
    }
    
    // Update vehicle status to "rented"
    const vehicleResponse = await supabase
      .from('vehicles')
      .update({ status: VEHICLE_STATUSES.RENTED })
      .eq('id', vehicleId);
      
    if (vehicleResponse.error) {
      console.error("Error updating vehicle status:", vehicleResponse.error);
      return {
        success: false,
        message: 'Failed to update vehicle status'
      };
    }
    
    // Set the agreement status to active
    const agreementResponse = await supabase
      .from('leases')
      .update({ 
        status: LEASE_STATUSES.ACTIVE,
        vehicle_id: vehicleId
      })
      .eq('id', agreementId);
    
    if (agreementResponse.error) {
      console.error("Error activating agreement:", agreementResponse.error);
      return {
        success: false,
        message: 'Failed to activate agreement'
      };
    }
    
    return {
      success: true,
      message: 'Agreement activated successfully'
    };
  }, 'Activating agreement');
}

/**
 * Update an agreement with validation and vehicle availability checks
 * @param id The agreement ID to update
 * @param data The agreement data
 * @returns Result of the update operation
 */
export async function updateAgreementWithCheck(
  id: string, 
  data: any
): Promise<ServiceResponse<any>> {
  return wrapOperation(async () => {
    // Check if vehicle is available or already assigned to this agreement
    const vehicleId = data.vehicle_id;
    
    if (vehicleId) {
      // Check if the vehicle is already assigned to this agreement
      const currentAgreementResponse = await supabase
        .from('leases')
        .select('vehicle_id')
        .eq('id', id)
        .single();

      if (hasResponseData(currentAgreementResponse)) {
        // If the vehicle is changing, check availability
        if (currentAgreementResponse.data.vehicle_id !== vehicleId) {
          const availabilityResult = await checkVehicleAvailability(vehicleId);
          
          // If the vehicle is not available and assigned to a different agreement
          if (availabilityResult.success && 
              availabilityResult.data && 
              !availabilityResult.data.isAvailable && 
              availabilityResult.data.existingAgreement) {
            // We need to handle this case in the UI - return the availability result
            return { 
              availabilityResult: availabilityResult.data,
              needsConfirmation: true,
              message: 'Vehicle is currently assigned to another agreement'
            };
          }
        }
      }
    }

    // All checks passed, proceed with update
    const updatedAgreementResponse = await supabase
      .from('leases')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (!hasResponseData(updatedAgreementResponse)) {
      throw new Error(`Failed to update agreement: ${updatedAgreementResponse.error?.message}`);
    }

    return updatedAgreementResponse.data;
  }, 'Updating agreement');
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

/**
 * Generate payment schedule for an agreement
 * @param agreement The agreement data
 * @returns Result of the payment schedule generation
 */
export async function generatePaymentSchedule(agreement: any): Promise<ServiceResponse<any>> {
  return wrapOperation(async () => {
    // Implementation logic goes here
    const result = { /* calculation result */ };
    return result;
  }, 'Generating payment schedule');
}

/**
 * Force generate payment for an agreement with timeout protection
 * @param agreement The agreement data
 * @returns Result of the payment generation operation
 */
export async function forceGeneratePaymentForAgreement(agreement: any): Promise<ServiceResponse<any>> {
  // Use withTimeout to handle potential long-running operations
  return withTimeout(
    generatePaymentSchedule(agreement),
    8000,
    'Payment generation'
  );
}

/**
 * Generate payment for an agreement by ID
 * @param agreementId The agreement ID to generate payment for
 * @returns Result of the payment generation operation
 */
export async function generatePaymentForAgreement(agreementId: string): Promise<ServiceResponse<any>> {
  // Use our new composition pattern to simplify the flow
  return chainOperations(
    // First operation: fetch the agreement
    safeQueryToServiceResponse(
      () => supabase
        .from('leases')
        .select('*')
        .eq('id', agreementId)
        .single(),
      'Fetching agreement for payment generation'
    ),
    // Second operation: generate payment with the fetched agreement
    (agreement) => forceGeneratePaymentForAgreement(agreement)
  );
}
