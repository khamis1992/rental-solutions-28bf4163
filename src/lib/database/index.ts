
/**
 * Database module entrypoint
 * Re-exports all repositories and utility functions
 */
import { supabase } from '@/lib/supabase';
import { createVehicleRepository } from './repositories/vehicle-repository';
import { UUID } from '../database-types';

// Export type guards for validation
export const typeGuards = {
  isString: (value: unknown): value is string => typeof value === 'string',
  isNumber: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',
  isDate: (value: unknown): value is Date => value instanceof Date && !isNaN(value.getTime()),
  isObject: (value: unknown): value is Record<string, unknown> => 
    typeof value === 'object' && value !== null && !Array.isArray(value),
  isArray: <T>(value: unknown): value is T[] => Array.isArray(value),
};

// Create repositories using the supabase client
export const vehicleRepository = createVehicleRepository(supabase);

// Export repositories without naming conflicts
export { vehicleRepository as vehicleRepo };

// Export validation functions directly from database-types to avoid conflicts
export { 
  asLeaseStatus,
  asVehicleStatus,
  asVehicleId,
  asLeaseId,
  asProfileId,
  asPaymentId
} from '../database-types';

// Export type-safe response check
export { isSuccessResponse } from './validation';

// Export common utility functions for database responses
export { isValidStatus, hasData } from '../validation-utils';
