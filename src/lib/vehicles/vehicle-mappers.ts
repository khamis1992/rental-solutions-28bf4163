import { 
  DatabaseVehicleRecord, 
  DatabaseVehicleStatus, 
  DatabaseVehicleType,
  Vehicle,
  VehicleSize,
  VehicleStatus,
  UUID 
} from '@/types/vehicle';
import { hasProperty } from '@/types/supabase-helpers';

// Helper function to validate status
export function isValidStatus(status: string): status is VehicleStatus {
  const validStatuses: VehicleStatus[] = [
    'available', 'rented', 'reserved', 'maintenance', 
    'police_station', 'accident', 'stolen', 'retired'
  ];
  return validStatuses.includes(status.toLowerCase());
}

// Map database status to application status with improved normalization
export function mapDatabaseStatus(status: DatabaseVehicleStatus | null | undefined): VehicleStatus | undefined {
  if (!status) return undefined;
  
  // Normalize status string (lowercase and trim)
  const normalizedStatus = status.toLowerCase().trim();
  
  console.log(`mapDatabaseStatus: Raw input="${status}", normalized="${normalizedStatus}"`);
  
  // Handle the "reserve" to "reserved" mapping
  if (normalizedStatus === 'reserve') {
    console.log('Mapping DB status "reserve" to app status "reserved"');
    return 'reserved';
  }
  
  console.log(`Mapping DB status "${normalizedStatus}" to app status`);
  
  // Explicitly check against each valid status value
  const validStatuses: VehicleStatus[] = [
    'available', 'rented', 'reserved', 'maintenance', 
    'police_station', 'accident', 'stolen', 'retired'
  ];
  
  // Direct mapping for known values
  if (validStatuses.includes(normalizedStatus as VehicleStatus)) {
    console.log(`Direct status match found: "${normalizedStatus}"`);
    return normalizedStatus as VehicleStatus;
  }
  
  // For any unrecognized status, default to 'available'
  console.log(`No direct status match found for "${normalizedStatus}", defaulting to "available"`);
  return 'available';
}

// Convert application status to database status with improved normalization
export function mapToDBStatus(status: VehicleStatus | string | null | undefined): DatabaseVehicleStatus | null {
  if (!status) return null;
  
  // Normalize status string (lowercase and trim)
  const normalizedStatus = status.toLowerCase().trim();
  console.log(`mapToDBStatus: Raw input="${status}", normalized="${normalizedStatus}"`);
  
  // Handle the "reserved" to "reserve" mapping - CRITICAL for proper database storage
  if (normalizedStatus === 'reserved') {
    console.log('Mapping app status "reserved" to DB status "reserve"');
    return 'reserve';
  }
  
  console.log(`Mapping app status "${normalizedStatus}" to DB status`);
  
  // Extended mapping for common typos and variations
  const statusMapping: Record<string, DatabaseVehicleStatus> = {
    'available': 'available',
    'rented': 'rented',
    'reserve': 'reserve',
    'reserved': 'reserve', // Map both to ensure consistency
    'maintenance': 'maintenance',
    'police_station': 'police_station',
    'police station': 'police_station',
    'accident': 'accident',
    'stolen': 'stolen',
    'retired': 'retired'
  };
  
  // Use the mapping if available, otherwise pass through (with a fallback to ensure type safety)
  const result = statusMapping[normalizedStatus] || normalizedStatus as DatabaseVehicleStatus;
  console.log(`mapToDBStatus result: "${result}"`);
  return result;
}

// Map database size to application size
export function mapDatabaseSize(size: string): VehicleSize {
  // Map possible database values to valid application values
  const sizeMap: Record<string, VehicleSize> = {
    'mid_size': 'midsize',
    'full_size': 'fullsize'
  };
  
  return (sizeMap[size] || size) as VehicleSize;
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
    features: normalizeFeatures(dbType.features),
    is_active: dbType.is_active,
    created_at: dbType.created_at,
    updated_at: dbType.updated_at
  };
}

// Convert a database vehicle record to the application Vehicle type
export function mapDatabaseRecordToVehicle(record: DatabaseVehicleRecord): Vehicle {
  if (!record) {
    console.error('Cannot map null or undefined record to Vehicle');
    throw new Error('Invalid database record provided for mapping');
  }
  
  // Log the raw record for debugging
  console.log('Mapping DB record to Vehicle:', record);
  
  try {
    const vehicleType = record.vehicle_types ? mapDatabaseVehicleType(record.vehicle_types) : undefined;
    
    // Explicitly map the status with proper logging
    const mappedStatus = mapDatabaseStatus(record.status);
    console.log(`Status mapping: DB "${record.status}" -> App "${mappedStatus}"`);
    
    // Map DB record to Vehicle type with improved property handling
    const vehicle: Vehicle = {
      id: record.id,
      make: record.make,
      model: record.model,
      year: record.year,
      license_plate: record.license_plate,
      licensePlate: record.license_plate, // For UI compatibility
      vin: record.vin,
      color: record.color || undefined,
      status: mappedStatus,
      mileage: record.mileage || undefined,
      image_url: record.image_url || undefined,
      imageUrl: record.image_url || undefined, // For UI compatibility
      description: record.description || undefined,
      is_test_data: record.is_test_data || undefined,
      location: record.location || undefined,
      insurance_company: record.insurance_company || undefined,
      insurance_expiry: record.insurance_expiry || undefined,
      device_type: record.device_type || undefined,
      rent_amount: record.rent_amount || undefined,
      vehicle_type_id: record.vehicle_type_id || undefined,
      registration_number: record.registration_number || undefined,
      created_at: record.created_at,
      updated_at: record.updated_at,
      
      // UI compatibility computed fields
      notes: record.description || undefined,
      vehicleType: vehicleType,
      dailyRate: record.rent_amount || (vehicleType?.daily_rate || 0),
      category: vehicleType?.size || 'midsize'
    };
    
    // Add features if vehicleType exists
    if (vehicleType && vehicleType.features) {
      vehicle.features = vehicleType.features;
    }
    
    console.log('Mapped Vehicle object:', vehicle);
    return vehicle;
  } catch (error) {
    console.error('Error mapping database record to vehicle:', error);
    console.error('Problematic record:', record);
    throw new Error(`Failed to map database record to vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Type guard for database records
 */
export function isValidDatabaseRecord(record: unknown): record is DatabaseVehicleRecord {
  if (!record || typeof record !== 'object') return false;
  return hasProperty(record, 'id') && hasProperty(record, 'make') && hasProperty(record, 'model');
}

/**
 * Safely cast string to UUID for database operations
 */
export function toUUID(id: string): UUID {
  return id as UUID;
}

/**
 * Construct a fully formed database ID that will pass TypeScript's strict type checking
 * Particularly useful for Supabase operations requiring exact UUID types
 * 
 * @param id The string ID to convert to a database compatible ID
 * @returns The properly typed ID for database operations
 */
export function createDbId(id: string): string {
  return id;
}

/**
 * Type guard to check database responses for expected properties
 * Helps avoid "property does not exist on type" errors
 */
export function hasRequiredVehicleProperties<T extends object>(obj: T): obj is T & DatabaseVehicleRecord {
  return (
    hasProperty(obj, 'id') && 
    hasProperty(obj, 'make') && 
    hasProperty(obj, 'model') &&
    hasProperty(obj, 'year') &&
    hasProperty(obj, 'license_plate') &&
    hasProperty(obj, 'vin')
  );
}
