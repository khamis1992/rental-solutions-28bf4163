import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { doesLicensePlateMatch, isLicensePlatePattern } from '@/utils/searchUtils';
import { FlattenType } from '@/utils/type-utils';

interface SearchParams {
  query?: string;
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
}

// Use FlattenType to prevent excessive type instantiation
type SimpleAgreement = Omit<Agreement, 'customers' | 'vehicles'> & {
  customers?: Record<string, any>;
  vehicles?: Record<string, any>;
};

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
        .select('*')
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

      let customerData = null;
      let vehicleData = null;

      if (data.customer_id) {
        try {
          const { data: customer, error: customerError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone_number, driver_license, nationality, address')
            .eq('id', data.customer_id)
            .maybeSingle();

          if (customerError) {
            console.error("Error fetching customer:", customerError);
          } else if (customer) {
            console.log("Customer data fetched:", customer);
            customerData = customer;
          } else {
            console.log(`No customer found with ID: ${data.customer_id}`);
          }
        } catch (customerFetchError) {
          console.error("Error in customer data fetch:", customerFetchError);
        }
      }

      if (data.vehicle_id) {
        try {
          const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id, make, model, license_plate, image_url, year, color, vin')
            .eq('id', data.vehicle_id)
            .maybeSingle();

          if (vehicleError) {
            console.error("Error fetching vehicle:", vehicleError);
          } else if (vehicle) {
            console.log("Vehicle data fetched:", vehicle);
            vehicleData = vehicle;
          } else {
            console.log(`No vehicle found with ID: ${data.vehicle_id}`);
          }
        } catch (vehicleFetchError) {
          console.error("Error in vehicle data fetch:", vehicleFetchError);
        }
      }

      let mappedStatus: typeof AgreementStatus[keyof typeof AgreementStatus] = AgreementStatus.DRAFT;

      switch(data.status) {
        case 'active':
          mappedStatus = AgreementStatus.ACTIVE;
          break;
        case 'pending_payment':
        case 'pending_deposit':
          mappedStatus = AgreementStatus.PENDING;
          break;
        case 'cancelled':
          mappedStatus = AgreementStatus.CANCELLED;
          break;
        case 'completed':
        case 'terminated':
          mappedStatus = AgreementStatus.CLOSED;
          break;
        case 'archived':
          mappedStatus = AgreementStatus.EXPIRED;
          break;
        default:
          mappedStatus = AgreementStatus.DRAFT;
      }

      const agreement: SimpleAgreement = {
        id: data.id,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        status: mappedStatus,
        created_at: data.created_at ? new Date(data.created_at) : undefined,
        updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
        total_amount: data.total_amount || 0,
        deposit_amount: data.deposit_amount || 0, 
        agreement_number: data.agreement_number || '',
        notes: data.notes || '',
        terms_accepted: true,
        additional_drivers: [],
        customers: customerData,
        vehicles: vehicleData,
        signature_url: (data as any).signature_url
      };

      return agreement;
    } catch (err) {
      console.error("Unexpected error in getAgreement:", err);
      toast.error("An unexpected error occurred while loading agreement details");
      return null;
    }
  };

  // Helper to map database status values to the enum values
  const mapStatusFromDatabase = (status: string): any => {
    switch(status) {
      case 'active': return AgreementStatus.ACTIVE;
      case 'pending_payment':
      case 'pending_deposit': return AgreementStatus.PENDING;
      case 'cancelled': return AgreementStatus.CANCELLED;
      case 'completed':
      case 'terminated': return AgreementStatus.CLOSED;
      case 'archived': return AgreementStatus.EXPIRED;
      default: return AgreementStatus.DRAFT;
    }
  };

  // Use a type assertion to solve deep type instantiation
  type QueryResponse = SimpleAgreement[];

  const fetchAgreements = async (): Promise<QueryResponse> => {
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
        
        // First try to get any agreements where the vehicle license plate matches the query
        if (searchQuery) {
          // Use a join pattern that ensures we don't lose the related data
          const { data: vehicleIds, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id')
            .ilike('license_plate', `%${searchQuery}%`);
          
          if (vehicleError) {
            console.error("Error searching vehicles:", vehicleError);
          } else if (vehicleIds && vehicleIds.length > 0) {
            // If we found matching vehicles, filter leases by those vehicle IDs
            const ids = vehicleIds.map(v => v.id);
            query = query.in('vehicle_id', ids);
            console.log("Filtering by vehicle IDs:", ids);
          } else {
            // If no vehicles match, try to match against customer names
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

      console.log(`Found ${data.length} agreements`);

      // Use type assertion to avoid deep type instantiation
      const agreements = data.map(item => ({
        id: item.id,
        customer_id: item.customer_id,
        vehicle_id: item.vehicle_id,
        start_date: new Date(item.start_date),
        end_date: new Date(item.end_date),
        status: mapStatusFromDatabase(item.status),
        created_at: item.created_at ? new Date(item.created_at) : undefined,
        updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
        total_amount: item.total_amount || 0,
        deposit_amount: item.deposit_amount || 0,
        agreement_number: item.agreement_number || '',
        notes: item.notes || '',
        terms_accepted: true,
        additional_drivers: [],
        customers: item.profiles,
        vehicles: item.vehicles,
        signature_url: (item as any).signature_url
      })) as QueryResponse;

      return agreements;
    } catch (err) {
      console.error("Unexpected error in fetchAgreements:", err);
      throw err;
    }
  };

  const createAgreement = async (data: Partial<SimpleAgreement>) => {
    return {} as SimpleAgreement;
  };

  // Use a simplified type for the mutation parameters
  type UpdateMutationParams = {
    id: string;
    data: Record<string, any>;
  };

  const updateAgreementMutation = useMutation({
    mutationFn: async (params: UpdateMutationParams) => {
      console.log("Update mutation called with:", params);
      
      // Implementation would go here
      // This is just a placeholder
      return {} as SimpleAgreement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
  });

  const updateAgreement = updateAgreementMutation;

  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      console.log(`Starting deletion process for agreement ${id}`);
      
      try {
        // Step 1: Delete related overdue_payments records first (foreign key constraint)
        const { error: overduePaymentsDeleteError } = await supabase
          .from('overdue_payments')
          .delete()
          .eq('agreement_id', id);
          
        if (overduePaymentsDeleteError) {
          console.error(`Failed to delete related overdue payments for ${id}:`, overduePaymentsDeleteError);
        }
        
        // Step 2: Delete related unified_payments records
        const { error: paymentDeleteError } = await supabase
          .from('unified_payments')
          .delete()
          .eq('lease_id', id);
          
        if (paymentDeleteError) {
          console.error(`Failed to delete related payments for ${id}:`, paymentDeleteError);
        }
        
        // Step 3: Delete related import revert records
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
        
        // Step 4: Check for any other potential related records
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
        
        // Finally: Delete the agreement itself
        const { error } = await supabase
          .from('leases')
          .delete()
          .eq('id', id);
          
        if (error) {
          console.error(`Failed to delete agreement ${id}:`, error);
          throw new Error(`Failed to delete agreement: ${error.message}`);
        }
        
        return id;
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
    queryKey: ['agreements', searchParams] as const,
    queryFn: () => fetchAgreements(),
    staleTime: 30000,
    gcTime: 60000,
  });

  return {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    getAgreement,
    createAgreement: async () => ({} as SimpleAgreement), // Simplified placeholder
    updateAgreement,
    deleteAgreement,
  };
};
