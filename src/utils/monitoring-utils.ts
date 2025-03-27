/**
 * Monitoring utilities for tracking system operations and detecting issues
 */
import { toast } from 'sonner';

type OperationStatus = 'success' | 'warning' | 'error';

interface OperationLogEntry {
  operation: string;
  status: OperationStatus;
  timestamp: Date;
  details?: any;
  errorMessage?: string;
}

// In-memory log for tracking recent operations
const operationLog: OperationLogEntry[] = [];
const MAX_LOG_ENTRIES = 100;

/**
 * Log an operation with relevant details for monitoring
 */
export const logOperation = (
  operation: string, 
  status: OperationStatus, 
  details?: any, 
  errorMessage?: string
) => {
  // Create log entry
  const entry: OperationLogEntry = {
    operation,
    status,
    timestamp: new Date(),
    details,
    errorMessage
  };
  
  // Add to memory log (keeping most recent entries)
  operationLog.unshift(entry);
  if (operationLog.length > MAX_LOG_ENTRIES) {
    operationLog.pop();
  }
  
  // Log to console for debugging
  if (status === 'error') {
    console.error(`Operation error: ${operation}`, { details, error: errorMessage });
  } else if (status === 'warning') {
    console.warn(`Operation warning: ${operation}`, { details });
  } else {
    console.log(`Operation: ${operation}`, { details });
  }
  
  // Store in localStorage for persistence across refreshes
  try {
    const storageKey = 'operation_metrics';
    // Only store errors and warnings for persistence
    if (status !== 'success') {
      const storedMetrics = localStorage.getItem(storageKey);
      const metrics = storedMetrics ? JSON.parse(storedMetrics) : [];
      
      // Add new entry, keep only last 20 non-success entries
      metrics.unshift({
        operation,
        status,
        timestamp: entry.timestamp.toISOString(),
        errorMessage
      });
      
      if (metrics.length > 20) metrics.length = 20;
      localStorage.setItem(storageKey, JSON.stringify(metrics));
    }
  } catch (e) {
    // Fail silently if localStorage is not available
    console.warn('Failed to store operation metrics in localStorage', e);
  }
}

/**
 * Get recent operation logs
 */
export const getRecentOperations = () => {
  return [...operationLog];
};

/**
 * Get operation metrics summary
 */
export const getOperationMetrics = () => {
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);
  
  const recentOperations = operationLog.filter(
    entry => entry.timestamp > last24Hours
  );
  
  return {
    total: recentOperations.length,
    success: recentOperations.filter(entry => entry.status === 'success').length,
    warnings: recentOperations.filter(entry => entry.status === 'warning').length,
    errors: recentOperations.filter(entry => entry.status === 'error').length,
    errorRate: recentOperations.length > 0 
      ? (recentOperations.filter(entry => entry.status === 'error').length / recentOperations.length)
      : 0
  };
};

/**
 * Clear all operation logs
 */
export const clearOperationLogs = () => {
  operationLog.length = 0;
  try {
    localStorage.removeItem('operation_metrics');
  } catch (e) {
    // Fail silently
  }
};

/**
 * Validate data consistency between related entities
 * Returns validation results with any inconsistencies found
 */
export const validateDataConsistency = async (
  entityType: 'trafficFine' | 'lease' | 'vehicle' | 'customer',
  entityId: string,
  supabaseClient: any
) => {
  const results = {
    isValid: true,
    inconsistencies: [] as string[],
    relatedEntities: {} as Record<string, any>
  };
  
  try {
    if (entityType === 'trafficFine') {
      // Get traffic fine details
      const { data: fine, error: fineError } = await supabaseClient
        .from('traffic_fines')
        .select('*')
        .eq('id', entityId)
        .single();
        
      if (fineError || !fine) {
        results.isValid = false;
        results.inconsistencies.push(`Traffic fine not found: ${entityId}`);
        return results;
      }
      
      results.relatedEntities.trafficFine = fine;
      
      // Validate lease relationship if present
      if (fine.lease_id) {
        const { data: lease, error: leaseError } = await supabaseClient
          .from('leases')
          .select('*')
          .eq('id', fine.lease_id)
          .single();
          
        if (leaseError || !lease) {
          results.isValid = false;
          results.inconsistencies.push(`Lease referenced by traffic fine not found: ${fine.lease_id}`);
        } else {
          results.relatedEntities.lease = lease;
          
          // Validate vehicle relationship
          if (fine.vehicle_id && lease.vehicle_id && fine.vehicle_id !== lease.vehicle_id) {
            results.isValid = false;
            results.inconsistencies.push(
              `Vehicle ID mismatch: Traffic fine references ${fine.vehicle_id}, but lease references ${lease.vehicle_id}`
            );
          }
          
          // Validate customer exists
          if (lease.customer_id) {
            const { data: customer, error: customerError } = await supabaseClient
              .from('profiles')
              .select('*')
              .eq('id', lease.customer_id)
              .single();
              
            if (customerError || !customer) {
              results.isValid = false;
              results.inconsistencies.push(`Customer referenced by lease not found: ${lease.customer_id}`);
            } else {
              results.relatedEntities.customer = customer;
            }
          } else {
            results.isValid = false;
            results.inconsistencies.push('Lease has no associated customer');
          }
        }
      }
      
      // Validate vehicle relationship if present
      if (fine.vehicle_id) {
        const { data: vehicle, error: vehicleError } = await supabaseClient
          .from('vehicles')
          .select('*')
          .eq('id', fine.vehicle_id)
          .single();
          
        if (vehicleError || !vehicle) {
          results.isValid = false;
          results.inconsistencies.push(`Vehicle referenced by traffic fine not found: ${fine.vehicle_id}`);
        } else {
          results.relatedEntities.vehicle = vehicle;
          
          // Check license plate consistency
          if (fine.license_plate && vehicle.license_plate && 
              fine.license_plate.toLowerCase() !== vehicle.license_plate.toLowerCase()) {
            results.isValid = false;
            results.inconsistencies.push(
              `License plate mismatch: Traffic fine has ${fine.license_plate}, but vehicle has ${vehicle.license_plate}`
            );
          }
        }
      }
    }
    
    // Add validation for other entity types as needed
    
  } catch (error) {
    results.isValid = false;
    results.inconsistencies.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return results;
};

/**
 * Monitor and report on assignment operations
 */
export const monitorTrafficFineAssignment = (
  result: { success: boolean; fineId: string; message: string; data?: any },
  supabaseClient: any
) => {
  // Log the operation
  logOperation(
    'trafficFineAssignment',
    result.success ? 'success' : 'error',
    { fineId: result.fineId },
    result.success ? undefined : result.message
  );
  
  // Get metrics
  const metrics = getOperationMetrics();
  
  // Alert if error rate is high
  if (metrics.errorRate > 0.2 && metrics.total >= 5) {
    toast.error('Traffic fine assignments are failing at a high rate', {
      description: 'Please check the system logs and database relationships',
      duration: 8000,
    });
  }
  
  // If this operation failed, validate data consistency
  if (!result.success) {
    setTimeout(async () => {
      const validationResults = await validateDataConsistency('trafficFine', result.fineId, supabaseClient);
      
      if (!validationResults.isValid) {
        console.error('Data consistency issues found:', validationResults.inconsistencies);
        logOperation(
          'dataConsistencyCheck',
          'error',
          { entityType: 'trafficFine', entityId: result.fineId },
          validationResults.inconsistencies.join('; ')
        );
      }
    }, 100);
  }
  
  return result;
};
