import { DatabaseVehicleRecord, Vehicle } from '@/types/vehicle';

/**
 * Maps a database record to a Vehicle object.
 * @param record - The database record to map.
 * @returns A Vehicle object.
 */
export const mapDatabaseRecordToVehicle = (record: DatabaseVehicleRecord): Vehicle => {
  return {
    id: record.id,
    make: record.make,
    model: record.model,
    year: record.year,
    licensePlate: record.license_plate,
    vin: record.vin,
    color: record.color || '',
    status: record.status,
    mileage: record.mileage || 0,
    description: record.description || '',
    location: record.location || '',
    imageUrl: record.image_url || '',
    insuranceCompany: record.insurance_company || '',
    insuranceExpiry: record.insurance_expiry || '',
    rentAmount: record.rent_amount || 0,
    vehicleTypeId: record.vehicle_type_id || '',
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    category: record.category || '',
    transmission: record.transmission || '',
    fuelType: record.fuel_type || '',
    dailyRate: record.daily_rate || 0,
    lastServiced: record.last_serviced || '',
    nextServiceDue: record.next_service_due || '',
    fuelLevel: record.fuel_level || 0,
    features: normalizeFeatures(record.features),
    notes: record.notes || '',
    vehicleType: record.vehicle_types || null,
  };
};

/**
 * Normalizes the features array to ensure it is always an array of strings.
 * @param features - The features array to normalize.
 * @returns An array of strings representing the features.
 */
export const normalizeFeatures = (features: string[] | string | null | undefined): string[] => {
  if (!features) {
    return [];
  }

  if (Array.isArray(features)) {
    return features.filter(feature => typeof feature === 'string');
  }

  if (typeof features === 'string') {
    return features.split(',').map(feature => feature.trim());
  }

  return [];
};

/**
 * Maps UI status value to database status value
 * This is important because 'reserved' in the UI is stored as 'reserve' in the database
 */
export const mapToDBStatus = (uiStatus: string): string => {
  console.log('Mapping status:', uiStatus);
  // The database uses 'reserve' but the UI uses 'reserved'
  if (uiStatus === 'reserved') {
    return 'reserve';
  }
  return uiStatus;
};

/**
 * Maps database status value to UI status value
 * This is important because 'reserve' in the database is displayed as 'reserved' in the UI
 */
export const mapDBStatusToUI = (dbStatus: string): string => {
  // The database uses 'reserve' but the UI uses 'reserved'
  if (dbStatus === 'reserve') {
    return 'reserved';
  }
  return dbStatus;
};
