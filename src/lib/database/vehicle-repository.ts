
import { supabase } from '@/lib/supabase';
import { VehicleRow } from './types';
import { createRepository } from './repository';
import { asVehicleStatus } from './utils';
import { isSuccessResponse } from './validation/typeGuards';

// Get base repository functionality
const baseRepository = createRepository('vehicles');

// Vehicle status type for type-safety
type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'police_station' | 'accident' | 'stolen' | 'reserved' | 'retired';

// Extended repository with vehicle-specific operations
export const vehicleRepository = {
  ...baseRepository,
  
  // Find vehicles with type-safe filters
  async findVehicles(filters: {
    status?: string;
    make?: string;
    model?: string;
    year?: number;
    available?: boolean;
  } = {}): Promise<VehicleRow[] | null> {
    let query = supabase.from('vehicles').select('*');
    
    if (filters.status) {
      query = query.eq('status', asVehicleStatus(filters.status));
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
    
    if (filters.available) {
      query = query.eq('status', 'available');
    }
    
    const response = await query;
    
    if (!isSuccessResponse(response)) {
      console.error('Failed to fetch vehicles with filters:', response.error);
      return null;
    }
    
    return response.data as VehicleRow[];
  },
  
  // Update vehicle status with validation
  async updateStatus(id: string, status: string): Promise<VehicleRow | null> {
    const validatedStatus = asVehicleStatus(status) as VehicleStatus;
    
    const result = await baseRepository.update(id, {
      status: validatedStatus,
      updated_at: new Date().toISOString(),
    });
    return result.data;
  },
  
  // Find available vehicles
  async findAvailableVehicles(): Promise<VehicleRow[] | null> {
    return this.findVehicles({ status: 'available' });
  },
  
  // Find by ID with better error handling
  async findById(id: string): Promise<{ data: VehicleRow | null, error: any }> {
    if (!id) {
      return { data: null, error: 'Invalid vehicle ID' };
    }
    
    try {
      const response = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (response.error) {
        console.error('Error fetching vehicle by ID:', response.error);
        return { data: null, error: response.error };
      }
      
      return { data: response.data as VehicleRow, error: null };
    } catch (error) {
      console.error('Exception in findById:', error);
      return { data: null, error };
    }
  }
};
