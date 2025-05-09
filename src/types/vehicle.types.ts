/**
 * Core types for the Vehicle Management System
 * @module VehicleTypes
 */

import { Database } from './database.types';

/**
 * Vehicle status options in the system.
 * - available: Vehicle is ready for rental
 * - rented: Currently under an active lease
 * - maintenance: Under maintenance or repair
 * - reserved: Reserved for future rental
 * - inactive: Temporarily out of service
 */
export type VehicleStatus = Database['public']['Enums']['vehicle_status'];

/**
 * Core vehicle data structure representing a vehicle in the fleet
 */
export interface Vehicle {
  /** Unique identifier for the vehicle */
  id: string;
  /** Current operational status */
  status: VehicleStatus;
  /** Vehicle manufacturer */
  make: string;
  /** Vehicle model */
  model: string;
  /** Manufacturing year */
  year: number;
  /** License plate number */
  license_plate: string;
  /** Vehicle color */
  color?: string;
  /** Vehicle Identification Number */
  vin: string;
  /** Current mileage */
  mileage: number;
  /** Daily rental rate */
  rent_amount: number;
  /** Insurance provider company name */
  insurance_company?: string;
  /** Insurance expiry date */
  insurance_expiry?: string;
  /** Current location/branch */
  location?: string;
  /** URL to vehicle image */
  image_url?: string;
  /** Vehicle category/type ID reference */
  vehicle_type_id?: string;
  /** Indicates if this is test data */
  is_test_data?: boolean;
  /** Additional images URLs */
  additional_images?: string[];
  /** Vehicle notes/description */
  notes?: string;
  /** Daily rate for rentals */
  dailyRate?: number;
  /** Monthly rate for rentals */
  monthlyRate?: number;
  /** Vehicle type information */
  vehicleType?: string;
  /** Vehicle types information object */
  vehicle_types?: {
    id: string;
    name: string;
    description?: string;
    daily_rate: number;
    [key: string]: any;
  };
  /** Timestamps */
  created_at: string;
  updated_at: string;
}

/**
 * Extended vehicle information including maintenance and rental history
 */
export interface VehicleDetails extends Vehicle {
  maintenance_history?: MaintenanceRecord[];
  current_lease?: LeaseInfo;
  documents?: VehicleDocument[];
  metrics?: VehicleMetrics;
}

/**
 * Vehicle maintenance record
 */
interface MaintenanceRecord {
  id: string;
  service_type: string;
  service_date: string;
  cost: number;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

/**
 * Basic lease information associated with a vehicle
 */
interface LeaseInfo {
  id: string;
  start_date: string;
  end_date: string;
  customer_name: string;
}

/**
 * Vehicle document types and metadata
 */
interface VehicleDocument {
  id: string;
  document_type: 'insurance' | 'registration' | 'maintenance' | 'inspection';
  document_url: string;
  expiry_date?: string;
}

/**
 * Vehicle performance and utilization metrics
 */
interface VehicleMetrics {
  utilization_rate: number;
  revenue_generated: number;
  maintenance_costs: number;
  availability_percentage: number;
}

// Add these missing type definitions for vehicle-mappers.ts
export type VehicleType = {
  id: string;
  name: string;
  description?: string;
  daily_rate: number;
};

export type DatabaseVehicleRecord = {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  status: string;
  // Add other fields as needed
};

export type DatabaseVehicleType = {
  id: string;
  name: string;
  description?: string;
  daily_rate: number;
};

export type DatabaseVehicleStatus = string;

export interface VehicleFilterParams {
  status?: string;
  statuses?: string[];
  make?: string;
  model?: string;
  year?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  location?: string;
  vehicle_type_id?: string;
  [key: string]: any;
}

export interface VehicleGridProps {
  filter?: {
    statuses?: string[];
    [key: string]: any;
  };
  showAdd?: boolean; // Added to fix the error in MaintenancePage
}
