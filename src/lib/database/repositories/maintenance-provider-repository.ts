import { Repository } from '../repository';
import { Tables, TableRow } from '../types';
import { supabase } from '@/lib/supabase';

export type MaintenanceProviderRow = TableRow<'maintenance_service_providers'>;

export class MaintenanceProviderRepository extends Repository<'maintenance_service_providers'> {
  constructor(client: any) {
    super(client, 'maintenance_service_providers');
  }
}

export const maintenanceProviderRepository = new MaintenanceProviderRepository(supabase);
export const createMaintenanceProviderRepository = (client: any) => new MaintenanceProviderRepository(client);
