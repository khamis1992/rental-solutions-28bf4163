
import { supabase } from '@/integrations/supabase/client';
import { LEASE_STATUSES, VEHICLE_STATUSES } from '@/types/database-common';
import { ServiceResponse, wrapOperation } from '@/utils/response-handler';

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
      
    if (response && !response.error && response.data) {
      return response.data;
    }
    
    throw new Error(`Lease not found: ${response?.error?.message}`);
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
      
    if (response && !response.error && response.data) {
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
        status: status,
        updated_at: new Date() 
      })
      .eq('id', agreementId)
      .select()
      .single();
      
    if (response && !response.error && response.data) {
      return response.data;
    }
    
    throw new Error(`Failed to update agreement status: ${response?.error?.message}`);
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
}>> {
  return wrapOperation(async () => {
    // Find all active agreements for the vehicle
    const findResponse = await supabase
      .from('leases')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', LEASE_STATUSES.ACTIVE);
      
    if (!findResponse?.data || findResponse.error || findResponse.data.length === 0) {
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
      
    if (updateResponse.error || !updateResponse.data) {
      throw new Error(`Failed to close agreements: ${updateResponse?.error?.message}`);
    }
    
    return { 
      success: true, 
      count: updateResponse.data?.length || 0,
      agreements: updateResponse.data
    };
  }, 'Closing vehicle agreements');
}

/**
 * Checks if a vehicle is available for assignment
 */
export async function checkVehicleAvailability(
  vehicleId: string
): Promise<ServiceResponse<{ 
  isAvailable: boolean; 
  existingAgreement?: any; 
  error?: string; 
}>> {
  return wrapOperation(async () => {
    // Check if the vehicle exists
    const vehicleResponse = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicleId)
      .single();
      
    if (vehicleResponse.error) {
      return {
        isAvailable: false,
        error: `Vehicle not found: ${vehicleResponse.error.message}`
      };
    }
    
    // Check if vehicle is already assigned to an agreement
    const agreementResponse = await supabase
      .from('leases')
      .select('id, agreement_number, customer_id, start_date, end_date')
      .eq('vehicle_id', vehicleId)
      .eq('status', LEASE_STATUSES.ACTIVE)
      .single();
      
    // If no active agreement, vehicle is available
    if (agreementResponse.error && agreementResponse.error.code === 'PGRST116') {
      return { isAvailable: true };
    }
    
    // If there's an active agreement, return details
    if (!agreementResponse.error && agreementResponse.data) {
      return {
        isAvailable: false,
        existingAgreement: agreementResponse.data,
        error: 'Vehicle is currently assigned to an active agreement'
      };
    }
    
    // If any other error, handle it
    return {
      isAvailable: false,
      error: agreementResponse.error ? agreementResponse.error.message : 'Unknown error checking agreement'
    };
  }, 'Checking vehicle availability');
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
        status: status,
        updated_at: new Date() 
      })
      .eq('id', vehicleId)
      .select()
      .single();
      
    if (response && !response.error && response.data) {
      return response.data;
    }
    
    throw new Error(`Failed to update vehicle status: ${response?.error?.message}`);
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
    
    if (response.error || !response.data) {
      throw new Error(`${errorMessage}: ${response.error?.message || 'Unknown error'}`);
    }
    
    return response.data;
  }, errorMessage);
}
