
import { supabase } from '@/integrations/supabase/client';
import { LEASE_STATUSES, VEHICLE_STATUSES } from '@/types/database-common';
import { ServiceResponse, wrapOperation, hasResponseData } from '@/utils/response-handler';

/**
 * Safely finds a lease by ID
 */
export async function findLeaseById(leaseId: string): Promise<ServiceResponse<any>> {
  return wrapOperation(async () => {
    const response = await supabase
      .from('leases')
      .select('*')
      .eq('id', leaseId)
      .single();
      
    if (hasResponseData(response)) {
      return response.data;
    }
    
    throw new Error(`Lease not found: ${response.error?.message}`);
  }, 'Finding lease');
}

/**
 * Safely finds available vehicles
 */
export async function findAvailableVehicles(): Promise<ServiceResponse<any[]>> {
  return wrapOperation(async () => {
    const response = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', VEHICLE_STATUSES.AVAILABLE);
      
    if (hasResponseData(response)) {
      return response.data;
    }
    
    return [];
  }, 'Finding available vehicles');
}

/**
 * Safely updates an agreement status
 */
export async function updateAgreementStatus(
  agreementId: string, 
  status: string
): Promise<ServiceResponse<any>> {
  return wrapOperation(async () => {
    const response = await supabase
      .from('leases')
      .update({ 
        status: status, // Using string literal directly as we're standardizing to constants elsewhere
        updated_at: new Date() 
      })
      .eq('id', agreementId)
      .select()
      .single();
      
    if (hasResponseData(response)) {
      return response.data;
    }
    
    throw new Error(`Failed to update agreement status: ${response.error?.message}`);
  }, 'Updating agreement status');
}

/**
 * Safely closes an existing agreement for a vehicle before assigning it to a new one
 */
export async function closeExistingVehicleAgreements(
  vehicleId: string
): Promise<ServiceResponse<{
  success: boolean;
  count: number;
  agreements?: any[];
  error?: any;
}>> {
  return wrapOperation(async () => {
    // Find all active agreements for the vehicle
    const findResponse = await supabase
      .from('leases')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', LEASE_STATUSES.ACTIVE);
      
    if (!hasResponseData(findResponse) || findResponse.data.length === 0) {
      return { success: true, count: 0 };
    }
    
    // Close all found agreements
    const updateResponse = await supabase
      .from('leases')
      .update({ 
        status: LEASE_STATUSES.CLOSED, 
        updated_at: new Date(),
        end_date: new Date()
      })
      .eq('vehicle_id', vehicleId)
      .eq('status', LEASE_STATUSES.ACTIVE)
      .select();
      
    if (!hasResponseData(updateResponse)) {
      throw new Error(`Failed to close agreements: ${updateResponse.error?.message}`);
    }
    
    return { 
      success: true, 
      count: updateResponse.data?.length || 0,
      agreements: updateResponse.data
    };
  }, 'Closing vehicle agreements');
}

/**
 * Safely updates a vehicle status
 */
export async function updateVehicleStatus(
  vehicleId: string, 
  status: string
): Promise<ServiceResponse<any>> {
  return wrapOperation(async () => {
    const response = await supabase
      .from('vehicles')
      .update({ 
        status: status, // Using string literal directly as we're standardizing to constants elsewhere
        updated_at: new Date() 
      })
      .eq('id', vehicleId)
      .select()
      .single();
      
    if (hasResponseData(response)) {
      return response.data;
    }
    
    throw new Error(`Failed to update vehicle status: ${response.error?.message}`);
  }, 'Updating vehicle status');
}

/**
 * Safely fetches data with proper error handling
 */
export async function safeDataFetch<T>(
  query: () => Promise<{ data: T | null; error: any }>,
  errorMessage: string
): Promise<ServiceResponse<T>> {
  return wrapOperation(async () => {
    const response = await query();
    
    if (!hasResponseData(response)) {
      throw new Error(`${errorMessage}: ${response.error?.message || 'Unknown error'}`);
    }
    
    return response.data;
  }, errorMessage);
}
