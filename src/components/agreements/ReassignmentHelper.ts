
import { supabase } from '@/integrations/supabase/client';
import { 
  asLeaseIdColumn, 
  asTableId, 
  asVehicleId,
  hasData
} from '@/utils/database-type-helpers';

/**
 * Helper functions for the ReassignmentWizard component to ensure type-safe database operations
 */

/**
 * Safely fetch agreement data with profile information
 */
export async function fetchAgreementWithCustomer(id: string) {
  const { data, error } = await supabase
    .from('leases')
    .select(`
      *,
      profiles: customers (*)
    `)
    .eq('id', asTableId('leases', id))
    .single();

  if (error) {
    console.error('Error fetching agreement:', error);
    return null;
  }

  return data;
}

/**
 * Safely fetch vehicle data
 */
export async function fetchVehicle(id: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', asVehicleId(id))
    .single();

  if (error) {
    console.error('Error fetching vehicle:', error);
    return null;
  }

  return data;
}

/**
 * Safely update payments with new lease ID
 */
export async function updatePaymentsLeaseId(oldLeaseId: string, newLeaseId: string) {
  const { error } = await supabase
    .from('unified_payments')
    .update({ lease_id: asLeaseIdColumn(newLeaseId) })
    .eq('lease_id', asLeaseIdColumn(oldLeaseId));

  if (error) {
    console.error('Error updating payments:', error);
    return false;
  }
  
  return true;
}

/**
 * Type safe response processing
 */
export function processResponseData<T>(response: any): T | null {
  if (!hasData(response)) {
    return null;
  }
  
  return response.data as T;
}
