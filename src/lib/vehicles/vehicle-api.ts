
import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { Vehicle } from '@/types/vehicle';

// Define VehicleStatus type
export type VehicleStatus = 'available' | 'rented' | 'reserved' | 'maintenance' | 'police_station' | 'accident' | 'stolen' | 'retired';

// Function to map string to VehicleStatus enum
export function mapToDBStatus(status: string): VehicleStatus {
  const validStatuses: VehicleStatus[] = [
    'available', 'rented', 'reserved', 'maintenance', 
    'police_station', 'accident', 'stolen', 'retired'
  ];
  
  // Make sure status is valid
  if (validStatuses.includes(status as VehicleStatus)) {
    return status as VehicleStatus;
  }
  
  // Default to available
  return 'available';
}

// Get all vehicles with optional filters
export async function fetchVehicles(filters?: any): Promise<Vehicle[]> {
  try {
    let query = supabase.from('vehicles').select('*, vehicle_types(*)');
    
    // Apply filters if provided
    if (filters) {
      if (filters.status) {
        query = query.eq('status', mapToDBStatus(filters.status));
      }
      if (filters.statuses && Array.isArray(filters.statuses)) {
        query = query.in('status', filters.statuses.map(mapToDBStatus));
      }
      if (filters.make) query = query.eq('make', filters.make);
      if (filters.model) query = query.eq('model', filters.model);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as Vehicle[] || [];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
}

// Get a single vehicle by ID
export async function fetchVehicleById(id: string): Promise<Vehicle | null> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Vehicle;
  } catch (error) {
    console.error(`Error fetching vehicle ${id}:`, error);
    return null;
  }
}

// Insert a new vehicle
export async function insertVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Vehicle;
  } catch (error) {
    console.error('Error creating vehicle:', error);
    throw error;
  }
}

// Update an existing vehicle
export async function updateVehicle(id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Vehicle;
  } catch (error) {
    console.error(`Error updating vehicle ${id}:`, error);
    throw error;
  }
}

// Delete a vehicle
export async function deleteVehicle(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting vehicle ${id}:`, error);
    throw error;
  }
}
