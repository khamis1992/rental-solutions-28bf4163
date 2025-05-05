
// Database layer entry point - exports all functionality from the database layer

// Export base types and interfaces
export * from './types';

// Export validation functions
export * from './validation';

// Export repository functionality
export * from './repository';

// Export entity-specific repositories
export * from './vehicle-repository';
export * from './lease-repository';

// Export utility functions
export * from './utils';

/**
 * This file provides a central export point for all database related 
 * functionality. It helps maintain a clean import structure throughout
 * the application code by allowing imports like:
 * 
 * ```typescript
 * import { vehicleRepository, asVehicleStatus } from '@/lib/database';
 * ```
 * 
 * Instead of having to import from multiple files.
 */
