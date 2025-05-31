import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { 
  ExtendedVehicle, 
  VehicleInsert, 
  VehicleUpdate, 
  VehicleFilterParams,
  VehicleType,
  VehicleStatus
} from '@/types/vehicle';
import { isValidVehicleStatus } from '@/lib/validation/vehicle-status';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to safely convert status strings to VehicleStatus
const safeMapToVehicleStatus = (status: string): VehicleStatus => {
  if (!isValidVehicleStatus(status)) {
    console.warn(`Invalid vehicle status: ${status}. Defaulting to 'available'`);
    return 'available';
  }
  return status;
};

// Helper function to handle API errors
const handleApiError = (operation: string, error: any): never => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`Failed to ${operation}: ${errorMessage}`);
};

// Fetch vehicles with optional filtering
export async function fetchVehicles(filters?: VehicleFilterParams): Promise<ExtendedVehicle[]> {
  try {
    let query = supabase.from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)');
    
    if (filters) {
      if (filters.statuses?.length) {
        query = query.in('status', filters.statuses);
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
      
      if (filters.searchTerm) {
        query = query.or(`vin.ilike.%${filters.searchTerm}%,license_plate.ilike.%${filters.searchTerm}%`);
      }

      if (filters.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortDirection === 'asc' });
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(vehicle => ({
      ...vehicle,
      full_name: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
      status_display: vehicle.status,
      type_display: vehicle.vehicle_type?.name
    }));
  } catch (error) {
    handleApiError('fetch vehicles', error);
  }
}

// Fetch a single vehicle by ID
export async function fetchVehicleById(id: string): Promise<ExtendedVehicle> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error(`Vehicle with ID ${id} not found`);
    }

    return {
      ...data,
      full_name: `${data.make} ${data.model} (${data.license_plate})`,
      status_display: data.status,
      type_display: data.vehicle_type?.name
    };
  } catch (error) {
    handleApiError(`fetch vehicle with ID ${id}`, error);
  }
}

// Fetch all vehicle types
export async function fetchVehicleTypes(): Promise<VehicleType[]> {
  try {
    const { data, error } = await supabase
      .from('vehicle_types')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    handleApiError('fetch vehicle types', error);
  }
}

// Create a new vehicle
export async function createVehicle(vehicle: VehicleInsert): Promise<ExtendedVehicle> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select('*, vehicle_types(*), agreements:leases(*)')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create vehicle - no data returned');
    }

    return {
      ...data,
      full_name: `${data.make} ${data.model} (${data.license_plate})`,
      status_display: data.status,
      type_display: data.vehicle_type?.name
    };
  } catch (error) {
    handleApiError('create vehicle', error);
  }
}

// Update a vehicle
export async function updateVehicle(id: string, vehicle: VehicleUpdate): Promise<ExtendedVehicle> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicle)
      .eq('id', id)
      .select('*, vehicle_types(*), agreements:leases(*)')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`Vehicle not found with ID: ${id}`);
    }

    return {
      ...data,
      full_name: `${data.make} ${data.model} (${data.license_plate})`,
      status_display: data.status,
      type_display: data.vehicle_type?.name
    };
  } catch (error) {
    handleApiError(`update vehicle with ID ${id}`, error);
  }
}

// Delete a vehicle
export async function deleteVehicle(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    handleApiError(`delete vehicle with ID ${id}`, error);
  }
}

// Get available vehicles
export async function getAvailableVehicles(): Promise<ExtendedVehicle[]> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)')
      .eq('status', 'available');

    if (error) {
      throw error;
    }

    return (data || []).map(vehicle => ({
      ...vehicle,
      full_name: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
      status_display: vehicle.status,
      type_display: vehicle.vehicle_type?.name
    }));
  } catch (error) {
    handleApiError('fetch available vehicles', error);
  }
}

// Get vehicles by status
export async function getVehiclesByStatus(status: VehicleStatus): Promise<ExtendedVehicle[]> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)')
      .eq('status', status);

    if (error) {
      throw error;
    }

    return (data || []).map(vehicle => ({
      ...vehicle,
      full_name: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
      status_display: vehicle.status,
      type_display: vehicle.vehicle_type?.name
    }));
  } catch (error) {
    handleApiError(`fetch vehicles with status ${status}`, error);
  }
}

// Search vehicles
export async function searchVehicles(searchTerm: string): Promise<ExtendedVehicle[]> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)')
      .or(`make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%`);

    if (error) {
      throw error;
    }

    return (data || []).map(vehicle => ({
      ...vehicle,
      full_name: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
      status_display: vehicle.status,
      type_display: vehicle.vehicle_type?.name
    }));
  } catch (error) {
    handleApiError('search vehicles', error);
  }
}
