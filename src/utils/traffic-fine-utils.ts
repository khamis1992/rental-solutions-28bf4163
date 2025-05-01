
import { supabase } from '@/integrations/supabase/client';
import { TRAFFIC_FINE_PAYMENT_STATUSES, asTrafficFinePaymentStatus } from '@/types/database-common';
import { ServiceResponse, wrapOperation, hasResponseData } from '@/utils/response-handler';

/**
 * Fetches traffic fines with type-safe handling
 */
export async function fetchTrafficFines(options: { 
  licensePlate?: string;
  agreementId?: string;
  limit?: number;
  paymentStatus?: string;
} = {}): Promise<ServiceResponse<any[]>> {
  return wrapOperation(async () => {
    // Start building the query
    let query = supabase
      .from('traffic_fines')
      .select(`
        id,
        violation_number,
        license_plate,
        violation_date,
        fine_amount,
        violation_charge,
        payment_status,
        fine_location,
        lease_id,
        vehicle_id,
        payment_date
      `);
    
    // Apply filters if provided
    if (options.licensePlate) {
      query = query.eq('license_plate', options.licensePlate);
    }
    
    if (options.agreementId) {
      query = query.eq('lease_id', options.agreementId);
    }
    
    if (options.paymentStatus) {
      const safeStatus = asTrafficFinePaymentStatus(options.paymentStatus);
      query = query.eq('payment_status', safeStatus);
    }
    
    // Apply limit if provided
    if (options.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }
    
    // Execute the query
    const response = await query.order('violation_date', { ascending: false });
    
    if (response && !response.error && response.data) {
      return response.data;
    }
    
    throw new Error(`Error fetching traffic fines: ${response?.error?.message || 'Unknown error'}`);
  }, 'Fetching traffic fines');
}

/**
 * Updates a traffic fine's payment status
 */
export async function updateTrafficFinePaymentStatus(
  fineId: string, 
  status: string
): Promise<ServiceResponse<any>> {
  return wrapOperation(async () => {
    const safeStatus = asTrafficFinePaymentStatus(status);
    const response = await supabase
      .from('traffic_fines')
      .update({ 
        payment_status: safeStatus,
        ...(status === TRAFFIC_FINE_PAYMENT_STATUSES.PAID ? { payment_date: new Date().toISOString() } : {})
      })
      .eq('id', fineId)
      .select()
      .single();
      
    if (response && !response.error && response.data) {
      return response.data;
    }
    
    throw new Error(`Error updating traffic fine payment status: ${response?.error?.message || 'Unknown error'}`);
  }, 'Updating traffic fine payment status');
}

/**
 * Reassigns a traffic fine to a different agreement
 */
export async function reassignTrafficFine(
  fineId: string, 
  agreementId: string | null
): Promise<ServiceResponse<any>> {
  return wrapOperation(async () => {
    const response = await supabase
      .from('traffic_fines')
      .update({ 
        lease_id: agreementId,
        assignment_status: agreementId ? 'assigned' : 'pending'
      })
      .eq('id', fineId)
      .select()
      .single();
      
    if (response && !response.error && response.data) {
      return response.data;
    }
    
    throw new Error(`Error reassigning traffic fine: ${response?.error?.message || 'Unknown error'}`);
  }, 'Reassigning traffic fine');
}
