
import { supabase } from '@/lib/supabase';
import { CarInstallmentContract, CarInstallmentPayment } from '@/types/car-installment';
import { BaseService, ServiceResult } from '@/services/base/BaseService';

export class CarInstallmentService extends BaseService {
  /**
   * Recalculate contract summary values
   */
  async recalculateContractSummary(contractId: string): Promise<ServiceResult<any>> {
    try {
      const { data, error } = await supabase
        .rpc('recalculate_car_installment_contract_summary', {
          contract_id: contractId
        });

      if (error) throw error;
      
      return this.success(data);
    } catch (error) {
      return this.error('Failed to recalculate contract summary', error);
    }
  }

  /**
   * Get contracts with optional filters
   */
  async getContracts(filters = {}): Promise<ServiceResult<CarInstallmentContract[]>> {
    try {
      let query = supabase
        .from('car_installment_contracts')
        .select('*');

      // Apply filters if provided
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            if (key === 'search') {
              query = query.ilike('car_type', `%${value}%`);
            } else if (key === 'status') {
              query = query.eq('status', value);
            }
          }
        });
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      return this.success(data);
    } catch (error) {
      return this.error('Failed to fetch contracts', error);
    }
  }
  
  /**
   * Get payments for a specific contract
   */
  async getPayments(contractId: string): Promise<ServiceResult<CarInstallmentPayment[]>> {
    try {
      const { data, error } = await supabase
        .from('car_installment_payments')
        .select('*')
        .eq('contract_id', contractId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      
      return this.success(data);
    } catch (error) {
      return this.error('Failed to fetch payments', error);
    }
  }
}

export const carInstallmentService = new CarInstallmentService();
