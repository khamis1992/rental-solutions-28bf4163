
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
import { createMaintenanceRepository } from './repositories/maintenance-repository';
import { createMaintenanceProviderRepository } from './repositories/maintenance-provider-repository';

// Create repositories using the supabase client
export const leaseRepository = createLeaseRepository(supabase);
export const paymentRepository = createPaymentRepository(supabase);
export const vehicleRepository = createVehicleRepository(supabase);
export const profileRepository = createProfileRepository(supabase);
export const maintenanceRepository = createMaintenanceRepository(supabase);
export const maintenanceProviderRepository = createMaintenanceProviderRepository(supabase);

// Re-export utils and validation
export { utils, validation, typeGuards };

// Export types
export * from './types';

// Export repositories for backwards compatibility
export { leaseRepository as leaseRepo };
export { paymentRepository as paymentRepo };
export { vehicleRepository as vehicleRepo };
export { profileRepository as profileRepo };
export { maintenanceRepository as maintenanceRepo };
export { maintenanceProviderRepository as maintenanceProviderRepo };

// Export common utility functions for database responses
export { isSuccessResponse } from './validation/typeGuards';

// Export common types
export type { ProfileId } from './database-types';
