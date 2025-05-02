
import { supabase } from '@/lib/supabase';
import { ServiceResponse, wrapOperation } from '../response-handler';
import { withTimeoutAndRetry, withTimeout } from '../promise-utils';
import { hasResponseData } from '../supabase-type-helpers';
import { ActivationResult, LEASE_STATUSES } from './types';
import { VEHICLE_STATUSES } from '@/types/database-common';
import { checkVehicleAvailability } from './availability';

/**
 * Activate an agreement and update vehicle status
 * @param agreementId The agreement ID to activate
 * @param vehicleId The vehicle ID to associate with this agreement
 * @returns Result of the activation operation
 */
export async function activateAgreement(
  agreementId: string, 
  vehicleId: string
): Promise<ServiceResponse<ActivationResult>> {
  return withTimeoutAndRetry(
    () => wrapOperation(async () => {
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
    }),
    {
      operationName: "Agreement activation",
      timeoutMs: 15000,
      retries: 1
    }
  );
}

/**
 * Update an agreement with validation and vehicle availability checks
 * @param params Update parameters containing id and data
 * @param userId Optional user ID for tracking who made the update
 * @param onSuccess Optional callback for successful updates
 * @param onError Optional callback for errors
 * @param onStatusUpdate Optional callback for status updates
 * @returns Result of the update operation
 */
export async function updateAgreementWithCheck(
  params: { id: string, data: any },
  userId?: string,
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void,
  onStatusUpdate?: (status: string) => void
): Promise<ServiceResponse<any>> {
  const { id, data } = params;

  // Use our timeout utility wrapped around the core operation
  return withTimeout(
    (async () => {
      try {
        if (onStatusUpdate) onStatusUpdate("Checking vehicle availability...");
        
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
              if (onStatusUpdate) onStatusUpdate("Verifying new vehicle assignment...");
              
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

        if (onStatusUpdate) onStatusUpdate("Saving agreement changes...");

        // If tracking user, add updated_by field
        const updateData = userId ? { ...data, updated_by: userId } : data;

        // All checks passed, proceed with update
        const updatedAgreementResponse = await supabase
          .from('leases')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (!hasResponseData(updatedAgreementResponse)) {
          const error = new Error(`Failed to update agreement: ${updatedAgreementResponse.error?.message}`);
          if (onError) onError(error);
          throw error;
        }

        if (onStatusUpdate) onStatusUpdate("Agreement updated successfully");
        if (onSuccess) onSuccess(updatedAgreementResponse.data);
        
        return updatedAgreementResponse.data;
      } catch (error) {
        console.error("Error in updateAgreementWithCheck:", error);
        if (onError) onError(error);
        throw error;
      }
    })(),
    30000, // 30 second timeout
    "Agreement update"
  );
}
