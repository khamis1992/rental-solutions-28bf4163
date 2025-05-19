import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse } from '../types';
import { asMaintenanceId } from '../database-types';
import { supabase } from '@/lib/supabase';

export type MaintenanceRow = TableRow<'maintenance'>;

export class MaintenanceRepository extends Repository<'maintenance'> {
  constructor(client: any) {
    super(client, 'maintenance');
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
