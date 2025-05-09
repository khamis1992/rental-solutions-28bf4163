
import { Vehicle, VehicleType, VehicleStatus } from '@/types/vehicle.types';

// Define missing types
type DatabaseVehicleRecord = {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  status: string;
  // Add other fields as needed
};

type DatabaseVehicleType = {
  id: string;
  name: string;
  description?: string;
  daily_rate: number;
};

type DatabaseVehicleStatus = string;

// Map database vehicle record to application Vehicle type
export const mapToVehicle = (record: DatabaseVehicleRecord, vehicleTypes?: DatabaseVehicleType[]): Vehicle => {
  let vehicleType: DatabaseVehicleType | undefined;
  
  if (vehicleTypes?.length && record.vehicle_type_id) {
    vehicleType = vehicleTypes.find(vt => vt.id === record.vehicle_type_id);
  }
  
  return {
    id: record.id,
    make: record.make,
    model: record.model,
    year: record.year,
    license_plate: record.license_plate,
    status: mapStatusToDomain(record.status),
    color: record.color || undefined,
    mileage: record.mileage || 0,
    rent_amount: record.rent_amount || 0,
    vehicle_type_id: record.vehicle_type_id || undefined,
    image_url: record.image_url || undefined,
    vin: record.vin || '',
    location: record.location || undefined,
    created_at: record.created_at,
    updated_at: record.updated_at,
    // The properties below are properly added to the Vehicle type now
    description: record.description,
    notes: record.notes,
    is_test_data: record.is_test_data,
    insurance_company: record.insurance_company,
    insurance_expiry: record.insurance_expiry,
    additional_images: record.additional_images,
    vehicle_types: vehicleType ? {
      id: vehicleType.id,
      name: vehicleType.name,
      description: vehicleType.description,
      daily_rate: vehicleType.daily_rate
    } : undefined
  } as Vehicle;
};

// Map domain status to database status
export const mapToDBStatus = (status: VehicleStatus): DatabaseVehicleStatus => {
  return status;
};

// Map database status to domain status
export const mapStatusToDomain = (status: DatabaseVehicleStatus): VehicleStatus => {
  return status as VehicleStatus;
};

// Map vehicle types
export const mapVehicleTypes = (types: DatabaseVehicleType[]): VehicleType[] => {
  return types.map(type => ({
    id: type.id,
    name: type.name,
    description: type.description,
    daily_rate: type.daily_rate
  }));
};
