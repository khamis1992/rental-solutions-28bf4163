import { 
  DatabaseVehicleRecord, 
  DatabaseVehicleStatus, 
  DatabaseVehicleType, 
  Vehicle, 
  VehicleStatus
} from '@/types/vehicle';

// Helper function to validate status
export function isValidStatus(status: string): status is VehicleStatus {
  return ['available', 'rented', 'reserved', 'maintenance', 'police_station', 'accident', 'stolen', 'retired'].includes(status);
}

// Map database status to application status
export function mapDatabaseStatus(status: DatabaseVehicleStatus | null | undefined): VehicleStatus | undefined {
  if (!status) return undefined;
  
  // Handle the "reserve" to "reserved" mapping
  if (status === 'reserve') return 'reserved';
  
  return isValidStatus(status) ? status : 'available';
}

// Convert application status to database status
export function mapToDBStatus(status: VehicleStatus | null | undefined): DatabaseVehicleStatus | null {
  if (!status) return null;
  
  // Handle the "reserved" to "reserve" mapping
  if (status === 'reserved') return 'reserve';
  
  return status as DatabaseVehicleStatus;
}

// Map database size to application size
export function mapDatabaseSize(size: string): string {
  // Map possible database values to valid application values
  const sizeMap: Record<string, string> = {
    'mid_size': 'midsize',
    'full_size': 'fullsize'
  };
  
  return sizeMap[size] || size;
}

// Convert features to string array
export function normalizeFeatures(features: any): string[] {
  if (Array.isArray(features)) {
    return features;
  }
  
  // If it's a JSON string, try to parse it
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  
  return [];
}

// Map a database vehicle type to application VehicleType
function mapDatabaseVehicleType(dbType: DatabaseVehicleType | null | undefined) {
  if (!dbType) return undefined;
  
  return {
    id: dbType.id,
    name: dbType.name,
    size: mapDatabaseSize(dbType.size),
    daily_rate: dbType.daily_rate,
    weekly_rate: dbType.weekly_rate || undefined,
    monthly_rate: dbType.monthly_rate || undefined,
    description: dbType.description || undefined,
    features: normalizeFeatures(dbType.features || []),
    is_active: dbType.is_active,
    created_at: dbType.created_at || new Date().toISOString(),
    updated_at: dbType.updated_at || new Date().toISOString(),
  };
}

// Convert a database vehicle record to the application Vehicle type
export function mapDatabaseRecordToVehicle(record: DatabaseVehicleRecord): Vehicle {
  const vehicleType = record.vehicle_types ? mapDatabaseVehicleType(record.vehicle_types) : undefined;
  
  // Map DB record to Vehicle type
  const vehicle: Vehicle = {
    id: record.id,
    make: record.make,
    model: record.model,
    year: record.year,
    license_plate: record.license_plate,
    vin: record.vin,
    color: record.color || undefined,
    status: mapDatabaseStatus(record.status),
    mileage: record.mileage || undefined,
    image_url: record.image_url || undefined,
    description: record.description || undefined,
    location: record.location || undefined,
    insurance_company: record.insurance_company || undefined,
    insurance_expiry: record.insurance_expiry || undefined,
    rent_amount: record.rent_amount || undefined,
    vehicle_type_id: record.vehicle_type_id || undefined,
    created_at: record.created_at,
    updated_at: record.updated_at,
    
    // UI compatibility computed fields
    notes: record.description || undefined,
    vehicleType: vehicleType,
    dailyRate: record.rent_amount || (vehicleType?.daily_rate || 0),
    imageUrl: record.image_url
  };
  
  // Add features if vehicleType exists
  if (vehicleType && vehicleType.features) {
    vehicle.features = vehicleType.features;
  }
  
  return vehicle;
}
