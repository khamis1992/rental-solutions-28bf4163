
// Valid vehicle statuses
const VEHICLE_STATUSES = [
  'available',
  'rented',
  'maintenance',
  'police_station',
  'accident',
  'stolen',
  'reserved',
  'retired'
] as const;

type VehicleStatus = typeof VEHICLE_STATUSES[number];

/**
 * Validates and returns a vehicle status
 * @param status Status to validate
 * @returns Valid vehicle status or default 'available'
 */
export function asVehicleStatus(status: string): VehicleStatus {
  if (!status) return 'available';
  
  const normalizedStatus = status.toLowerCase();
  
  if (VEHICLE_STATUSES.includes(normalizedStatus as VehicleStatus)) {
    return normalizedStatus as VehicleStatus;
  }
  
  console.warn(`Invalid vehicle status: ${status}. Defaulting to 'available'`);
  return 'available';
}

export function isValidVehicleStatus(status: string): boolean {
  return VEHICLE_STATUSES.includes(status.toLowerCase() as VehicleStatus);
}
