
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/database-type-helpers';

/**
 * Fetches an agreement with associated customer data
 */
export async function fetchAgreementWithCustomer(agreementId: string) {
  try {
    const { data, error } = await supabase
      .from('leases')
      .select(`
        *,
        profiles:customer_id (*)
      `)
      .eq('id', agreementId)
      .single();
    
    if (error) {
      console.error('Error fetching agreement:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
    return null;
  }
}

/**
 * Fetches vehicle data by ID
 */
export async function fetchVehicle(vehicleId: string) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();
    
    if (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
    return null;
  }
}

/**
 * Updates payment lease_id references to point to a new agreement
 */
export async function updatePaymentsLeaseId(sourceId: string, targetId: string) {
  try {
    const { data, error } = await supabase
      .from('unified_payments')
      .update({ lease_id: targetId })
      .eq('lease_id', sourceId);
    
    if (error) {
      console.error('Error updating payments:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

/**
 * Processes response data for consistency
 */
export function processResponseData(response: any) {
  if (!hasData(response)) {
    return null;
  }
  
  return response.data;
}
