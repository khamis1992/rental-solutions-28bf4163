
import { supabase } from '@/integrations/supabase/client';
import { VehicleType, DatabaseVehicleType } from '@/types/vehicle';
import { normalizeFeatures } from '../vehicle-mappers';

/**
 * Fetch all vehicle types
 */
export async function fetchVehicleTypes(): Promise<VehicleType[]> {
  const { data, error } = await supabase
    .from('vehicle_types')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    throw new Error(`Error fetching vehicle types: ${error.message}`);
  }
  
  // Map the database vehicle types to application vehicle types with proper size mapping
  return (data || []).map((type: DatabaseVehicleType) => ({
    id: type.id,
    name: type.name,
    size: type.size === 'mid_size' ? 'midsize' : 
          type.size === 'full_size' ? 'fullsize' : 
          type.size as VehicleType['size'],
    daily_rate: type.daily_rate,
    weekly_rate: type.weekly_rate || undefined,
    monthly_rate: type.monthly_rate || undefined,
    description: type.description || undefined,
    features: normalizeFeatures(type.features),
    is_active: type.is_active,
    created_at: type.created_at,
    updated_at: type.updated_at
  }));
}
