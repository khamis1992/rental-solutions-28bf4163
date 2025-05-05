
/**
 * Database module entrypoint
 * Re-exports all repositories and utility functions
 */
import { supabase } from '@/lib/supabase';
import * as utils from './utils';
import * as validation from './validation';
import * as typeGuards from './validation/typeGuards';
import { createLeaseRepository } from './repositories/lease-repository';
import { createPaymentRepository } from './repositories/payment-repository';
import { createVehicleRepository } from './repositories/vehicle-repository';
import { createProfileRepository } from './repositories/profile-repository';

// Create repositories using the supabase client
export const leaseRepository = createLeaseRepository(supabase);
export const paymentRepository = createPaymentRepository(supabase);
export const vehicleRepository = createVehicleRepository(supabase);
export const profileRepository = createProfileRepository(supabase);

// Re-export utils and validation
export { utils, validation, typeGuards };

// Export types
export * from './types';
export * from './database-types';

// Export repositories for backwards compatibility
export { leaseRepository as leaseRepo };
export { paymentRepository as paymentRepo };
export { vehicleRepository as vehicleRepo };
export { profileRepository as profileRepo };

// Export common utility functions for database responses
export function isSuccessResponse<T>(response: any): response is { data: T; error: null } {
  return !response?.error && response?.data !== null;
}

// Export common types
export type { ProfileId } from './database-types';
