
import {
  Vehicle,
  VehicleType,
  DatabaseVehicleRecord,
  DatabaseVehicleType,
  VehicleStatus,
  DatabaseVehicleStatus
} from '@/types/vehicle';
import { verifyEnum } from '@/utils/promise/utils';
import { createDebugLogger } from '@/utils/promise/utils';
import { createLogger } from '@/utils/error-logger';

// Create a proper logger for this module
const logger = createLogger('vehicle-mappers');
const debug = createDebugLogger('vehicle-mappers');

/**
 * Status mapping constants
 * These define the canonical mapping between application status values and database status values
 * IMPORTANT: These should be the single source of truth for status mapping in the application
 */

// Status mapping tables with explicit typing for better type safety
const DB_TO_APP_STATUS_MAP: Record<DatabaseVehicleStatus, VehicleStatus> = {
  'available': 'available',
  'rented': 'rented',
  'maintenance': 'maintenance',
  'retired': 'retired',
  'police_station': 'police_station',
  'accident': 'accident',
  'stolen': 'stolen',
  'reserve': 'reserved' // Map DB's 'reserve' to app's 'reserved'
};

const APP_TO_DB_STATUS_MAP: Record<VehicleStatus, DatabaseVehicleStatus> = {
  'available': 'available',
  'rented': 'rented',
  'maintenance': 'maintenance',
  'retired': 'retired',
  'police_station': 'police_station',
  'accident': 'accident',
  'stolen': 'stolen',
  'reserved': 'reserve' // Map app's 'reserved' to DB's 'reserve'
};

// Validation arrays - derived from the mapping tables to ensure consistency
const VALID_DB_STATUSES: DatabaseVehicleStatus[] = Object.keys(DB_TO_APP_STATUS_MAP) as DatabaseVehicleStatus[];
const VALID_APP_STATUSES: VehicleStatus[] = Object.keys(APP_TO_DB_STATUS_MAP) as VehicleStatus[];

/**
 * Maps a database vehicle status to an app vehicle status with enhanced validation
 * @param dbStatus Database status value
 * @param defaultStatus Optional default status to return if mapping fails
 * @returns App status value or default/undefined if invalid
 */
export function mapDBStatusToAppStatus(
  dbStatus: DatabaseVehicleStatus | string | null | undefined,
  defaultStatus?: VehicleStatus
): VehicleStatus | undefined {
  if (!dbStatus) {
    logger.debug('Null or undefined DB status received');
    return defaultStatus;
  }

  // Special case handling for the reserve/reserved mapping
  if (dbStatus === 'reserve') {
    logger.debug("Direct mapping of 'reserve' to 'reserved'");
    return 'reserved';
  }

  // Validate and normalize the input status
  const validatedStatus = verifyEnum<DatabaseVehicleStatus>(
    dbStatus,
    VALID_DB_STATUSES,
    undefined
  );

  if (!validatedStatus) {
    logger.warn(`Invalid DB status value: ${dbStatus}, not in allowed values: ${VALID_DB_STATUSES.join(', ')}`);
    return defaultStatus;
  }

  const appStatus = DB_TO_APP_STATUS_MAP[validatedStatus];
  logger.debug(`Mapped DB status '${validatedStatus}' to app status '${appStatus}'`);
  return appStatus;
}

/**
 * Maps an app vehicle status to a database vehicle status with enhanced validation
 * @param status App status value
 * @param defaultStatus Optional default status to return if mapping fails
 * @returns Database status value or default/undefined if invalid
 */
export function mapToDBStatus(
  status: VehicleStatus | string | undefined | null,
  defaultStatus?: DatabaseVehicleStatus
): DatabaseVehicleStatus | undefined {
  if (!status) {
    logger.debug('Null or undefined app status received');
    return defaultStatus;
  }

  // Special case handling for the reserved/reserve mapping
  if (status === 'reserved') {
    logger.debug("Direct mapping of 'reserved' to 'reserve'");
    return 'reserve';
  }

  // Validate and normalize the input status
  const validatedStatus = verifyEnum<VehicleStatus>(
    status,
    VALID_APP_STATUSES,
    undefined
  );

  if (!validatedStatus) {
    logger.warn(`Invalid app status value: ${status}, not in allowed values: ${VALID_APP_STATUSES.join(', ')}`);
    return defaultStatus;
  }

  const dbStatus = APP_TO_DB_STATUS_MAP[validatedStatus];
  logger.debug(`Mapped app status '${validatedStatus}' to DB status '${dbStatus}'`);
  return dbStatus;
}

/**
 * Maps a database vehicle record to an app vehicle object
 * @param record The database vehicle record to map
 * @param vehicleType Optional vehicle type information
 * @returns A vehicle object with app-friendly status values
 */
export function mapDatabaseRecordToVehicle(record: DatabaseVehicleRecord, vehicleType?: DatabaseVehicleType): Vehicle {
  // Map the status with a default of 'available' if mapping fails
  const mappedStatus = mapDBStatusToAppStatus(record.status, 'available');

  // Only log if there's an actual mapping (not using default)
  if (record.status && mappedStatus !== 'available') {
    logger.debug(`Mapped vehicle ${record.id} status from DB '${record.status}' to app '${mappedStatus}'`);
  }

  return {
    id: record.id,
    license_plate: record.license_plate,
    make: record.make,
    model: record.model,
    year: record.year,
    color: record.color,
    vin: record.vin,
    mileage: record.mileage,
    status: mappedStatus,
    description: record.description,
    image_url: record.image_url,
    created_at: record.created_at,
    updated_at: record.updated_at,
    rent_amount: record.rent_amount,
    insurance_company: record.insurance_company,
    insurance_expiry: record.insurance_expiry,
    location: record.location,
    vehicleType: vehicleType ? {
      id: vehicleType.id,
      name: vehicleType.name,
      daily_rate: vehicleType.daily_rate
    } : undefined,
    dailyRate: vehicleType?.daily_rate
  };
}

/**
 * Normalize features array from various input formats
 */
export function normalizeFeatures(features: any): string[] {
  if (!features) return [];

  if (typeof features === 'string') {
    try {
      return JSON.parse(features);
    } catch (e) {
      return [features];
    }
  }

  if (Array.isArray(features)) {
    return features.map(f => typeof f === 'string' ? f : JSON.stringify(f));
  }

  if (typeof features === 'object') {
    return Object.values(features).map(f => typeof f === 'string' ? f : JSON.stringify(f));
  }

  return [String(features)];
}
