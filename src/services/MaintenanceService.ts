import { maintenanceRepository } from '@/lib/database';
import { TableRow } from '@/lib/database/types';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';
import { paymentService } from './PaymentService';

export type Maintenance = TableRow<'maintenance'>;

export class MaintenanceService extends BaseService<'maintenance'> {
  constructor() {
    super(maintenanceRepository);
  }

  async createMaintenance(data: Maintenance): Promise<ServiceResult<Maintenance>> {
    return handleServiceOperation(async () => {
      const result = await this.repository.create(data);
      if (result.error || !result.data) {
        throw new Error(result.error?.message || 'Failed to create maintenance');
      }
      if (result.data.cost && result.data.status === 'completed') {
        await this.recordExpense(result.data);
      }
      return result.data;
    });
  }

  async updateMaintenance(id: string, data: Partial<Maintenance>): Promise<ServiceResult<Maintenance>> {
    return handleServiceOperation(async () => {
      const result = await this.repository.update(id, data);
      if (result.error || !result.data) {
        throw new Error(result.error?.message || 'Failed to update maintenance');
      }
      if (result.data.cost && result.data.status === 'completed') {
        await this.recordExpense(result.data);
      }
      return result.data;
    });
  }

  private async recordExpense(record: Maintenance) {
    await paymentService.recordPayment({
      lease_id: record.agreement_id ?? null,
      amount: record.cost ?? 0,
      payment_date: new Date().toISOString(),
      description: `Maintenance expense for vehicle ${record.vehicle_id}`,
      status: 'completed',
      type: 'Expense',
      payment_method: 'internal'
    } as any);
  }
}

export const maintenanceService = new MaintenanceService();
