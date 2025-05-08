
/**
 * Database module entrypoint
 * Re-exports all repositories and utility functions
 */
import { supabase } from '@/lib/supabase';
import { createVehicleRepository } from './repositories/vehicle-repository';

// Create repositories using the supabase client
export const vehicleRepository = createVehicleRepository(supabase);

// Export repositories without naming conflicts
export { vehicleRepository as vehicleRepo };

// Export our specific database types without conflicts
export * from './types';

// Re-export common utility functions for database responses
export { isValidStatus, hasData } from './types';

// Export common validation functions
export { 
  asLeaseStatus, 
  asVehicleStatus, 
  asVehicleId,
  asLeaseId,
  asProfileId,
  asPaymentId 
} from './validation';
