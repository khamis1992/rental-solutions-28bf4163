
import { supabase } from '@/integrations/supabase/client';
import { DbResult, LeaseRow, isValidDbResponse } from '@/services/core/database-types';
import { toast } from 'sonner';
import { createTableQuery, executeQuery, asDbId, asDbStatus } from '@/services/core/database-utils';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';

// Re-export the query builder for convenience
export const leaseQuery = createTableQuery('leases');

export interface FetchAgreementsOptions {
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
  query?: string;
}

export interface SimpleAgreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date?: string | null;
  end_date?: string | null;
  agreement_type?: string;
  agreement_number?: string;
  status?: string;
  total_amount?: number;
  monthly_payment?: number;
  agreement_duration?: any;
  customer_name?: string;
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  created_at?: string;
  updated_at?: string;
  signature_url?: string;
  deposit_amount?: number;
  rent_amount?: number;
  daily_late_fee?: number;
  notes?: string;
  customer?: Record<string, any> | null;
  vehicle?: Record<string, any> | null;
}

export const mapDBStatusToEnum = (dbStatus: string): typeof AgreementStatus[keyof typeof AgreementStatus] => {
  switch(dbStatus) {
    case 'active':
      return AgreementStatus.ACTIVE;
    case 'pending_payment':
    case 'pending_deposit':
      return AgreementStatus.PENDING;
    case 'cancelled':
      return AgreementStatus.CANCELLED;
    case 'completed':
    case 'terminated':
    case 'closed':
      return AgreementStatus.CLOSED;
    case 'archived':
      return AgreementStatus.EXPIRED;
    case 'draft':
      return AgreementStatus.DRAFT;
    default:
      return AgreementStatus.DRAFT;
  }
};

/**
 * Service for managing agreements/leases
 */
export class AgreementService {
  /**
   * Fetch a single agreement by ID with related data
   */
  static async getAgreement(id: string): Promise<SimpleAgreement | null> {
    try {
      console.log(`Fetching agreement details for ID: ${id}`);

      if (!id || id.trim() === '') {
        console.error("Invalid agreement ID provided");
        toast.error("Invalid agreement ID");
        return null;
      }

      const response = await supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id (id, full_name, email, phone_number, driver_license, nationality, address),
          vehicles:vehicle_id (id, make, model, license_plate, image_url, year, color, vin)
        `)
        .eq('id', id)
        .maybeSingle();

      if (response.error) {
        console.error("Error fetching agreement from Supabase:", response.error);
        toast.error(`Failed to load agreement details: ${response.error.message}`);
        return null;
      }

      if (!response.data) {
        console.error(`No lease data found for ID: ${id}`);
        return null;
      }

      const typedData = response.data as any;
      const mappedStatus = mapDBStatusToEnum(typedData.status);

      // Map the data to our SimpleAgreement type
      const agreement: SimpleAgreement = {
        id: typedData.id,
        customer_id: typedData.customer_id,
        vehicle_id: typedData.vehicle_id,
        start_date: typedData.start_date,
        end_date: typedData.end_date,
        status: mappedStatus,
        created_at: typedData.created_at,
        updated_at: typedData.updated_at,
        total_amount: typedData.total_amount || 0,
        deposit_amount: typedData.deposit_amount || 0,
        rent_amount: typedData.rent_amount || 0,
        daily_late_fee: typedData.daily_late_fee || 120.0,
        agreement_number: typedData.agreement_number || '',
        notes: typedData.notes || '',
        customer: typedData.profiles,
        vehicle: typedData.vehicles,
        signature_url: typedData.signature_url
      };

      return agreement;
    } catch (err) {
      console.error("Unexpected error in getAgreement:", err);
      toast.error("An unexpected error occurred while loading agreement details");
      return null;
    }
  }

  /**
   * Fetch agreements with optional filtering
   */
  static async fetchAgreements(options: FetchAgreementsOptions = {}): Promise<SimpleAgreement[]> {
    console.log("Fetching agreements with options:", options);

    try {
      let query = supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id (id, full_name, email, phone_number),
          vehicles:vehicle_id (id, make, model, license_plate, image_url, year, color, vin)
        `);

      if (options.status && options.status !== 'all') {
        switch(options.status) {
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
            if (typeof options.status === 'string') {
              query = query.filter('status', 'eq', options.status);
            }
        }
      }

      if (options.query) {
        const searchQuery = options.query.trim().toLowerCase();
        
        query = query.or(`
          agreement_number.ilike.%${searchQuery}%,
          profiles.full_name.ilike.%${searchQuery}%,
          vehicles.license_plate.ilike.%${searchQuery}%,
          vehicles.make.ilike.%${searchQuery}%,
          vehicles.model.ilike.%${searchQuery}%
        `);
      }

      if (options.vehicle_id) {
        query = query.eq('vehicle_id', options.vehicle_id);
      }

      if (options.customer_id) {
        query = query.eq('customer_id', options.customer_id);
      }

      console.log("Executing Supabase query...");
      const { data, error } = await query;

      if (error) {
        console.error("Error fetching agreements:", error);
        throw new Error(`Failed to fetch agreements: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log("No agreements found with the given filters");
        return [];
      }

      // Map database results to SimpleAgreement type
      const agreements: SimpleAgreement[] = data.map(item => {
        const mappedStatus = mapDBStatusToEnum(item.status);

        return {
          id: item.id,
          customer_id: item.customer_id,
          vehicle_id: item.vehicle_id,
          start_date: item.start_date,
          end_date: item.end_date,
          status: mappedStatus,
          created_at: item.created_at,
          updated_at: item.updated_at,
          total_amount: item.total_amount || 0,
          deposit_amount: item.deposit_amount || 0,
          rent_amount: item.rent_amount || 0,
          daily_late_fee: item.daily_late_fee || 120.0,
          agreement_number: item.agreement_number || '',
          notes: item.notes || '',
          customer: item.profiles,
          vehicle: item.vehicles,
          signature_url: (item as any).signature_url
        };
      });

      return agreements;
    } catch (err) {
      console.error("Unexpected error in fetchAgreements:", err);
      throw err;
    }
  }

  /**
   * Create a new agreement
   */
  static async createAgreement(data: Partial<LeaseRow>): Promise<LeaseRow | null> {
    return executeQuery<LeaseRow>(
      () => supabase.from('leases').insert(data).select().single(),
      'Failed to create agreement'
    );
  }

  /**
   * Update an existing agreement
   */
  static async updateAgreement(id: string, data: Partial<LeaseRow>): Promise<LeaseRow | null> {
    return executeQuery<LeaseRow>(
      () => supabase.from('leases').update(data).eq('id', id).select().single(),
      `Failed to update agreement ${id}`
    );
  }

  /**
   * Delete an agreement and its related data
   */
  static async deleteAgreement(id: string): Promise<boolean> {
    console.log(`Starting deletion process for agreement ${id}`);
    
    try {
      // First delete related data
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
      
      // Check for related reverts
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
      
      // Check for traffic fines
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
      
      // Finally delete the agreement itself
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error(`Failed to delete agreement ${id}:`, error);
        toast.error(`Failed to delete agreement: ${error.message}`);
        return false;
      }
      
      toast.success('Agreement deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error in deleteAgreement:', error);
      toast.error(`Failed to delete agreement: ${error.message || 'Unknown error'}`);
      return false;
    }
  }
}
