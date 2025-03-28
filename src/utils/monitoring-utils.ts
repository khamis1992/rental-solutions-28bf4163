/**
 * Utility functions for monitoring system operations
 */
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for operation logs (would be replaced with proper DB storage in production)
let operationLogs: {
  id: string;
  timestamp: string;
  operation: string;
  status: 'success' | 'warning' | 'error';
  details: any;
  errorMessage?: string;
}[] = [];

/**
 * Log an operation for monitoring purposes
 */
export const logOperation = (
  operation: string,
  status: 'success' | 'warning' | 'error',
  details: any,
  errorMessage?: string
) => {
  const logEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    operation,
    status,
    details,
    errorMessage
  };
  
  operationLogs.unshift(logEntry); // Add to beginning for chronological order
  
  // Keep only the last 100 logs to prevent memory issues
  if (operationLogs.length > 100) {
    operationLogs = operationLogs.slice(0, 100);
  }
  
  // In a real production system, this would send to a logging service
  console.log(`[${status.toUpperCase()}] ${operation}:`, details, errorMessage || '');
  
  return logEntry.id;
};

/**
 * Get recent operations for monitoring display
 */
export const getRecentOperations = () => {
  return [...operationLogs];
};

/**
 * Get operation metrics (counts by status)
 */
export const getOperationMetrics = () => {
  return {
    total: operationLogs.length,
    success: operationLogs.filter(log => log.status === 'success').length,
    warnings: operationLogs.filter(log => log.status === 'warning').length,
    errors: operationLogs.filter(log => log.status === 'error').length
  };
};

/**
 * Clear operation logs (for testing or reset)
 */
export const clearOperationLogs = () => {
  operationLogs = [];
};

/**
 * Monitor traffic fine assignment
 */
export const monitorTrafficFineAssignment = (
  data: {
    success: boolean;
    fineId: string;
    message: string;
    data: any | null;
  },
  supabaseClient: any
) => {
  // Log the assignment operation
  logOperation(
    'trafficFineAssignment', 
    data.success ? 'success' : 'error',
    { fineId: data.fineId },
    data.success ? undefined : data.message
  );
  
  // In a real system, we would store this in the database
  // For now, just log it to console
  console.log('Traffic fine assignment monitored:', data);
  
  // Return the operation ID for reference
  return uuidv4();
};

/**
 * Validate data consistency between related entities
 */
export const validateDataConsistency = async (
  entityType: 'trafficFine' | 'lease' | 'vehicle' | 'customer',
  entityId: string,
  supabaseClient: any
) => {
  const results = {
    isValid: false,
    entityType,
    entityId,
    inconsistencies: [] as string[],
    validRelationships: [] as string[]
  };
  
  try {
    switch (entityType) {
      case 'trafficFine': {
        // Get the traffic fine
        const { data: fine, error: fineError } = await supabaseClient
          .from('traffic_fines')
          .select('*')
          .eq('id', entityId)
          .single();
          
        if (fineError) {
          results.inconsistencies.push(`Traffic fine not found: ${fineError.message}`);
          break;
        }
        
        // Check if license plate exists
        if (!fine.license_plate) {
          results.inconsistencies.push('Traffic fine has no license plate');
        } else {
          results.validRelationships.push('License plate exists');
        }
        
        // Check if vehicle exists
        if (fine.vehicle_id) {
          const { data: vehicle, error: vehicleError } = await supabaseClient
            .from('vehicles')
            .select('id, license_plate')
            .eq('id', fine.vehicle_id)
            .single();
            
          if (vehicleError) {
            results.inconsistencies.push(`Referenced vehicle not found: ${vehicleError.message}`);
          } else {
            results.validRelationships.push(`Vehicle relationship valid: ${vehicle.license_plate}`);
            
            // Check if license plates match
            if (vehicle.license_plate !== fine.license_plate) {
              results.inconsistencies.push(`License plate mismatch: Fine has ${fine.license_plate}, vehicle has ${vehicle.license_plate}`);
            }
          }
        }
        
        // Check if lease exists
        if (fine.lease_id) {
          const { data: lease, error: leaseError } = await supabaseClient
            .from('leases')
            .select('id, customer_id, vehicle_id')
            .eq('id', fine.lease_id)
            .single();
            
          if (leaseError) {
            results.inconsistencies.push(`Referenced lease not found: ${leaseError.message}`);
          } else {
            results.validRelationships.push('Lease relationship valid');
            
            // Check if vehicle IDs match
            if (fine.vehicle_id && lease.vehicle_id !== fine.vehicle_id) {
              results.inconsistencies.push(`Vehicle ID mismatch: Fine has ${fine.vehicle_id}, lease has ${lease.vehicle_id}`);
            }
            
            // Check if customer exists
            if (lease.customer_id) {
              const { data: customer, error: customerError } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('id', lease.customer_id)
                .single();
                
              if (customerError) {
                results.inconsistencies.push(`Referenced customer not found: ${customerError.message}`);
              } else {
                results.validRelationships.push('Customer relationship valid');
              }
            } else {
              results.inconsistencies.push('Lease has no customer ID');
            }
          }
        }
        
        break;
      }
      
      // Add other entity types validation as needed
      
      default:
        results.inconsistencies.push(`Unsupported entity type: ${entityType}`);
    }
    
    // Determine overall validity
    results.isValid = results.inconsistencies.length === 0;
    
    // Log the validation operation
    logOperation(
      'dataValidation',
      results.isValid ? 'success' : 'warning',
      { entityType, entityId },
      results.isValid ? undefined : `Found ${results.inconsistencies.length} inconsistencies`
    );
    
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.inconsistencies.push(`Validation error: ${errorMessage}`);
    
    // Log the error
    logOperation(
      'dataValidation',
      'error',
      { entityType, entityId },
      errorMessage
    );
    
    return results;
  }
};
