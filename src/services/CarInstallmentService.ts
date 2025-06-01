import { supabase } from '@/lib/supabase';
import { CarInstallmentContract, CarInstallmentPayment, PaymentStatusType } from '@/types/car-installment';
import { BaseService } from './base/BaseService';
import { 
  Result, 
  ServiceError, 
  createServiceError, 
  createNotFoundError,
  ErrorContext
} from '@/types/error.types';

export interface CarInstallmentFilters {
  customerId?: string;
  status?: PaymentStatusType;
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
  contractNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentStatus?: PaymentStatusType;
  isActive?: boolean;
}

export class CarInstallmentService extends BaseService {
  constructor() {
    super(supabase);
  }

  async fetchContracts(filters?: CarInstallmentFilters): Promise<Result<CarInstallmentContract[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('car_installment_contracts').select('*');

      if (filters) {
        if (filters.customerId) {
          query = query.eq('customer_id', filters.customerId);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.searchTerm) {
          query = query.ilike('contract_number', `%${filters.searchTerm}%`);
        }
        if (filters.startDate) {
          query = query.gte('start_date', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          query = query.lte('end_date', filters.endDate.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) {
        throw this.createServiceError(
          'Failed to fetch contracts',
          'fetchContracts'
        );
      }

      return data as CarInstallmentContract[];
    }, 'Failed to fetch contracts');
  }

  async getContractById(id: string): Promise<Result<CarInstallmentContract>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('car_installment_contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to fetch contract',
          'getContractById'
        );
      }

      if (!data) {
        throw createNotFoundError('Contract', id);
      }

      return data;
    }, 'Failed to fetch contract');
  }

  async createContract(contractData: Partial<CarInstallmentContract>): Promise<Result<CarInstallmentContract>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('car_installment_contracts')
        .insert([contractData])
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to create contract',
          'createContract'
        );
      }

      return data;
    }, 'Failed to create contract');
  }

  async updateContract(id: string, contractData: Partial<CarInstallmentContract>): Promise<Result<CarInstallmentContract>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('car_installment_contracts')
        .update(contractData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to update contract',
          'updateContract'
        );
      }

      if (!data) {
        throw createNotFoundError('Contract', id);
      }

      return data;
    }, 'Failed to update contract');
  }

  async deleteContract(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('car_installment_contracts')
        .delete()
        .eq('id', id);

      if (error) {
        throw this.createServiceError(
          'Failed to delete contract',
          'deleteContract'
        );
      }

      return true;
    }, 'Failed to delete contract');
  }

  async getPaymentsByContract(contractId: string): Promise<Result<CarInstallmentPayment[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('car_installment_payments')
        .select('*')
        .eq('contract_id', contractId)
        .order('due_date', { ascending: true });

      if (error) {
        throw this.createServiceError(
          'Failed to fetch payments',
          'getPaymentsByContract'
        );
      }

      return data as CarInstallmentPayment[];
    }, 'Failed to fetch payments');
  }

  async createPayment(paymentData: Partial<CarInstallmentPayment>): Promise<Result<CarInstallmentPayment>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('car_installment_payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to create payment',
          'createPayment'
        );
      }

      return data;
    }, 'Failed to create payment');
  }

  async updatePayment(id: string, paymentData: Partial<CarInstallmentPayment>): Promise<Result<CarInstallmentPayment>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('car_installment_payments')
        .update(paymentData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to update payment',
          'updatePayment'
        );
      }

      if (!data) {
        throw createNotFoundError('Payment', id);
      }

      return data;
    }, 'Failed to update payment');
  }

  async deletePayment(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('car_installment_payments')
        .delete()
        .eq('id', id);

      if (error) {
        throw this.createServiceError(
          'Failed to delete payment',
          'deletePayment'
        );
      }

      return true;
    }, 'Failed to delete payment');
  }
}

export const carInstallmentService = new CarInstallmentService();
