import { supabase } from '@/integrations/supabase/client';
import { TRAFFIC_FINE_PAYMENT_STATUSES, asTrafficFinePaymentStatus } from '@/types/database-common';
import { ServiceResponse, wrapOperation, hasResponseData } from '@/utils/response-handler';
import { validateFineDate } from '@/hooks/traffic-fines/use-traffic-fine-validation';
import { fuzzyMatchLicensePlates, normalizeLicensePlate } from '@/utils/searchUtils';
import { createLogger } from '@/utils/error-logger';
import { batchOperations } from '@/utils/promise/batch';

const logger = createLogger('traffic-fines');

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
    logger.debug('Fetching traffic fines with options:', options);
    
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
      logger.debug(`Filtering by normalized license plate: ${normalizedPlate}`);
      query = query.eq('license_plate', normalizedPlate);
    }
    
    if (options.agreementId) {
      logger.debug(`Filtering by agreement ID: ${options.agreementId}`);
      query = query.eq('lease_id', options.agreementId);
    }
    
    if (options.paymentStatus) {
      const safeStatus = asTrafficFinePaymentStatus(options.paymentStatus);
      logger.debug(`Filtering by payment status: ${safeStatus}`);
      query = query.eq('payment_status', safeStatus);
    }
    
    // Apply limit if provided
    if (options.limit && options.limit > 0) {
      logger.debug(`Limiting results to: ${options.limit}`);
      query = query.limit(options.limit);
    }
    
    // Execute the query
    const response = await query.order('violation_date', { ascending: false });
    
    if (response && !response.error && response.data) {
      logger.info(`Found ${response.data.length} traffic fines`);
      return response.data;
    }
    
    logger.error(`Error fetching traffic fines: ${response?.error?.message || 'Unknown error'}`);
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
    logger.debug(`Updating traffic fine ${fineId} payment status to ${status}`);
    
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
      logger.info(`Successfully updated traffic fine ${fineId} payment status to ${status}`);
      return response.data;
    }
    
    logger.error(`Error updating traffic fine payment status: ${response?.error?.message || 'Unknown error'}`);
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
    logger.debug(`Finding leases for vehicle ${vehicleId} on violation date ${violationDate}`);
    
    // Get all active leases for this vehicle
    const { data: leases, error } = await supabase
      .from('leases')
      .select('id, start_date, end_date, customer_id, agreement_number')
      .eq('vehicle_id', vehicleId)
      .is('deleted_at', null);
      
    if (error) {
      logger.error(`Failed to find leases: ${error.message}`);
      throw new Error(`Failed to find leases: ${error.message}`);
    }
    
    if (!leases || leases.length === 0) {
      logger.info(`No leases found for vehicle ${vehicleId}`);
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
    
    logger.info(`Found ${matchingLeases.length} matching leases for violation date ${violationDate}`);
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
    logger.debug(`Reassigning traffic fine ${fineId} to agreement ${agreementId || 'none'}`);
    
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
      logger.info(`Successfully reassigned traffic fine ${fineId}`);
      return response.data;
    }
    
    logger.error(`Error reassigning traffic fine: ${response?.error?.message || 'Unknown error'}`);
    throw new Error(`Error reassigning traffic fine: ${response?.error?.message || 'Unknown error'}`);
  }, 'Reassigning traffic fine');
}

/**
 * Handles reassignment of traffic fines when a vehicle's license plate changes
 */
export async function handleLicensePlateChange(
  oldLicensePlate: string,
  newLicensePlate: string,
  vehicleId: string
): Promise<ServiceResponse<{
  updated: number;
  total: number;
  errors: any[];
}>> {
  return wrapOperation(async () => {
    logger.info(`Processing license plate change: ${oldLicensePlate} → ${newLicensePlate}`);
    
    // Normalize license plates for consistency
    const normalizedOldPlate = normalizeLicensePlate(oldLicensePlate);
    const normalizedNewPlate = normalizeLicensePlate(newLicensePlate);
    
    // Find all traffic fines with the old license plate
    const { data: fines, error: findError } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('license_plate', normalizedOldPlate);
      
    if (findError) {
      logger.error(`Failed to find associated fines: ${findError.message}`);
      throw new Error(`Failed to find associated fines: ${findError.message}`);
    }
    
    const totalFines = fines?.length || 0;
    logger.info(`Found ${totalFines} traffic fines associated with license plate ${normalizedOldPlate}`);
    
    if (totalFines === 0) {
      return {
        updated: 0,
        total: 0,
        errors: []
      };
    }
    
    // Use batch operations for updating the fines
    const result = await batchOperations(
      fines,
      async (fine) => {
        const { data, error } = await supabase
          .from('traffic_fines')
          .update({
            license_plate: normalizedNewPlate,
            vehicle_id: vehicleId,
            updated_at: new Date().toISOString()
          })
          .eq('id', fine.id)
          .select();
          
        if (error) throw error;
        return data;
      },
      {
        concurrency: 3,
        continueOnError: true,
        onProgress: (status) => {
          logger.debug(`License plate change progress: ${status.completed}/${status.total}`);
        }
      }
    );
    
    if (!result.success) {
      logger.error(`Error updating traffic fines: ${result.error?.message}`);
    }
    
    const successCount = result.success ? (result.data.completed - result.data.errors.length) : 0;
    logger.info(`Successfully updated ${successCount} of ${totalFines} traffic fines`);
    
    return {
      updated: successCount,
      total: totalFines,
      errors: result.success ? result.data.errors : [{ message: result.error?.message }]
    };
  }, 'Updating traffic fines for license plate change');
}

/**
 * Find traffic fines by license plate with normalized matching
 */
export async function findFinesByLicensePlate(
  licensePlate: string
): Promise<ServiceResponse<any[]>> {
  return wrapOperation(async () => {
    const normalizedPlate = normalizeLicensePlate(licensePlate);
    logger.debug(`Finding traffic fines for normalized license plate: ${normalizedPlate}`);
    
    const { data, error } = await supabase
      .from('traffic_fines')
      .select(`
        *,
        vehicles:vehicle_id(*),
        leases:lease_id(*)
      `)
      .eq('license_plate', normalizedPlate);
      
    if (error) {
      logger.error(`Failed to find fines by license plate: ${error.message}`);
      throw new Error(`Failed to find fines by license plate: ${error.message}`);
    }
    
    logger.info(`Found ${data?.length || 0} fines for license plate ${normalizedPlate}`);
    return data || [];
  }, 'Finding traffic fines by license plate');
}
