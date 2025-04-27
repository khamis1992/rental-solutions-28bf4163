
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { useErrorStore } from './useErrorStore';
import { getResponseData } from '@/utils/supabase-type-helpers';

type SimpleAgreement = {
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
  customers?: Record<string, any> | null;
  vehicles?: Record<string, any> | null;
};

interface AgreementState {
  // State
  agreements: SimpleAgreement[];
  currentAgreement: SimpleAgreement | null;
  isLoading: boolean;
  error: Error | null;
  searchParams: SearchParams;
  
  // Actions
  setSearchParams: (params: SearchParams) => void;
  fetchAgreements: () => Promise<void>;
  getAgreement: (id: string) => Promise<SimpleAgreement | null>;
  deleteAgreement: (id: string) => Promise<boolean>;
  updateAgreement: (id: string, data: Partial<Agreement>) => Promise<boolean>;
}

export interface SearchParams {
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
  query?: string;
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

export const useAgreementStore = create<AgreementState>()(
  devtools(
    (set, get) => ({
      agreements: [],
      currentAgreement: null,
      isLoading: false,
      error: null,
      searchParams: { status: 'all' },
      
      setSearchParams: (params) => {
        set((state) => ({
          searchParams: { ...state.searchParams, ...params }
        }));
        
        // Auto-fetch when search params change
        get().fetchAgreements();
      },
      
      fetchAgreements: async () => {
        const { searchParams } = get();
        set({ isLoading: true, error: null });
        
        try {
          console.log("Fetching agreements with params:", searchParams);
          
          let query = supabase
            .from('leases')
            .select(`
              *,
              profiles:customer_id (id, full_name, email, phone_number),
              vehicles:vehicle_id (id, make, model, license_plate, image_url, year, color, vin)
            `);

          if (searchParams.status && searchParams.status !== 'all') {
            switch(searchParams.status) {
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
                if (typeof searchParams.status === 'string') {
                  query = query.filter('status', 'eq', searchParams.status);
                }
            }
          }

          if (searchParams.query) {
            const searchQuery = searchParams.query.trim().toLowerCase();
            
            query = query.or(`
              agreement_number.ilike.%${searchQuery}%,
              profiles.full_name.ilike.%${searchQuery}%,
              vehicles.license_plate.ilike.%${searchQuery}%,
              vehicles.make.ilike.%${searchQuery}%,
              vehicles.model.ilike.%${searchQuery}%
            `);
          }

          if (searchParams.vehicle_id) {
            query = query.eq('vehicle_id', searchParams.vehicle_id);
          }

          if (searchParams.customer_id) {
            query = query.eq('customer_id', searchParams.customer_id);
          }

          const { data, error } = await query;

          if (error) {
            throw new Error(`Failed to fetch agreements: ${error.message}`);
          }

          const agreements: SimpleAgreement[] = (data || []).map(item => {
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
              customers: item.profiles,
              vehicles: item.vehicles,
              signature_url: (item as any).signature_url
            };
          });
          
          set({ agreements, isLoading: false });
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Unknown error fetching agreements');
          console.error("Error in fetchAgreements:", error);
          set({ error, isLoading: false });
          
          // Log to error store
          useErrorStore.getState().addError({
            message: error.message,
            stack: error.stack,
            severity: 'error',
            handled: false,
            context: { searchParams }
          });
        }
      },
      
      getAgreement: async (id: string) => {
        set((state) => ({ 
          isLoading: true,
          error: null 
        }));
        
        try {
          console.log(`Fetching agreement details for ID: ${id}`);

          if (!id || id.trim() === '') {
            throw new Error("Invalid agreement ID provided");
          }

          const { data, error } = await supabase
            .from('leases')
            .select(`
              *,
              profiles:customer_id (id, full_name, email, phone_number, driver_license, nationality, address),
              vehicles:vehicle_id (id, make, model, license_plate, image_url, year, color, vin)
            `)
            .eq('id', id)
            .maybeSingle();

          if (error) {
            throw new Error(`Failed to load agreement details: ${error.message}`);
          }

          if (!data) {
            throw new Error(`No lease data found for ID: ${id}`);
          }

          const typedData = data as any;
          const mappedStatus = mapDBStatusToEnum(typedData.status);

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
            customers: typedData.profiles,
            vehicles: typedData.vehicles,
            signature_url: typedData.signature_url
          };
          
          set({ 
            currentAgreement: agreement,
            isLoading: false
          });
          
          return agreement;
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Unknown error fetching agreement');
          console.error("Error in getAgreement:", error);
          
          set({ 
            error, 
            isLoading: false 
          });
          
          useErrorStore.getState().addError({
            message: error.message,
            stack: error.stack,
            severity: 'error',
            handled: false,
            context: { agreementId: id }
          });
          
          return null;
        }
      },
      
      deleteAgreement: async (id: string) => {
        try {
          console.log(`Starting deletion process for agreement ${id}`);
          
          // Delete related records in the proper order
          const { error: overduePaymentsDeleteError } = await supabase
            .from('overdue_payments')
            .delete()
            .eq('agreement_id', id);
            
          if (overduePaymentsDeleteError) {
            console.error(`Failed to delete related overdue payments: ${overduePaymentsDeleteError.message}`);
          }
          
          const { error: paymentDeleteError } = await supabase
            .from('unified_payments')
            .delete()
            .eq('lease_id', id);
            
          if (paymentDeleteError) {
            console.error(`Failed to delete related payments: ${paymentDeleteError.message}`);
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
              console.error(`Failed to delete related revert records: ${revertDeleteError.message}`);
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
              console.error(`Failed to delete related traffic fines: ${finesDeleteError.message}`);
            }
          }
          
          const { error } = await supabase
            .from('leases')
            .delete()
            .eq('id', id);
            
          if (error) {
            throw new Error(`Failed to delete agreement: ${error.message}`);
          }
          
          // Update local state after successful deletion
          set(state => ({
            agreements: state.agreements.filter(a => a.id !== id),
            currentAgreement: state.currentAgreement?.id === id ? null : state.currentAgreement
          }));
          
          return true;
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown error deleting agreement');
          console.error('Error in deleteAgreement:', err);
          
          useErrorStore.getState().addError({
            message: err.message,
            stack: err.stack,
            severity: 'error',
            handled: false,
            context: { agreementId: id }
          });
          
          return false;
        }
      },
      
      updateAgreement: async (id: string, data: Partial<Agreement>) => {
        try {
          const { error } = await supabase
            .from('leases')
            .update(data)
            .eq('id', id);
            
          if (error) {
            throw new Error(`Failed to update agreement: ${error.message}`);
          }
          
          // Update local state if needed
          set(state => {
            // Update in list
            const updatedAgreements = state.agreements.map(a => 
              a.id === id ? { ...a, ...data } : a
            );
            
            // Update current if it's the same one
            const updatedCurrent = state.currentAgreement?.id === id 
              ? { ...state.currentAgreement, ...data }
              : state.currentAgreement;
              
            return {
              agreements: updatedAgreements,
              currentAgreement: updatedCurrent as SimpleAgreement | null
            };
          });
          
          return true;
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown error updating agreement');
          console.error('Error in updateAgreement:', err);
          
          useErrorStore.getState().addError({
            message: err.message,
            stack: err.stack,
            severity: 'error',
            handled: false,
            context: { agreementId: id, updateData: data }
          });
          
          return false;
        }
      }
    })
  )
);
