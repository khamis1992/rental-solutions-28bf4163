import { supabase } from '@/lib/supabase';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { asLeaseId } from '@/utils/database-type-helpers';
import { ensureValidLeaseStatus } from '@/types/lease-types';
import { BaseService } from '@/services/base/BaseService';
import { agreementDeletionService } from './AgreementDeletionService';
import { 
  Result, 
  ServiceError, 
  createServiceError, 
  createNotFoundError,
  ErrorContext
} from '@/types/error.types';
import { AgreementStatus } from '@/types/agreement.types';
import { PaymentStatus } from '@/types/payment.types';

// Define AgreementFilters interface
export interface AgreementFilters {
  statuses?: AgreementStatus[];  // Array of statuses for filtering
  customerId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;  // Changed from 'search' to 'searchTerm' to match CustomerService
  /** Advanced filter fields */
  agreement_number?: string;
  start_date_after?: string;
  start_date_before?: string;
  end_date_after?: string;
  end_date_before?: string;
  rent_min?: number;
  rent_max?: number;
  license_plate?: string;
  isActive?: boolean;
  paymentStatus?: PaymentStatus;
  hasOverduePayments?: boolean;
  hasActiveMaintenance?: boolean;
  hasOpenLegalCases?: boolean;
}

export class AgreementService extends BaseService {
  constructor() {
    super(supabase);
  }

