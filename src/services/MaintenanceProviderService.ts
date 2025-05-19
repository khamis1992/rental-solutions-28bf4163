import { maintenanceProviderRepository } from '@/lib/database';
import { TableRow } from '@/lib/database/types';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';

export type MaintenanceProvider = TableRow<'maintenance_service_providers'>;

export class MaintenanceProviderService extends BaseService<'maintenance_service_providers'> {
  constructor() {
    super(maintenanceProviderRepository);
  }

  async findActive(): Promise<ServiceResult<MaintenanceProvider[]>> {
    return handleServiceOperation(async () => {
      const result = await this.repository.findByField('is_active', true);
      if (result.error) {
        throw new Error(`Failed to fetch active providers: ${result.error.message}`);
      }
      return result.data || [];
    });
  }
}

export const maintenanceProviderService = new MaintenanceProviderService();
