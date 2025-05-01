
import { supabase } from '@/integrations/supabase/client';
import { 
  handleSupabaseResponse, 
  asLeaseStatus, 
  asVehicleStatus, 
  AGREEMENT_STATUSES, 
  isValidResponse 
} from './supabase-helpers';

/**
 * Safely finds a lease by ID
 */
export async function findLeaseById(leaseId: string) {
  try {
    const { data, error } = await supabase
      .from('leases')
      .select('*')
      .eq('id', leaseId)
      .single();
      
    return handleSupabaseResponse({ data, error });
  } catch (error) {
    console.error('Error finding lease:', error);
    return null;
  }
}

/**
 * Safely finds vehicles
 */
export async function findAvailableVehicles() {
  try {
    const availableStatus = asVehicleStatus('available');
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', availableStatus);
      
    return handleSupabaseResponse({ data, error }) || [];
  } catch (error) {
    console.error('Error finding vehicles:', error);
    return [];
  }
}

/**
 * Safely updates an agreement status
 */
export async function updateAgreementStatus(agreementId: string, status: string) {
  try {
    const safeStatus = asLeaseStatus(status);
    const { data, error } = await supabase
      .from('leases')
      .update({ status: safeStatus, updated_at: new Date() })
      .eq('id', agreementId)
      .select()
      .single();
      
    return handleSupabaseResponse({ data, error });
  } catch (error) {
    console.error('Error updating agreement status:', error);
    return null;
  }
}

/**
 * Safely closes an existing agreement for a vehicle before assigning it to a new one
 */
export async function closeExistingVehicleAgreements(vehicleId: string) {
  try {
    const activeStatus = asLeaseStatus(AGREEMENT_STATUSES.ACTIVE);
    const closedStatus = asLeaseStatus(AGREEMENT_STATUSES.CLOSED);
    
    // Find all active agreements for the vehicle
    const { data: activeAgreements, error: findError } = await supabase
      .from('leases')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', activeStatus);
      
    const safeActiveAgreements = handleSupabaseResponse({ data: activeAgreements, error: findError });
    if (!safeActiveAgreements || safeActiveAgreements.length === 0) {
      return { success: true, count: 0 };
    }
    
    // Close all found agreements
    const { data: updatedAgreements, error: updateError } = await supabase
      .from('leases')
      .update({ 
        status: closedStatus, 
        updated_at: new Date(),
        end_date: new Date()
      })
      .eq('vehicle_id', vehicleId)
      .eq('status', activeStatus)
      .select();
      
    const safeUpdatedAgreements = handleSupabaseResponse({ data: updatedAgreements, error: updateError });
    
    return { 
      success: !updateError, 
      count: safeUpdatedAgreements?.length || 0,
      agreements: safeUpdatedAgreements
    };
  } catch (error) {
    console.error('Error closing existing vehicle agreements:', error);
    return { success: false, error };
  }
}

/**
 * Safely updates a vehicle status
 */
export async function updateVehicleStatus(vehicleId: string, status: string) {
  try {
    const safeStatus = asVehicleStatus(status);
    const { data, error } = await supabase
      .from('vehicles')
      .update({ status: safeStatus, updated_at: new Date() })
      .eq('id', vehicleId)
      .select()
      .single();
      
    return handleSupabaseResponse({ data, error });
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    return null;
  }
}

/**
 * Safely fetches data with proper error handling
 */
export async function safeDataFetch<T>(
  query: () => Promise<{ data: T | null; error: any }>,
  errorMessage: string
): Promise<T | null> {
  try {
    const response = await query();
    if (response.error) {
      console.error(errorMessage, response.error);
      return null;
    }
    return response.data;
  } catch (error) {
    console.error(errorMessage, error);
    return null;
  }
}
