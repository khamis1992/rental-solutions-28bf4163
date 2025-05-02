
import { supabase } from '@/lib/supabase';
import { ServiceResponse } from '../response-handler';
import { withTimeoutAndRetry } from '../promise-utils';
import { hasResponseData, safeQueryToServiceResponse } from '../supabase-type-helpers';
import { VehicleAvailabilityResult, LEASE_STATUSES } from './types';

/**
 * Check if a vehicle is available to be assigned to an agreement
 * @param vehicleId The ID of the vehicle to check
 * @returns An object with availability info and any existing agreement details
 */
export async function checkVehicleAvailability(vehicleId: string): Promise<ServiceResponse<VehicleAvailabilityResult>> {
  return withTimeoutAndRetry(
    () => safeQueryToServiceResponse(
      async () => {
        // Check if vehicle exists and its status
        const vehicleResponse = await supabase
          .from('vehicles')
          .select('status')
          .eq('id', vehicleId)
          .single();

        if (!hasResponseData(vehicleResponse)) {
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
      }
    ),
    {
      operationName: "Vehicle availability check",
      timeoutMs: 5000
    }
  );
}
