import { supabase } from '@/lib/supabase';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { asLeaseId } from '@/utils/database-type-helpers';
import { ensureValidLeaseStatus } from '@/types/lease-types';
import { BaseService } from '@/services/base/BaseService';
import { agreementDeletionService } from './AgreementDeletionService';
import { Result } from '@/types/response.types';
import { 
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
  created_date_after?: string;
  created_date_before?: string;
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
      console.log('📊 AgreementService.fetchAgreements called with filters:', filters);
      
      const selectClause = `
        *,
        customers:profiles(*),
        vehicles${filters?.license_plate ? '!inner' : ''}(*)
      `;
      let query = supabase.from('leases').select(selectClause);
      
      // Apply basic filters first
      if (filters?.statuses && filters.statuses.length > 0) {
        console.log('🔍 Applying status filter:', filters.statuses);
        query = query.in('status', filters.statuses);
      }
      
      if (filters?.customerId) {
        console.log('🔍 Applying customer filter:', filters.customerId);
        query = query.eq('customer_id', filters.customerId);
      }
      
      if (filters?.vehicleId) {
        console.log('🔍 Applying vehicle filter:', filters.vehicleId);
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

      if (filters?.created_date_after) {
        query = query.gte('created_at', filters.created_date_after);
      }

      if (filters?.created_date_before) {
        query = query.lte('created_at', filters.created_date_before);
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

      // Handle search functionality - only if searchTerm exists
      if (filters?.searchTerm && filters.searchTerm.trim() !== '') {
        console.log('🔍 Applying search term:', filters.searchTerm);
        const searchTerm = filters.searchTerm.trim();
        
        try {
          // Enhanced search: combine multiple search strategies
          const [agreementsByNumber, vehiclesByPlate, customers] = await Promise.allSettled([
            // Search for agreement number directly
            supabase
              .from('leases')
              .select(`*, customers:profiles(*), vehicles(*)`)
              .ilike('agreement_number', `%${searchTerm}%`),
            
            // Search for vehicle license plates
            supabase
              .from('vehicles')
              .select('id')
              .ilike('license_plate', `%${searchTerm}%`),
            
            // Search for customer names
            supabase
              .from('profiles')
              .select('id')
              .ilike('full_name', `%${searchTerm}%`)
          ]);

          const allResults: any[] = [];

          // Process agreement number results
          if (agreementsByNumber.status === 'fulfilled' && agreementsByNumber.value.data) {
            allResults.push(...agreementsByNumber.value.data);
          } else if (agreementsByNumber.status === 'rejected') {
            console.warn('Error searching by agreement number:', agreementsByNumber.reason);
          }

          // Process vehicle results
          if (vehiclesByPlate.status === 'fulfilled' && vehiclesByPlate.value.data) {
            const vehicleIds = vehiclesByPlate.value.data.map((v: any) => v.id);
            if (vehicleIds.length > 0) {
              const vehicleAgreementsResult = await supabase
                .from('leases')
                .select(`*, customers:profiles(*), vehicles(*)`)
                .in('vehicle_id', vehicleIds);
              
              if (vehicleAgreementsResult.data) {
                allResults.push(...vehicleAgreementsResult.data);
              }
            }
          } else if (vehiclesByPlate.status === 'rejected') {
            console.warn('Error searching vehicles by license plate:', vehiclesByPlate.reason);
          }

          // Process customer results
          if (customers.status === 'fulfilled' && customers.value.data) {
            const customerIds = customers.value.data.map((c: any) => c.id);
            if (customerIds.length > 0) {
              const customerAgreementsResult = await supabase
                .from('leases')
                .select(`*, customers:profiles(*), vehicles(*)`)
                .in('customer_id', customerIds);
              
              if (customerAgreementsResult.data) {
                allResults.push(...customerAgreementsResult.data);
              }
            }
          } else if (customers.status === 'rejected') {
            console.warn('Error searching customers by name:', customers.reason);
          }

          // Remove duplicates based on agreement ID
          const uniqueResults = allResults.filter((agreement, index, self) => 
            index === self.findIndex((a) => a.id === agreement.id)
          );

          console.log(`🔍 Search found ${uniqueResults.length} unique results`);
          return uniqueResults as unknown as Agreement[];
        } catch (searchError) {
          console.error('Error in search functionality:', searchError);
          // Fallback to regular query if search fails
        }
      }

      // Execute the main query (either with filters or as fallback)
      console.log('📊 Executing main query...');
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database error in fetchAgreements:', error);
        throw this.createServiceError(
          `Failed to fetch agreements: ${error.message}`,
          'fetchAgreements'
        );
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} agreements`);
      
      if (!data || !Array.isArray(data)) {
        return [] as Agreement[];
      }
      return data as unknown as Agreement[];
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
        throw createNotFoundError('Agreement not found', { id });
      }

      return data;
    }, 'Failed to fetch agreement');
  }

  private async generateAgreementNumber(): Promise<string> {
    console.log('Generating new agreement number...');
    
    try {
      // Use the atomic Postgres function to get the next agreement number
      const { data, error } = await supabase.rpc('get_next_agreement_number');
      
      if (error) {
        console.error('Error calling get_next_agreement_number:', error);
        throw new Error(`Failed to generate agreement number: ${error.message}`);
      }
      
      if (!data) {
        console.error('No data returned from get_next_agreement_number');
        throw new Error('Failed to generate agreement number: No data returned');
      }
      
      console.log('Generated agreement number:', data);
      return data;
    } catch (error) {
      console.error('Exception in generateAgreementNumber:', error);
      throw new Error(`Failed to generate agreement number: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

      // Always generate a new agreement number for new agreements
      let agreementNumber: string;
      try {
        agreementNumber = await this.generateAgreementNumber();
        console.log('Using generated agreement number:', agreementNumber);
      } catch (error) {
        console.error('Failed to generate agreement number:', error);
        throw this.createServiceError(
          'Failed to generate unique agreement number',
          'createAgreement'
        );
      }

      const insertData = {
        vehicle_id: agreementData.vehicle_id,
        customer_id: agreementData.customer_id,
        agreement_number: agreementNumber, // Always use the generated number
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
      };

      console.log('Creating agreement with data:', insertData);

      const { data, error } = await supabase
        .from('leases')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating agreement:', error);
        
        // Handle unique constraint violation specifically
        if (error.code === '23505' && error.message.includes('agreement_number')) {
          throw this.createServiceError(
            'Agreement number already exists. Please try again.',
            'createAgreement'
          );
        }
        
        throw this.createServiceError(
          'Failed to create agreement',
          'createAgreement'
        );
      }

      console.log('Agreement created successfully:', data);
      
      // إنشاء جدولة المدفوعات التلقائية للاتفاقية الجديدة
      if (data && data.id && agreementData.rent_amount && agreementData.rent_amount > 0) {
        console.log('Creating automatic payment schedule for new agreement:', data.id);
        
        try {
          // استيراد خدمة المدفوعات بشكل ديناميكي لتجنب المراجع الدائرية
          const { agreementPaymentService } = await import('./AgreementPaymentService');
          
          const paymentScheduleResult = await agreementPaymentService.createPaymentScheduleForAgreement({
            ...data,
            start_date: data.start_date,
            end_date: data.end_date,
            rent_amount: data.rent_amount,
            payment_frequency: agreementData.payment_frequency || 'monthly',
            payment_day: agreementData.payment_day || data.rent_due_day || 1,
            deposit_amount: data.deposit_amount || 0
          });

          if (paymentScheduleResult.success) {
            console.log(`تم إنشاء ${paymentScheduleResult.scheduleCount} جدولة دفعات و ${paymentScheduleResult.paymentCount} دفعة للاتفاقية ${data.id}`);
          } else {
            console.warn('فشل في إنشاء جدولة المدفوعات التلقائية:', paymentScheduleResult.error);
            // لا نرمي خطأ هنا لأن الاتفاقية تم إنشاؤها بنجاح
            // يمكن إنشاء الجدولة لاحقاً
          }
        } catch (paymentError) {
          console.warn('خطأ في إنشاء جدولة المدفوعات التلقائية:', paymentError);
          // لا نرمي خطأ هنا لأن الاتفاقية تم إنشاؤها بنجاح
        }
      }
      
      return data;
    }, 'Failed to create agreement');
  }

  async updateAgreement(id: string, agreementData: Partial<Agreement>): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      // For updates, only generate new agreement number if one is not provided AND the existing one is empty
      let agreementNumber = agreementData.agreement_number;
      
      if (!agreementNumber) {
        // Get the existing agreement to check if it has an agreement number
        const existing = await this.getAgreementById(id);
        if (existing.success && !existing.data.agreement_number) {
          // Only generate new number if the existing agreement doesn't have one
          agreementNumber = await this.generateAgreementNumber();
        }
      }

      // إنشاء object للتحديث يحتوي فقط على الحقول الموجودة في جدول leases
      const updateData: any = {};
      
      // إضافة الحقول الموجودة فقط إذا كانت محددة
      if (agreementData.vehicle_id !== undefined) updateData.vehicle_id = agreementData.vehicle_id;
      if (agreementData.customer_id !== undefined) updateData.customer_id = agreementData.customer_id;
      if (agreementNumber !== undefined) updateData.agreement_number = agreementNumber;
      if (agreementData.start_date !== undefined) updateData.start_date = agreementData.start_date;
      if (agreementData.end_date !== undefined) updateData.end_date = agreementData.end_date;
      if (agreementData.status !== undefined) updateData.status = ensureValidLeaseStatus(agreementData.status);
      if (agreementData.deposit_amount !== undefined) updateData.deposit_amount = agreementData.deposit_amount;
      if (agreementData.total_amount !== undefined) updateData.total_amount = agreementData.total_amount;
      if (agreementData.rent_amount !== undefined) updateData.rent_amount = agreementData.rent_amount;
      if (agreementData.daily_late_fee !== undefined) updateData.daily_late_fee = agreementData.daily_late_fee;
      if (agreementData.agreement_type !== undefined) updateData.agreement_type = agreementData.agreement_type;
      if (agreementData.agreement_duration !== undefined) updateData.agreement_duration = agreementData.agreement_duration;
      if (agreementData.payment_day !== undefined || agreementData.rent_due_day !== undefined) {
        updateData.rent_due_day = agreementData.rent_due_day ?? agreementData.payment_day;
      }
      if (agreementData.notes !== undefined) updateData.notes = agreementData.notes;
      if (agreementData.payment_frequency !== undefined) updateData.payment_frequency = agreementData.payment_frequency;
      
      // إضافة updated_at دائماً
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('leases')
        .update(updateData)
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
        throw createNotFoundError('Agreement not found', { id });
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
}

export const agreementService = new AgreementService();
