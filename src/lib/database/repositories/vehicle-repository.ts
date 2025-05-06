
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asVehicleId, asVehicleStatus } from '../utils';
import { supabase } from '@/lib/supabase';

type VehicleRow = TableRow<'vehicles'>;

class VehicleRepository extends Repository<'vehicles'> {
  constructor() {
    super('vehicles');
  }

  /**
   * Find vehicles by status
   */
  async findByStatus(status: Tables['vehicles']['Row']['status']): Promise<DbListResponse<VehicleRow>> {
    const response = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', status);
    
    return this.mapDbResponse(response);
  }

  /**
   * Find available vehicles
   */
  async findAvailable(): Promise<DbListResponse<VehicleRow>> {
    return this.findByStatus(asVehicleStatus('available'));
  }

  /**
   * Update vehicle status
   */
  async updateStatus(vehicleId: string, status: Tables['vehicles']['Row']['status']): Promise<DbSingleResponse<VehicleRow>> {
    const response = await supabase
      .from('vehicles')
      .update({ status })
      .eq('id', asVehicleId(vehicleId))
      .select()
      .single();
    
    return this.mapDbResponse(response);
  }

  /**
   * Find vehicles with extended details
   */
  async findWithDetails(vehicleId: string): Promise<DbSingleResponse<VehicleRow & { maintenance: any[] }>> {
    const response = await supabase
      .from('vehicles')
      .select(`
        *,
        maintenance(*)
      `)
      .eq('id', asVehicleId(vehicleId))
      .single();
    
    return this.mapDbResponse(response);
  }
}

export const vehicleRepository = new VehicleRepository();