  async fetchAgreements(filters?: AgreementFilters): Promise<Result<Agreement[]>> {
    return this.safeExecute(async () => {
      const selectClause = `
        *,
        customers:profiles(*),
        vehicles${filters?.license_plate ? '!inner' : ''}(*)
      `;
      let query = supabase.from('leases').select(selectClause);
      
      // Apply filters
      if (filters?.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }
      
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      
      if (filters?.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }
      
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate.toISOString());
      }
      
      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate.toISOString());
      }

      if (filters?.agreement_number) {
        query = query.ilike('agreement_number', `%${filters.agreement_number}%`);
      }

      if (filters?.start_date_after) {
        query = query.gte('start_date', filters.start_date_after);
      }

      if (filters?.start_date_before) {
        query = query.lte('start_date', filters.start_date_before);
      }

      if (filters?.rent_min !== undefined) {
        query = query.gte('rent_amount', filters.rent_min);
      }

      if (filters?.rent_max !== undefined) {
        query = query.lte('rent_amount', filters.rent_max);
      }

      if (filters?.license_plate) {
        query = query.eq('vehicles.license_plate', filters.license_plate);
      }

      // Search by customer name or vehicle license plate
      if (filters?.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.trim();
        
        // We need to search in both related tables using separate queries then combine results
        // First, get agreements that match by customer name
        const { data: customerMatches, error: customerError } = await supabase
          .from('leases')
          .select(`
            *,
            customers:profiles(*),
            vehicles(*)
          `)
          .ilike('profiles.full_name', `%${searchTerm}%`);
          
        if (customerError) {
          throw this.createServiceError(
            'Failed to search agreements by customer name',
            'fetchAgreements'
          );
        }
          
        // Second, get agreements that match by license plate
        const { data: vehicleMatches, error: vehicleError } = await supabase
          .from('leases')
          .select(`
            *,
            customers:profiles(*),
            vehicles(*)
          `)
          .ilike('vehicles.license_plate', `%${searchTerm}%`);
          
        if (vehicleError) {
          throw this.createServiceError(
            'Failed to search agreements by license plate',
            'fetchAgreements'
          );
        }
          
        // Merge and deduplicate the results
        if (customerMatches || vehicleMatches) {
          const mergedData = [...(customerMatches || []), ...(vehicleMatches || [])];
          
          // Deduplicate by agreement id
          const uniqueData = Array.from(
            new Map(mergedData.map(item => [item.id, item])).values()
          );
          
          return uniqueData as Agreement[];
        }
        
        // If no matches found, return empty array
        return [];
      }

      const { data, error } = await query;

      if (error) {
        throw this.createServiceError(
          'Failed to fetch agreements',
          'fetchAgreements'
        );
      }

      return data as Agreement[];
    }, 'Failed to fetch agreements');
  }

  async getAgreementById(id: string): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to fetch agreement',
          'getAgreementById'
        );
      }

      if (!data) {
        throw createNotFoundError('Agreement', id);
      }

      return data;
    }, 'Failed to fetch agreement');
  }

  async createAgreement(agreementData: Partial<Agreement>): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      // Calculate agreement duration if not provided
      if (!agreementData.agreement_duration && agreementData.start_date && agreementData.end_date) {
        const startDate = new Date(agreementData.start_date);
        const endDate = new Date(agreementData.end_date);
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        agreementData.agreement_duration = `${diffDays} days`;
      }

      const { data, error } = await supabase
        .from('leases')
        .insert({
          vehicle_id: agreementData.vehicle_id,
          customer_id: agreementData.customer_id,
          agreement_number: agreementData.agreement_number || this.generateAgreementNumber(),
          start_date: agreementData.start_date,
          end_date: agreementData.end_date,
          status: ensureValidLeaseStatus(agreementData.status),
          deposit_amount: agreementData.deposit_amount,
          total_amount: agreementData.total_amount,
          rent_amount: agreementData.rent_amount,
          daily_late_fee: agreementData.daily_late_fee,
          agreement_type: agreementData.agreement_type || 'short_term',
          agreement_duration: agreementData.agreement_duration,
          rent_due_day: agreementData.rent_due_day ?? agreementData.payment_day,
          notes: agreementData.notes
        })
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to create agreement',
          'createAgreement'
        );
      }

      return data;
    }, 'Failed to create agreement');
  }

  async updateAgreement(id: string, agreementData: Partial<Agreement>): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .update({
          vehicle_id: agreementData.vehicle_id,
          customer_id: agreementData.customer_id,
          agreement_number: agreementData.agreement_number || this.generateAgreementNumber(),
          start_date: agreementData.start_date,
          end_date: agreementData.end_date,
          status: ensureValidLeaseStatus(agreementData.status),
          deposit_amount: agreementData.deposit_amount,
          total_amount: agreementData.total_amount,
          rent_amount: agreementData.rent_amount,
          daily_late_fee: agreementData.daily_late_fee,
          agreement_type: agreementData.agreement_type || 'short_term',
          agreement_duration: agreementData.agreement_duration,
          rent_due_day: agreementData.rent_due_day ?? agreementData.payment_day,
          notes: agreementData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', asLeaseId(id))
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to update agreement',
          'updateAgreement'
        );
      }

      if (!data) {
        throw createNotFoundError('Agreement', id);
      }

      return data;
    }, 'Failed to update agreement');
  }

  async deleteAgreement(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const result = await agreementDeletionService.deleteAgreement(id);
      
      if (!result.success) {
        throw this.createServiceError(
          result.error?.toString() || 'Failed to delete agreement',
          'deleteAgreement'
        );
      }

      return true;
    }, 'Failed to delete agreement');
  }

  async getAgreementsByCustomer(customerId: string): Promise<Result<Agreement[]>> {
    return this.fetchAgreements({ customerId });
  }

  async getAgreementsByVehicle(vehicleId: string): Promise<Result<Agreement[]>> {
    return this.fetchAgreements({ vehicleId });
  }

  async getAgreementsByStatus(status: AgreementStatus): Promise<Result<Agreement[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`*, customers:profiles(*), vehicles(*)`)
        .eq('status', status);

      if (error) {
        throw this.createServiceError(
          'Failed to fetch agreements by status',
          'getAgreementsByStatus'
        );
      }

      return data as Agreement[];
    }, 'Failed to fetch agreements by status');
  }

  async getAgreementsByDateRange(startDate: string, endDate: string): Promise<Result<Agreement[]>> {
    return this.fetchAgreements({ 
      startDate: new Date(startDate), 
      endDate: new Date(endDate) 
    });
  }

  private generateAgreementNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `AGR-${timestamp}-${random}`;
  }
}

export const agreementService = new AgreementService();
