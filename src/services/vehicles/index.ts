
export * from './VehicleInventoryService';
export * from './VehicleMaintenanceService';
export * from './VehicleAnalyticsService';
export * from './types';

// Re-export the vehicle service instance for backward compatibility
export { vehicleInventoryService as vehicleService } from './VehicleInventoryService';
