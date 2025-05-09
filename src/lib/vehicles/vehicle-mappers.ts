
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
  
  console.log(`mapDBStatusToAppStatus: Converting DB status '${dbStatus}' to app status`);
  
  // Handle the reserved/reserve conversion
  if (dbStatus === 'reserve') {
    console.log(`mapDBStatusToAppStatus: Converting 'reserve' to 'reserved'`);
    return 'reserved';
  }
  
  // Validate that the status is a valid VehicleStatus
  const validStatuses: VehicleStatus[] = [
    'available', 'rented', 'maintenance', 'retired', 
    'police_station', 'accident', 'stolen', 'reserved'
  ];
  
  if (validStatuses.includes(dbStatus as VehicleStatus)) {
    return dbStatus as VehicleStatus;
  }
  
  console.warn(`mapDBStatusToAppStatus: Unknown status '${dbStatus}', defaulting to 'available'`);
  return 'available';
}

/**
 * Maps an app vehicle status to a database vehicle status
 */
export function mapToDBStatus(status: VehicleStatus | undefined): DatabaseVehicleStatus | undefined {
  if (!status) return undefined;
  
  console.log(`mapToDBStatus: Converting app status '${status}' to DB status`);
  
  // Handle the reserved/reserve conversion
  if (status === 'reserved') {
    console.log(`mapToDBStatus: Converting 'reserved' to 'reserve'`);
    return 'reserve';
  }
  
  return status as DatabaseVehicleStatus;
}

/**
 * Maps a database vehicle record to an app vehicle object
 */
export function mapDatabaseRecordToVehicle(record: DatabaseVehicleRecord, vehicleType?: DatabaseVehicleType): Vehicle {
  if (!record) {
    console.error("mapDatabaseRecordToVehicle: Received null or undefined record");
    throw new Error("Cannot map null vehicle record");
  }
  
  console.log(`mapDatabaseRecordToVehicle: Mapping vehicle ${record.id} from database record`);
  
  const vehicle: Vehicle = {
    id: record.id,
    license_plate: record.license_plate,
    make: record.make,
    model: record.model,
    year: record.year,
    color: record.color,
    vin: record.vin,
    mileage: record.mileage,
    status: mapDBStatusToAppStatus(record.status || null) || 'available',
    description: record.description,
    image_url: record.image_url,
    created_at: record.created_at,
    updated_at: record.updated_at,
    rent_amount: record.rent_amount,
    insurance_company: record.insurance_company,
    insurance_expiry: record.insurance_expiry,
    location: record.location,
  };
  
  // Handle vehicle type mapping
  if (record.vehicle_types) {
    console.log(`mapDatabaseRecordToVehicle: Mapping vehicle_types for ${record.id}`);
    vehicle.vehicleType = {
      id: record.vehicle_types.id,
      name: record.vehicle_types.name,
      daily_rate: record.vehicle_types.daily_rate,
      size: record.vehicle_types.size
    };
    
    // If the vehicle doesn't have a daily rate set directly, use the one from the vehicle type
    if (!vehicle.dailyRate && record.vehicle_types) {
      vehicle.dailyRate = record.vehicle_types.daily_rate;
    }
  } else if (vehicleType) {
    console.log(`mapDatabaseRecordToVehicle: Using provided vehicleType for ${record.id}`);
    vehicle.vehicleType = {
      id: vehicleType.id,
      name: vehicleType.name,
      daily_rate: vehicleType.daily_rate
    };
    
    // Set dailyRate from vehicleType if not already set
    if (!vehicle.dailyRate) {
      vehicle.dailyRate = vehicleType.daily_rate;
    }
  }
  
  // Include maintenance array if it exists
  if (record.maintenance) {
    vehicle.maintenance = record.maintenance;
  }

  return vehicle;
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
