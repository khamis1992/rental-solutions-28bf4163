
import { supabase } from '@/integrations/supabase/client';
import { asTrafficFinePaymentStatus, isValidResponse } from './supabase-helpers';

/**
 * Fetches traffic fines with type-safe handling
 */
export async function fetchTrafficFines(options: { 
  licensePlate?: string;
  agreementId?: string;
  limit?: number;
  paymentStatus?: string;
} = {}) {
  try {
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
    
    if (isValidResponse(response)) {
      return response.data;
    }
    
    console.error('Error fetching traffic fines:', response.error);
    return null;
  } catch (error) {
    console.error('Unexpected error while fetching traffic fines:', error);
    return null;
  }
}

/**
 * Updates a traffic fine's payment status
 */
export async function updateTrafficFinePaymentStatus(fineId: string, status: string) {
  try {
    const safeStatus = asTrafficFinePaymentStatus(status);
    const response = await supabase
      .from('traffic_fines')
      .update({ 
        payment_status: safeStatus,
        ...(status === 'paid' ? { payment_date: new Date().toISOString() } : {})
      })
      .eq('id', fineId)
      .select()
      .single();
      
    if (isValidResponse(response)) {
      return response.data;
    }
    
    console.error('Error updating traffic fine payment status:', response.error);
    return null;
  } catch (error) {
    console.error('Unexpected error while updating traffic fine payment status:', error);
    return null;
  }
}

/**
 * Reassigns a traffic fine to a different agreement
 */
export async function reassignTrafficFine(fineId: string, agreementId: string | null) {
  try {
    const response = await supabase
      .from('traffic_fines')
      .update({ 
        lease_id: agreementId,
        assignment_status: agreementId ? 'assigned' : 'pending'
      })
      .eq('id', fineId)
      .select()
      .single();
      
    if (isValidResponse(response)) {
      return response.data;
    }
    
    console.error('Error reassigning traffic fine:', response.error);
    return null;
  } catch (error) {
    console.error('Unexpected error while reassigning traffic fine:', error);
    return null;
  }
}
