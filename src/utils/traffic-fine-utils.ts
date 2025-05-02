
import { supabase } from '@/integrations/supabase/client';
import { TRAFFIC_FINE_PAYMENT_STATUSES, asTrafficFinePaymentStatus } from '@/types/database-common';
import { ServiceResponse, wrapOperation, hasResponseData } from '@/utils/response-handler';
import { validateFineDate } from '@/hooks/traffic-fines/use-traffic-fine-validation';
import { fuzzyMatchLicensePlates, normalizeLicensePlate } from '@/utils/searchUtils';

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
      const normalizedPlate = normalizeLicensePlate(options.licensePlate);
      query = query.eq('license_plate', normalizedPlate);
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
 * Finds leases that match a violation date using the correct date comparison approach
 */
export async function findLeasesByViolationDate(
  vehicleId: string, 
  violationDate: Date | string
): Promise<ServiceResponse<any[]>> {
  return wrapOperation(async () => {
    // Get all active leases for this vehicle
    const { data: leases, error } = await supabase
      .from('leases')
      .select('id, start_date, end_date, customer_id, agreement_number')
      .eq('vehicle_id', vehicleId)
      .is('deleted_at', null);
      
    if (error) {
      throw new Error(`Failed to find leases: ${error.message}`);
    }
    
    if (!leases || leases.length === 0) {
      return [];
    }
    
    // Normalize the violation date
    const violationDateObj = typeof violationDate === 'string' 
      ? new Date(violationDate) 
      : violationDate;
    
    // Filter leases where the violation date falls within the lease period
    const matchingLeases = leases.filter(lease => {
      const validation = validateFineDate(
        violationDateObj,
        lease.start_date,
        lease.end_date
      );
      
      return validation.isValid;
    });
    
    return matchingLeases;
  }, 'Finding leases by violation date');
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
