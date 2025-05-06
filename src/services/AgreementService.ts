
import { leaseRepository, paymentRepository } from '@/lib/database';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';
import { TableRow } from '@/lib/database/types';
import { Database } from '@/types/database.types';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { asLeaseStatus } from '@/lib/database/utils';
import { supabase } from '@/lib/supabase';

// Define agreement type for readability
export type Agreement = TableRow<'leases'>;

// Define types for agreement filters
export interface AgreementFilters {
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
  query?: string;
  [key: string]: any;
}

/**
 * Agreement service responsible for all operations related to rental agreements
 */
export class AgreementService extends BaseService<'leases'> {
  constructor() {
    super(leaseRepository);
  }

  /**
   * Find agreements with optional filtering
   */
  async findAgreements(filters?: AgreementFilters): Promise<ServiceResult<Agreement[]>> {
    return handleServiceOperation(async () => {
      // Basic query builder
      let query = supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id (id, full_name, email, phone_number),
          vehicles:vehicle_id (id, make, model, license_plate, image_url, year, color, vin)
        `);

      // Apply filters if provided
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          switch (filters.status) {
            case AgreementStatus.ACTIVE:
              query = query.eq('status', 'active');
              break;
            case AgreementStatus.PENDING:
              query = query.or('status.eq.pending_payment,status.eq.pending_deposit');
              break;
            case AgreementStatus.CANCELLED:
              query = query.eq('status', 'cancelled');
              break;
            case AgreementStatus.CLOSED:
              query = query.or('status.eq.completed,status.eq.terminated');
              break;
            case AgreementStatus.EXPIRED:
              query = query.eq('status', 'archived');
              break;
            case AgreementStatus.DRAFT:
              query = query.filter('status', 'eq', 'draft');
              break;
            default:
              if (typeof filters.status === 'string') {
                query = query.filter('status', 'eq', filters.status);
              }
          }
        }

        // Search query
        if (filters.query) {
          const searchQuery = filters.query.trim().toLowerCase();
          
          query = query.or(`
            agreement_number.ilike.%${searchQuery}%,
            profiles.full_name.ilike.%${searchQuery}%,
            vehicles.license_plate.ilike.%${searchQuery}%,
            vehicles.make.ilike.%${searchQuery}%,
            vehicles.model.ilike.%${searchQuery}%
          `);
        }

        // Filter by vehicle
        if (filters.vehicle_id) {
          query = query.eq('vehicle_id', filters.vehicle_id);
        }

        // Filter by customer
        if (filters.customer_id) {
          query = query.eq('customer_id', filters.customer_id);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching agreements:", error);
        throw new Error(`Failed to fetch agreements: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Get agreement details by ID
   */
  async getAgreementDetails(id: string): Promise<ServiceResult<Agreement>> {
    return handleServiceOperation(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id (id, full_name, email, phone_number, driver_license, nationality, address),
          vehicles:vehicle_id (id, make, model, license_plate, image_url, year, color, vin)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching agreement from Supabase:", error);
        throw new Error(`Failed to load agreement details: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Change agreement status
   */
  async changeStatus(id: string, newStatus: string): Promise<ServiceResult<Agreement>> {
    return handleServiceOperation(async () => {
      // Convert status to correct format for database
      const dbStatus = asLeaseStatus(newStatus);
      
      // Update agreement status
      const response = await this.repository.update(id, { status: dbStatus });
      
      if (response.error) {
        throw new Error(`Failed to update agreement status: ${response.error.message}`);
      }
      
      return response.data;
    });
  }

  /**
   * Generate next agreement number
   */
  async generateAgreementNumber(): Promise<ServiceResult<string>> {
    return handleServiceOperation(async () => {
      const currentDate = new Date();
      const yearMonth = currentDate.toISOString().slice(0, 7).replace('-', '');
      
      // Get the highest agreement number with this prefix
      const { data, error } = await supabase
        .from('leases')
        .select('agreement_number')
        .ilike('agreement_number', `AGR-${yearMonth}-%`)
        .order('agreement_number', { ascending: false })
        .limit(1);
      
      if (error) {
        throw new Error(`Error generating agreement number: ${error.message}`);
      }
      
      let nextNumber = 1;
      
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].agreement_number.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Format with leading zeros
      const agreementNumber = `AGR-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
      return agreementNumber;
    });
  }

  /**
   * Delete an agreement and all related data
   */
  async deleteAgreement(id: string): Promise<ServiceResult<boolean>> {
    return handleServiceOperation(async () => {
      const { error: overduePaymentsDeleteError } = await supabase
        .from('overdue_payments')
        .delete()
        .eq('agreement_id', id);
        
      if (overduePaymentsDeleteError) {
        console.error(`Failed to delete related overdue payments for ${id}:`, overduePaymentsDeleteError);
      }
      
      const { error: paymentDeleteError } = await supabase
        .from('unified_payments')
        .delete()
        .eq('lease_id', id);
        
      if (paymentDeleteError) {
        console.error(`Failed to delete related payments for ${id}:`, paymentDeleteError);
      }
      
      const { data: relatedReverts } = await supabase
        .from('agreement_import_reverts')
        .select('id')
        .eq('import_id', id);
        
      if (relatedReverts && relatedReverts.length > 0) {
        const { error: revertDeleteError } = await supabase
          .from('agreement_import_reverts')
          .delete()
          .eq('import_id', id);
          
        if (revertDeleteError) {
          console.error(`Failed to delete related revert records for ${id}:`, revertDeleteError);
        }
      }
      
      const { data: trafficFines, error: trafficFinesError } = await supabase
        .from('traffic_fines')
        .select('id')
        .eq('agreement_id', id);
        
      if (!trafficFinesError && trafficFines && trafficFines.length > 0) {
        const { error: finesDeleteError } = await supabase
          .from('traffic_fines')
          .delete()
          .eq('agreement_id', id);
          
        if (finesDeleteError) {
          console.error(`Failed to delete related traffic fines for ${id}:`, finesDeleteError);
        }
      }
      
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(`Failed to delete agreement: ${error.message}`);
      }
      
      return true;
    });
  }

  /**
   * Calculate remaining amount for an agreement
   */
  async calculateRemainingAmount(agreementId: string): Promise<ServiceResult<number>> {
    return handleServiceOperation(async () => {
      // Get agreement details
      const agreementResponse = await this.repository.findById(agreementId);
      if (agreementResponse.error) {
        throw new Error(`Failed to fetch agreement: ${agreementResponse.error.message}`);
      }
      
      const agreement = agreementResponse.data;
      
      // Get all payments for this agreement
      const paymentsResponse = await paymentRepository.findByLeaseId(agreementId);
      if (paymentsResponse.error) {
        throw new Error(`Failed to fetch payments: ${paymentsResponse.error.message}`);
      }
      
      // Calculate total paid amount
      const totalPaid = paymentsResponse.data.reduce((sum, payment) => {
        return sum + (payment.amount_paid || 0);
      }, 0);
      
      // Calculate remaining amount
      const totalAmount = agreement.total_amount || 0;
      const remainingAmount = Math.max(0, totalAmount - totalPaid);
      
      return remainingAmount;
    });
  }
}

// Create singleton instance
export const agreementService = new AgreementService();
