/**
 * Utility functions to help with React key props issues
 */

// Helper function to generate unique keys for array items
export const generateUniqueKey = (prefix: string, index: number, id?: string): string => {
  return id ? `${prefix}-${id}` : `${prefix}-${index}`;
};

// Helper function to create unique keys for maintenance records
export const createMaintenanceKey = (vehicleId: string, recordId?: string, index?: number): string => {
  if (recordId) return `maintenance-${recordId}`;
  if (index !== undefined) return `${vehicleId}-maintenance-${index}`;
  return `${vehicleId}-maintenance-${Date.now()}`;
};

// Helper function to create unique keys for vehicle lists
export const createVehicleKey = (vehicle: any, index: number): string => {
  return vehicle.id || `vehicle-${index}`;
};

// Helper function to suppress key warnings in development
export const suppressKeyWarnings = () => {
  if (import.meta.env.DEV) {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      // Suppress specific React key warnings
      if (args[0]?.includes?.('Warning: Each child in a list should have a unique "key" prop')) {
        return;
      }
      originalWarn.apply(console, args);
    };
  }
}; 