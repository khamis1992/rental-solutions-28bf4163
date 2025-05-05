
/**
 * Database module entrypoint
 * Re-exports all repositories and utility functions
 */
import { getSupabaseClient } from '@/integrations/supabase/client';
import * as utils from './utils';
import * as validation from './validation';
import { createLeaseRepository } from './repositories/lease-repository';
import { createPaymentRepository } from './repositories/payment-repository';
import { createVehicleRepository } from './repositories/vehicle-repository';
import { createProfileRepository } from './repositories/profile-repository';

// Initialize client
const client = getSupabaseClient();

// Create repositories
export const leaseRepository = createLeaseRepository(client);
export const paymentRepository = createPaymentRepository(client);
export const vehicleRepository = createVehicleRepository(client);
export const profileRepository = createProfileRepository(client);

// Re-export utils and validation
export { utils, validation };

// Export types
export * from './types';

// Export repositories for backwards compatibility
export { leaseRepository as leaseRepo };
export { paymentRepository as paymentRepo };
export { vehicleRepository as vehicleRepo };
export { profileRepository as profileRepo };
