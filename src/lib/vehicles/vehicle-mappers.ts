
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

const debug = createDebugLogger('vehicle-mappers');

// Status mapping tables
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

// Validation arrays
const VALID_DB_STATUSES: DatabaseVehicleStatus[] = [
  'available', 'rented', 'maintenance', 'retired', 
  'police_station', 'accident', 'stolen', 'reserve'
];

const VALID_APP_STATUSES: VehicleStatus[] = [
  'available', 'rented', 'maintenance', 'retired', 
  'police_station', 'accident', 'stolen', 'reserved'
];

/**
 * Maps a database vehicle status to an app vehicle status with enhanced validation
 * @param dbStatus Database status value
 * @returns App status value or undefined if invalid
 */
export function mapDBStatusToAppStatus(dbStatus: DatabaseVehicleStatus | string | null): VehicleStatus | undefined {
  if (!dbStatus) {
    debug('Null or undefined DB status received');
    return undefined;
  }
  
  // Validate and normalize the input status
  const validatedStatus = verifyEnum<DatabaseVehicleStatus>(
    dbStatus, 
    VALID_DB_STATUSES, 
    undefined
  );
  
  if (!validatedStatus) {
    debug(`Invalid DB status value: ${dbStatus}, not in allowed values: ${VALID_DB_STATUSES.join(', ')}`);
    return undefined;
  }
  
  debug(`Mapping DB status '${validatedStatus}' to app status '${DB_TO_APP_STATUS_MAP[validatedStatus]}'`);
  return DB_TO_APP_STATUS_MAP[validatedStatus];
}

/**
 * Maps an app vehicle status to a database vehicle status with enhanced validation
 * @param status App status value
 * @returns Database status value or undefined if invalid
 */
export function mapToDBStatus(status: VehicleStatus | string | undefined): DatabaseVehicleStatus | undefined {
  if (!status) {
    debug('Null or undefined app status received');
    return undefined;
  }
  
  // Validate and normalize the input status
  const validatedStatus = verifyEnum<VehicleStatus>(
    status, 
    VALID_APP_STATUSES, 
    undefined
  );
  
  if (!validatedStatus) {
    debug(`Invalid app status value: ${status}, not in allowed values: ${VALID_APP_STATUSES.join(', ')}`);
    return undefined;
  }
  
  debug(`Mapping app status '${validatedStatus}' to DB status '${APP_TO_DB_STATUS_MAP[validatedStatus]}'`);
  return APP_TO_DB_STATUS_MAP[validatedStatus];
}

/**
 * Maps a database vehicle record to an app vehicle object
 */
export function mapDatabaseRecordToVehicle(record: DatabaseVehicleRecord, vehicleType?: DatabaseVehicleType): Vehicle {
  const mappedStatus = mapDBStatusToAppStatus(record.status) || 'available';
  debug(`Mapped vehicle ${record.id} status from DB '${record.status}' to app '${mappedStatus}'`);
  
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
