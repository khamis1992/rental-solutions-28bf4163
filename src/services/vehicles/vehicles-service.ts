
import { supabase } from '@/integrations/supabase/client';
import { VehicleRow, DbResult, isValidDbResponse } from '@/services/core/database-types';
import { createTableQuery, executeQuery, asDbId, asDbStatus } from '@/services/core/database-utils';
import { toast } from 'sonner';

// Re-export the query builder for convenience
export const vehicleQuery = createTableQuery('vehicles');

export interface VehicleFilterParams {
  status?: string;
  statuses?: string[];
  make?: string;
  model?: string;
  year?: number;
  location?: string;
  vehicle_type_id?: string;
  search?: string;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  vin: string;
  mileage: number | null;
  status: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  rent_amount: number | null;
  insurance_company: string | null;
  insurance_expiry: string | null;
  location: string | null;
  vehicleType?: {
    id: string;
    name: string;
    daily_rate: number;
  };
  dailyRate?: number;
}

/**
 * Maps database status values to application status values
 */
export const mapDBStatusToAppStatus = (dbStatus: string | null): string | null => {
  if (!dbStatus) return null;
  if (dbStatus === 'reserve') return 'reserved';
  return dbStatus;
};

/**
 * Maps application status values to database status values
 */
export const mapToDBStatus = (appStatus: string | undefined): string | undefined => {
  if (!appStatus) return undefined;
  if (appStatus === 'reserved') return 'reserve';
  return appStatus;
};

/**
 * Service for vehicle-related operations
 */
export class VehicleService {
  /**
   * Fetch vehicles with optional filtering
   */
  static async fetchVehicles(filters?: VehicleFilterParams): Promise<Vehicle[]> {
    let query = supabase.from('vehicles')
      .select('*, vehicle_types(*)');
    
    if (filters) {
      // Support for multiple statuses
      if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
        // Map all statuses to DB format
        const dbStatuses = filters.statuses.map(status => mapToDBStatus(status));
        query = query.in('status', dbStatuses);
      }
      // Single status filter (backward compatibility)
      else if (filters.status) {
        // Convert application status to database status
        const dbStatus = mapToDBStatus(filters.status);
        query = query.eq('status', dbStatus);
      }
      
      if (filters.make) {
        query = query.eq('make', filters.make);
      }
      
      if (filters.model) {
        query = query.eq('model', filters.model);
      }
      
      if (filters.year) {
        query = query.eq('year', filters.year);
      }
      
      if (filters.location) {
        query = query.eq('location', filters.location);
      }

      if (filters.vehicle_type_id) {
        query = query.eq('vehicle_type_id', filters.vehicle_type_id);
      }
      
      if (filters.search) {
        query = query.or(`vin.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to fetch vehicles');
      throw new Error('Failed to fetch vehicles');
    }
    
    return (data || []).map((record: any) => {
      const vehicle: Vehicle = {
        id: record.id,
        license_plate: record.license_plate,
        make: record.make,
        model: record.model,
        year: record.year,
        color: record.color,
        vin: record.vin,
        mileage: record.mileage,
        status: mapDBStatusToAppStatus(record.status),
        description: record.description,
        image_url: record.image_url,
        created_at: record.created_at,
        updated_at: record.updated_at,
        rent_amount: record.rent_amount,
        insurance_company: record.insurance_company,
        insurance_expiry: record.insurance_expiry,
        location: record.location,
      };
      
      if (record.vehicle_types) {
        vehicle.vehicleType = {
          id: record.vehicle_types.id,
          name: record.vehicle_types.name,
          daily_rate: record.vehicle_types.daily_rate,
        };
        
        // If the vehicle doesn't have a daily rate set directly, use the one from the vehicle type
        if (!vehicle.dailyRate && record.vehicle_types) {
          vehicle.dailyRate = record.vehicle_types.daily_rate;
        }
      }
      
      return vehicle;
    });
  }

  /**
   * Fetch a single vehicle by ID
   */
  static async getVehicle(id: string): Promise<Vehicle | null> {
    const response = await executeQuery<any>(
      () => supabase
        .from('vehicles')
        .select('*, vehicle_types(*)')
        .eq('id', id)
        .single(),
      `Failed to fetch vehicle with ID ${id}`
    );

    if (!response) {
      return null;
    }

    const vehicle: Vehicle = {
      id: response.id,
      license_plate: response.license_plate,
      make: response.make,
      model: response.model,
      year: response.year,
      color: response.color,
      vin: response.vin,
      mileage: response.mileage,
      status: mapDBStatusToAppStatus(response.status),
      description: response.description,
      image_url: response.image_url,
      created_at: response.created_at,
      updated_at: response.updated_at,
      rent_amount: response.rent_amount,
      insurance_company: response.insurance_company,
      insurance_expiry: response.insurance_expiry,
      location: response.location,
    };

    if (response.vehicle_types) {
      vehicle.vehicleType = {
        id: response.vehicle_types.id,
        name: response.vehicle_types.name,
        daily_rate: response.vehicle_types.daily_rate,
      };

      if (!vehicle.dailyRate) {
        vehicle.dailyRate = response.vehicle_types.daily_rate;
      }
    }

    return vehicle;
  }

  /**
   * Create a new vehicle
   */
  static async createVehicle(data: Partial<VehicleRow>): Promise<VehicleRow | null> {
    // Handle status mapping if present
    if (data.status) {
      data.status = mapToDBStatus(data.status) as VehicleRow['status'];
    }

    return executeQuery<VehicleRow>(
      () => supabase
        .from('vehicles')
        .insert(data)
        .select()
        .single(),
      'Failed to create vehicle'
    );
  }

  /**
   * Update an existing vehicle
   */
  static async updateVehicle(id: string, data: Partial<VehicleRow>): Promise<VehicleRow | null> {
    // Handle status mapping if present
    if (data.status !== undefined) {
      data.status = mapToDBStatus(data.status) as VehicleRow['status'];
    }

    // Ensure we have an updated_at timestamp
    data.updated_at = new Date().toISOString();
    
    return executeQuery<VehicleRow>(
      () => supabase
        .from('vehicles')
        .update(data)
        .eq('id', id)
        .select('*, vehicle_types(*)')
        .single(),
      `Failed to update vehicle ${id}`
    );
  }

  /**
   * Delete a vehicle
   */
  static async deleteVehicle(id: string): Promise<boolean> {
    const result = await executeQuery<any>(
      () => supabase
        .from('vehicles')
        .delete()
        .eq('id', id),
      `Failed to delete vehicle ${id}`
    );

    return result !== null;
  }

  /**
   * Check if a vehicle is currently assigned to an active agreement
   */
  static async isVehicleAssigned(vehicleId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('leases')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('Error checking vehicle assignment:', error);
      return false;
    }

    return data.length > 0;
  }

  /**
   * Get existing agreement for a vehicle if it's currently assigned
   */
  static async getVehicleAgreement(vehicleId: string): Promise<{id: string, agreement_number: string} | null> {
    const { data, error } = await supabase
      .from('leases')
      .select('id, agreement_number')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching vehicle agreement:', error);
      return null;
    }

    return data as {id: string, agreement_number: string};
  }
}
