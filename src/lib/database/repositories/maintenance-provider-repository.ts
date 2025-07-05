import { Repository } from '../repository';
import { supabase } from '@/lib/supabase';

export type MaintenanceProviderRow = Record<string, unknown>;

export class MaintenanceProviderRepository extends Repository<'vehicles'> {
  constructor(client: any) {
    super(client as any, 'maintenance_service_providers' as any);
  }
}

export const maintenanceProviderRepository = new MaintenanceProviderRepository(supabase);
export const createMaintenanceProviderRepository = (client: any) => new MaintenanceProviderRepository(client);
