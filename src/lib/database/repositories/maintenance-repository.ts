
import { Repository } from '../repository';
import { DbListResponse } from '../types';
import { supabase } from '@/lib/supabase';

export type MaintenanceRow = Record<string, unknown>;

export class MaintenanceRepository extends Repository<'maintenance'> {
  constructor(client: any) {
    super(client as any, 'maintenance' as any);
  }

  async findByVehicle(vehicleId: string): Promise<DbListResponse<MaintenanceRow>> {
    const response = await this.client
      .from('maintenance')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('scheduled_date', { ascending: false });
    return { data: response.data, error: response.error };
  }
}

export const maintenanceRepository = new MaintenanceRepository(supabase);
export const createMaintenanceRepository = (client: any) => new MaintenanceRepository(client);
