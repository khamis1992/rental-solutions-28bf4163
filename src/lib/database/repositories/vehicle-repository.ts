
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asVehicleId, asVehicleStatus } from '../database-types';
import { supabase } from '@/lib/supabase';

type VehicleRow = TableRow<'vehicles'>;

/**
 * Repository for vehicle-related database operations
 */
export class VehicleRepository extends Repository<'vehicles'> {
  constructor(client: any) {
    super(client, 'vehicles');
  }

  /**
   * Find vehicles by status
   */
  async findByStatus(status: string): Promise<DbListResponse<VehicleRow>> {
    const response = await this.client
      .from('vehicles')
      .select('*')
      .eq('status', asVehicleStatus(status))
      .order('created_at', { ascending: false });
    
    return { data: response.data, error: response.error };
  }

  /**
   * Find available vehicles (those not currently assigned)
   */
  async findAvailable(): Promise<DbListResponse<VehicleRow>> {
    const response = await this.client
      .from('vehicles')
      .select('*')
      .eq('status', asVehicleStatus('available'))
      .order('created_at', { ascending: false });
    
    return { data: response.data, error: response.error };
  }

  /**
   * Update vehicle status
   */
  async updateStatus(vehicleId: string, status: string): Promise<DbSingleResponse<VehicleRow>> {
    const response = await this.client
      .from('vehicles')
      .update({ status: asVehicleStatus(status) })
      .eq('id', asVehicleId(vehicleId))
      .select()
      .single();
    
    return { data: response.data, error: response.error };
  }

  /**
   * Get vehicle with current lease information
   */
  async getWithLease(vehicleId: string): Promise<DbSingleResponse<VehicleRow & { leases: any[] }>> {
    const response = await this.client
      .from('vehicles')
      .select('*, leases(*)')
      .eq('id', asVehicleId(vehicleId))
      .single();
    
    return { data: response.data, error: response.error };
  }
}

// Export the repository instance and the factory function
export const vehicleRepository = new VehicleRepository(supabase);
export const createVehicleRepository = (client: any) => new VehicleRepository(client);
