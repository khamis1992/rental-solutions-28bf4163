
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

// Valid profile statuses
const PROFILE_STATUSES = [
  'active',
  'inactive',
  'blacklisted',
  'pending_review',
  'pending_payment'
] as const;

export type ProfileStatus = typeof PROFILE_STATUSES[number];

/**
 * Validates and returns a profile status
 * @param status Status to validate
 * @returns Valid profile status or default 'active'
 */
export function asProfileStatus(status: string): ProfileStatus {
  if (!status) return 'active';

  const normalizedStatus = status.toLowerCase();

  if (PROFILE_STATUSES.includes(normalizedStatus as ProfileStatus)) {
    return normalizedStatus as ProfileStatus;
  }

  console.warn(`Invalid profile status: ${status}. Defaulting to 'active'`);
  return 'active';
}

export function isValidProfileStatus(status: string): boolean {
  return PROFILE_STATUSES.includes(status.toLowerCase() as ProfileStatus);
}
