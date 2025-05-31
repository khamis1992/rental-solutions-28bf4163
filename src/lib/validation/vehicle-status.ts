import { VehicleStatus } from '@/types/database.types';

const VALID_VEHICLE_STATUSES: VehicleStatus[] = [
  'available',
  'rented',
  'maintenance',
  'reserved',
  'out_of_service'
];

/**
 * Type guard to check if a string is a valid vehicle status
 */
export function isValidVehicleStatus(status: string | null): status is VehicleStatus {
  if (!status) return false;
  return VALID_VEHICLE_STATUSES.includes(status as VehicleStatus);
}

/**
 * Get all valid vehicle statuses
 */
export function getValidVehicleStatuses(): VehicleStatus[] {
  return [...VALID_VEHICLE_STATUSES];
}

/**
 * Check if a vehicle status is valid
 */
export function validateVehicleStatus(status: string | null): boolean {
  return isValidVehicleStatus(status);
}

/**
 * Get display text for a vehicle status
 */
export function getVehicleStatusDisplay(status: VehicleStatus | null): string {
  if (!status) return 'Unknown';
  
  const displayMap: Record<VehicleStatus, string> = {
    'available': 'Available',
    'rented': 'Rented',
    'maintenance': 'In Maintenance',
    'reserved': 'Reserved',
    'out_of_service': 'Out of Service'
  };
  
  return displayMap[status] || 'Unknown';
}

/**
 * Get color for a vehicle status
 */
export function getVehicleStatusColor(status: VehicleStatus | null): string {
  if (!status) return 'default';
  
  const colorMap: Record<VehicleStatus, string> = {
    'available': 'success',
    'rented': 'info',
    'maintenance': 'warning',
    'reserved': 'info',
    'out_of_service': 'error'
  };
  
  return colorMap[status] || 'default';
} 