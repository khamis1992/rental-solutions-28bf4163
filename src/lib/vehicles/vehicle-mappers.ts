
import { 
  Vehicle, 
  VehicleType, 
  DatabaseVehicleRecord, 
  DatabaseVehicleType, 
  VehicleStatus,
  DatabaseVehicleStatus
} from '@/types/vehicle';

/**
 * Maps a database vehicle status to an app vehicle status
 */
export function mapDBStatusToAppStatus(dbStatus: DatabaseVehicleStatus | null): VehicleStatus | undefined {
  if (!dbStatus) return undefined;
  
  if (dbStatus === 'reserve') {
    return 'reserved';
  }
  
  return dbStatus as VehicleStatus;
}

/**
 * Maps an app vehicle status to a database vehicle status
 */
export function mapToDBStatus(status: VehicleStatus | undefined): DatabaseVehicleStatus | undefined {
  if (!status) return undefined;
  
  if (status === 'reserved') {
    return 'reserve';
  }
  
  return status as DatabaseVehicleStatus;
}

/**
 * Maps a database vehicle record to an app vehicle object
 */
export function mapDatabaseRecordToVehicle(record: DatabaseVehicleRecord, vehicleType?: DatabaseVehicleType): Vehicle {
  return {
    id: record.id,
    license_plate: record.license_plate,
    make: record.make,
    model: record.model,
    year: record.year,
    color: record.color,
    vin: record.vin,
    mileage: record.mileage,
    status: mapDBStatusToAppStatus(record.status || null),
    description: record.description, // Properly handle description
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
      description: vehicleType.description,
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
