
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { doesLicensePlateMatch, isLicensePlatePattern } from '@/utils/searchUtils';
import { BasicMutationResult } from '@/utils/type-utils';

export type SimpleAgreement = {
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
  notes?: string;
  customers?: Record<string, any> | null;
  vehicles?: Record<string, any> | null;
};

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
      return AgreementStatus.CLOSED;
    case 'archived':
      return AgreementStatus.EXPIRED;
    case 'draft':
      return AgreementStatus.DRAFT;
    default:
      return AgreementStatus.DRAFT;
  }
};

interface SearchParams {
  query?: string;
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
}

export const useAgreements = (initialFilters: SearchParams = {}) => {
  const [searchParams, setSearchParams] = useState<SearchParams>(initialFilters);
  const queryClient = useQueryClient();

  const getAgreement = async (id: string): Promise<SimpleAgreement | null> => {
    try {
      console.log(`Fetching agreement details for ID: ${id}`);

      if (!id || id.trim() === '') {
        console.error("Invalid agreement ID provided");
        toast.error("Invalid agreement ID");
        return null;
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
        console.error("Error fetching agreement from Supabase:", error);
        toast.error(`Failed to load agreement details: ${error.message}`);
        return null;
      }

      if (!data) {
        console.error(`No lease data found for ID: ${id}`);
        return null;
      }

      console.log("Raw lease data from Supabase:", data);

      const mappedStatus = mapDBStatusToEnum(data.status);

      const agreement: SimpleAgreement = {
        id: data.id,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        start_date: data.start_date,
        end_date: data.end_date,
        status: mappedStatus,
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_amount: data.total_amount || 0,
        deposit_amount: data.deposit_amount || 0, 
        agreement_number: data.agreement_number || '',
        notes: data.notes || '',
        customers: data.profiles,
        vehicles: data.vehicles,
        signature_url: (data as any).signature_url
      };

      console.log("Transformed agreement data:", agreement);
      return agreement;
    } catch (err) {
      console.error("Unexpected error in getAgreement:", err);
      toast.error("An unexpected error occurred while loading agreement details");
      return null;
    }
  };

  const fetchAgreements = async (): Promise<SimpleAgreement[]> => {
    console.log("Fetching agreements with params:", searchParams);

    try {
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

      if (searchParams.vehicle_id) {
        query = query.eq('vehicle_id', searchParams.vehicle_id);
      }

      if (searchParams.customer_id) {
        query = query.eq('customer_id', searchParams.customer_id);
      }

      if (searchParams.query && searchParams.query.trim() !== '') {
        const searchQuery = searchParams.query.trim().toLowerCase();
        
        if (searchQuery) {
          const { data: vehicleIds, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id')
            .ilike('license_plate', `%${searchQuery}%`);
          
          if (vehicleError) {
            console.error("Error searching vehicles:", vehicleError);
          } else if (vehicleIds && vehicleIds.length > 0) {
            const ids = vehicleIds.map(v => v.id);
            query = query.in('vehicle_id', ids);
            console.log("Filtering by vehicle IDs:", ids);
          } else {
            query = query.ilike('profiles.full_name', `%${searchQuery}%`);
          }
        }
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

      console.log(`Found ${data.length} agreements`, data);

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
          agreement_number: item.agreement_number || '',
          notes: item.notes || '',
          customers: item.profiles,
          vehicles: item.vehicles,
          signature_url: (item as any).signature_url
        };
      });

      return agreements;
    } catch (err) {
      console.error("Unexpected error in fetchAgreements:", err);
      throw err;
    }
  };

  const createAgreement = async (data: Partial<SimpleAgreement>): Promise<SimpleAgreement> => {
    return {} as SimpleAgreement;
  };

  // Fix the excessive type depth issue by using BasicMutationResult type
  const updateAgreementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      console.log("Update mutation called with:", { id, data });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
  });

  // Use a simplified type to avoid excessive type instantiation
  const updateAgreement: BasicMutationResult = {
    mutateAsync: updateAgreementMutation.mutateAsync,
    isPending: updateAgreementMutation.isPending,
    isError: updateAgreementMutation.isError,
    error: updateAgreementMutation.error
  };

  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      console.log(`Starting deletion process for agreement ${id}`);
      
      try {
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
          console.error(`Failed to delete agreement ${id}:`, error);
          throw new Error(`Failed to delete agreement: ${error.message}`);
        }
        
        return { success: true, data: id };
      } catch (error) {
        console.error('Error in deleteAgreement:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Agreement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete agreement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const { data: agreements, isLoading, error } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: fetchAgreements,
    staleTime: 600000,
    gcTime: 900000,
  });

  return {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    getAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement,
  };
};
