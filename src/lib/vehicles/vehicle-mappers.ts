
import { Vehicle, VehicleStatus } from '@/types/vehicle';
import { 
  VehicleType,
  DatabaseVehicleRecord, 
  DatabaseVehicleType 
} from '@/types/vehicle-db-types';

// Function to map a database vehicle record to the client-side vehicle model
export function mapDatabaseVehicleToClient(dbVehicle: DatabaseVehicleRecord): Vehicle {
  // Transform database vehicle record to client vehicle model
  const vehicle: Vehicle = {
    id: dbVehicle.id,
    make: dbVehicle.make,
    model: dbVehicle.model,
    year: dbVehicle.year,
    license_plate: dbVehicle.license_plate,
    vin: dbVehicle.vin,
    color: dbVehicle.color,
    image_url: dbVehicle.image_url,
    mileage: dbVehicle.mileage,
    status: dbVehicle.status as any,  // Cast to VehicleStatus
    description: dbVehicle.description,
    created_at: dbVehicle.created_at,
    updated_at: dbVehicle.updated_at,
    rent_amount: dbVehicle.rent_amount,
    insurance_company: dbVehicle.insurance_company,
    insurance_expiry: dbVehicle.insurance_expiry,
    location: dbVehicle.location,
  };

  // Add vehicle type information if available
  if (dbVehicle.vehicle_types) {
    vehicle.vehicleType = {
      id: dbVehicle.vehicle_types.id,
      name: dbVehicle.vehicle_types.name,
      description: dbVehicle.vehicle_types.description,
      daily_rate: dbVehicle.vehicle_types.daily_rate
    };
    
    // Map daily rate from vehicle type
    vehicle.dailyRate = dbVehicle.vehicle_types.daily_rate;
  }

  return vehicle;
}

// Function to map a vehicle type from the database
export function mapVehicleTypeFromDatabase(dbType: DatabaseVehicleType): {
  id: string;
  name: string;
  description?: string;
  daily_rate: number;
} {
  return {
    id: dbType.id,
    name: dbType.name,
    description: dbType.description,
    daily_rate: dbType.daily_rate
  };
}

// Function to convert client-side status to database status
export function mapToDBStatus(status: VehicleStatus): string {
  // Map the application status to database status
  // Most are identical but 'reserved' is stored as 'reserve' in DB
  switch (status) {
    case 'reserved':
      return 'reserve';
    default:
      return status;
  }
}

// Helper function for database to application side mapping
export function mapDatabaseRecordToVehicle(record: DatabaseVehicleRecord): Vehicle {
  return mapDatabaseVehicleToClient(record);
}

// Helper function to normalize features from database
export function normalizeFeatures(features: any): string[] {
  if (!features) return [];
  if (Array.isArray(features)) return features;
  
  try {
    if (typeof features === 'string') {
      return JSON.parse(features);
    }
    return Object.keys(features);
  } catch (e) {
    console.error("Error normalizing features:", e);
    return [];
  }
}
